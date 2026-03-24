import logging
import asyncio
from fastapi import APIRouter, HTTPException

from models import FullAnalyzeRequest, FullAnalyzeResponse, RiskLevel
from services.url_analyzer import analyze_url
from services.threat_intelligence import check_threat
from services.content_analyzer import analyze_content
from services.ai_service import generate_full_summary
from services.detection_engine import compute_combined_risk_score, risk_level_from_score

logger = logging.getLogger("netsecai.routers.full")
router = APIRouter()


@router.post("/full", response_model=FullAnalyzeResponse)
async def full_analyze(request: FullAnalyzeRequest):
    """
    Run a comprehensive security analysis on a URL:
    URL analysis + optional threat intelligence + optional content analysis.
    Produces an AI-generated executive summary when explain=True.
    """
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    logger.info("Full analysis started for: %s", url)

    # ── Phase 1: URL Analysis (always runs) ──────────────────────────────
    try:
        url_result = await analyze_url(url)
    except Exception as exc:
        logger.error("URL analysis error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"URL analysis failed: {exc}")

    # ── Phase 2: Threat Intel + Content (optional, run in parallel) ──────
    threat_result = None
    content_result = None

    tasks = []
    task_labels = []

    if request.include_threat_intel:
        tasks.append(check_threat(url))
        task_labels.append("threat")

    if request.include_content:
        tasks.append(analyze_content(url))
        task_labels.append("content")

    if tasks:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for label, result in zip(task_labels, results):
            if isinstance(result, Exception):
                logger.warning("%s analysis failed (non-fatal): %s", label, result)
            elif label == "threat":
                threat_result = result
            elif label == "content":
                content_result = result

    # ── Phase 3: Aggregate risk ───────────────────────────────────────────
    overall_score = compute_combined_risk_score(
        url_score=url_result.risk_score,
        threat_score=threat_result.reputation_score if threat_result else None,
        content_score=content_result.risk_score if content_result else None,
    )
    overall_level = risk_level_from_score(overall_score)

    # ── Phase 4: AI executive summary ─────────────────────────────────────
    executive_summary = None
    if request.explain:
        summary_data = {
            "url": url,
            "overall_risk_score": overall_score,
            "overall_risk_level": overall_level,
            "url_risk_score": url_result.risk_score,
            "url_vulnerabilities": [v.id for v in url_result.vulnerabilities],
            "threat_risk_score": threat_result.reputation_score if threat_result else None,
            "threat_category": threat_result.threat_category if threat_result else None,
            "content_risk_score": content_result.risk_score if content_result else None,
            "content_findings_count": len(content_result.findings) if content_result else None,
        }
        executive_summary = await generate_full_summary(summary_data)

    logger.info(
        "Full analysis complete: risk=%d (%s)", overall_score, overall_level
    )

    return FullAnalyzeResponse(
        url=url,
        url_analysis=url_result,
        threat_intel=threat_result,
        content_analysis=content_result,
        overall_risk_score=overall_score,
        overall_risk_level=overall_level,
        executive_summary=executive_summary,
    )
