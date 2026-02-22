import numpy as np
import onnxruntime as ort
from app.core.config import settings
from loguru import logger


class ModelService:
    """Singleton ONNX face-embedding model; load once at startup, reuse per request."""

    def __init__(self):
        self.model_path = settings.MODEL_PATH
        self.session = None

    def load_model(self):
        """Loads the ONNX model; prefers CoreML on macOS, falls back to CPU."""
        logger.info(f"Model Path: {settings.MODEL_PATH}")

        providers = ['CoreMLExecutionProvider', 'CPUExecutionProvider']

        try:
            self.session = ort.InferenceSession(self.model_path, providers=providers)
            logger.info(f"ONNX providers: {self.session.get_providers()}")

            self.input_name = self.session.get_inputs()[0].name
            
        except Exception as e:
            logger.error(f"Model load failed: {e}")
            self.session = None
            raise e
    

    def inference(self, input_img):
        """Runs ONNX inference; returns embedding list. Expects NCHW float32 input."""
        if self.session is None:
            logger.error("Model not loaded")
            raise RuntimeError("Model is not loaded")
        
        try:
            if isinstance(input_img, list):
                input_tensor = np.array(input_img, dtype=np.float32)
            else:
                input_tensor = input_img.astype(np.float32)
            
            result = self.session.run(None, {self.input_name: input_tensor})

            return result[0].tolist()
        except Exception as e:
            logger.exception("Inference error")
            raise e    

ai_service = ModelService()