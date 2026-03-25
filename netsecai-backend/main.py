import logging
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from routers import url_router, pcap_router, threat_router, content_router, full_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("netsecai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("NetSecAI backend starting up...")
    yield
    logger.info("NetSecAI backend shutting down...")



app = FastAPI(
    title="NetSecAI",
    description="AI-powered cybersecurity analysis platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


app.include_router(url_router.router, prefix="/api/url", tags=["URL Analyzer"])
app.include_router(pcap_router.router, prefix="/api/pcap", tags=["PCAP Analyzer"])
app.include_router(threat_router.router, prefix="/api/threat", tags=["Threat Intelligence"])
app.include_router(content_router.router, prefix="/api/content", tags=["Content Analyzer"])

app.include_router(full_router.router, prefix="/api/analyze", tags=["Full Analysis"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "NetSecAI"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
