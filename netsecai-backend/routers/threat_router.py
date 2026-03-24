import logging
from fastapi import APIRouter, HTTPException

from models import ThreatCheckRequest, ThreatCheckResponse
from services.threat_intelligence import check_threat
from services.ai_service import explain_threat_intel

logger = logging.getLogger("netsecai.routers.threat")
router = APIRouter()


@router.post("/check", response_model=ThreatCheckResponse)
async def threat_check(request: ThreatCheckRequest):
    """
    Check a URL or IP against VirusTotal and AbuseIPDB.
    Returns aggregated reputation score and threat classification.
    """
    if not request.target.strip():
        raise HTTPException(status_code=400, detail="Target cannot be empty")

    try:
        result = await check_threat(request.target.strip())
    except Exception as exc:
        logger.error("Threat check failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

    if request.explain:
        result.ai_explanation = await explain_threat_intel(result.model_dump())

    return result
