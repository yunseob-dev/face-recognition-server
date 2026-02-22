from fastapi import APIRouter
from app.services.ai_service import ai_service
from loguru import logger

router = APIRouter()


@router.get("/health")
def health_check():
    session = ai_service.session
    is_loaded = session is not None

    response = {
        "status": "healthy" if is_loaded else "degraded",
        "model_loaded": is_loaded,
        "device": str(session.get_providers()) if session else "None",
    }

    if not is_loaded:
        logger.warning("Health check: model not loaded")

    return response
