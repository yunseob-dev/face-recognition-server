import cv2
import numpy as np
from fastapi import UploadFile
from typing import Tuple, Optional, Union
from app.core.config import settings

detector: Optional[cv2.FaceDetectorYN] = None


def get_face_detector() -> Optional[cv2.FaceDetectorYN]:
    """Returns a lazy-loaded YuNet face detector singleton."""
    global detector
    if detector is None:
        try:
            detector = cv2.FaceDetectorYN.create(
                model=settings.DETECTION_MODEL_PATH,
                config="",
                input_size=(320, 320),
                score_threshold=settings.DETECTION_SCORE_THRESHOLD,
                nms_threshold=settings.DETECTION_NMS_THRESHOLD,
                top_k=5000
            )
        except Exception as e:
            print(f"Failed to load YuNet model: {e}")
            return None
    return detector

def pre_process(
    image: np.ndarray,
    target_size: Tuple[int, int] = (112, 112),
    return_resized: bool = False,
) -> Union[np.ndarray, Tuple[np.ndarray, np.ndarray]]:
    """Detects face, crops it, then resizes and normalizes to NCHW for the embedding model.
    When return_resized=True, also returns the resized BGR uint8 image (before normalization) for debug save."""
    face_detector = get_face_detector()
    if face_detector is None:
        out = _resize_and_normalize(image, target_size)
        if return_resized:
            resized = cv2.resize(image, target_size)
            return (out, resized)
        return out

    h, w, _ = image.shape
    face_detector.setInputSize((w, h))
    _, faces = face_detector.detect(image)

    face_img = image
    if faces is not None and len(faces) > 0:
        best_face_idx = np.argmax(faces[:, -1])
        best_face = faces[best_face_idx]
        box_x, box_y, box_w, box_h = map(int, best_face[:4])
        box_x = max(0, box_x)
        box_y = max(0, box_y)
        box_w = min(w - box_x, box_w)
        box_h = min(h - box_y, box_h)
        cropped = image[box_y:box_y+box_h, box_x:box_x+box_w]
        if cropped.size > 0:
            face_img = cropped

    if return_resized:
        resized = cv2.resize(face_img, target_size)
        tensor = _resize_and_normalize(face_img, target_size, pre_resized=resized)
        return (tensor, resized)
    return _resize_and_normalize(face_img, target_size)


def _resize_and_normalize(
    img: np.ndarray,
    size: Tuple[int, int],
    pre_resized: Optional[np.ndarray] = None,
) -> np.ndarray:
    """Resizes to `size` (or uses pre_resized if given), BGR→RGB, normalizes to [-1, 1], returns NCHW (1, C, H, W) for ONNX."""
    resized = cv2.resize(img, size) if pre_resized is None else pre_resized
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    normalized = (rgb.astype(np.float32) - 127.5) / 128.0
    transposed = np.transpose(normalized, (2, 0, 1))
    expanded = np.expand_dims(transposed, axis=0)
    return expanded

async def read_image_file(file: UploadFile) -> np.ndarray:
    """Reads FastAPI UploadFile and decodes to OpenCV BGR image (NumPy array)."""
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Failed to decode image file. Please check if it is a valid image.")
        
    return img
