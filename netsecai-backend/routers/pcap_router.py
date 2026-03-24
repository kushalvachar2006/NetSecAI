import logging
import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from config import settings
from models import PCAPAnalyzeResponse
from services.pcap_analyzer import analyze_pcap
from services.ai_service import explain_pcap_analysis

logger = logging.getLogger("netsecai.routers.pcap")
router = APIRouter()


@router.post("/analyze", response_model=PCAPAnalyzeResponse)
async def pcap_analyze(
    file: UploadFile = File(..., description="PCAP or PCAPNG file"),
    explain: bool = Form(False),
):
    """
    Upload and analyse a PCAP file for anomalies, protocol stats, and suspicious traffic.
    """
    if not file.filename or not file.filename.lower().endswith((".pcap", ".pcapng", ".cap")):
        raise HTTPException(
            status_code=400,
            detail="File must be a PCAP (.pcap, .pcapng, .cap) file",
        )

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)

    if size_mb > settings.MAX_PCAP_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Maximum: {settings.MAX_PCAP_SIZE_MB} MB",
        )

    # Write to temp file for Scapy
    suffix = ".pcap" if file.filename.endswith(".pcap") else ".pcapng"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = await analyze_pcap(tmp_path)
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.error("PCAP analysis failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    if explain:
        result.ai_explanation = await explain_pcap_analysis(result.model_dump())

    return result
