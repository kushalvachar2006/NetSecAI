import logging
from fastapi import APIRouter, HTTPException

from models import ContentAnalyzeRequest, ContentAnalyzeResponse
from services.content_analyzer import analyze_content
from services.ai_service import explain_content_analysis

logger = logging.getLogger("netsecai.routers.content")
router = APIRouter()


@router.post("/analyze", response_model=ContentAnalyzeResponse)
async def content_analyze(request: ContentAnalyzeRequest):
    """
    Fetch and analyse a webpage for phishing forms, XSS patterns,
    suspicious scripts, and hidden redirects.
    """
    if not request.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    try:
        result = await analyze_content(request.url.strip())
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.error("Content analysis failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

    if request.explain:
        result.ai_explanation = await explain_content_analysis(result.model_dump())

    return result
