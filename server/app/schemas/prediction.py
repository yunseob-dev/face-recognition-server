from pydantic import BaseModel, Field
from typing import List, Optional


class PredictionRequest(BaseModel):
    """Raw ONNX inference request; expects preprocessed image as nested list (e.g. [1, 3, 112, 112])."""
    input_data: List[List[float]] = Field(
        ...,
        description="Preprocessed image data (e.g. [1, 3, 112, 112] shape as list)",
        examples=[[[0.1, 0.2, 0.3]]]
    )
    request_id: str = Field(..., description="Client-generated request ID for tracing.")

class PredictionResponse(BaseModel):
    """Raw inference response: embedding vector and timing."""
    request_id: str
    prediction: List[float]
    execution_time: float
    status: str = "success"