# app/api/endpoints/predict.py
import time
import json
import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.ai_service import ai_service
from app.db.session import get_db
from app.db.models import PredictionLog

router = APIRouter()

@router.post("/inference", response_model=PredictionResponse)
async def predict(
    request: PredictionRequest,
    db: AsyncSession = Depends(get_db)
):
    if ai_service.session is None:
        logger.error("Inference requested while model not loaded")
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    start_time = time.perf_counter()
    
    try:
        result_vector = ai_service.inference(request.input_data)
    except Exception as e:
        logger.exception(f"Inference failed: {e}")
        raise HTTPException(status_code=500, detail="Inference failed")
        
    execution_time = (time.perf_counter() - start_time) * 1000

    try:
        log_entry = PredictionLog(
            request_id=request.request_id,
            input_source="api_request",
            result_json=json.dumps(result_vector),
            execution_time=execution_time
        )
        db.add(log_entry)
        await db.commit()
        logger.info(f"Inference done: {request.request_id} | {execution_time:.2f}ms")
    except Exception as e:
        await db.rollback()
        logger.error(f"Prediction log save failed: {e}")
    
    return PredictionResponse(
        request_id=request.request_id,
        prediction=result_vector[0] if isinstance(result_vector[0], list) else result_vector,
        execution_time=execution_time
    )