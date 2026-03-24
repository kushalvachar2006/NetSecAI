import logging
from fastapi import APIRouter, HTTPException

from models import URLAnalyzeRequest, URLAnalyzeResponse
from services.url_analyzer import analyze_url
from services.ai_service import explain_url_analysis

logger = logging.getLogger("netsecai.routers.url")
router = APIRouter()


@router.post("/analyze", response_model=URLAnalyzeResponse)
async def url_analyze(request: URLAnalyzeRequest):
    """
    Analyse a URL for open ports, vulnerabilities, and attack vectors.
    Optionally include an AI-generated explanation.
    """
    try:
        result = await analyze_url(request.url)
    except Exception as exc:
        logger.error("URL analysis failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

    if request.explain:
        result.ai_explanation = await explain_url_analysis(result.model_dump())

    return result
