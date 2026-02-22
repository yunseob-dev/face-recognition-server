"""
Run from server/: python scripts/test_onnx_model.py
Uses MODEL_PATH from .env (via app.core.config).
"""
import sys
from pathlib import Path

# Ensure app is importable when run from server/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import onnxruntime as ort

from app.core.config import settings


def test_onnx_inference():
    model_path = settings.MODEL_PATH
    print(f"--- 모델 로딩 시도: {model_path} ---")

    providers = ["CoreMLExecutionProvider", "CPUExecutionProvider"]
    try:
        session = ort.InferenceSession(model_path, providers=providers)
        print(f"사용 중인 인스턴스: {session.get_providers()}")
    except Exception as e:
        print(f"모델 로드 실패: {e}")
        return

    input_info = session.get_inputs()[0]
    input_name = input_info.name
    input_shape = input_info.shape
    input_type = input_info.type

    print(f"입력 이름: {input_name}")
    print(f"입력 모양(Shape): {input_shape}")
    print(f"입력 타입: {input_type}")

    # Build concrete shape: replace dynamic dims (None or str) with 1
    concrete_shape = []
    for d in input_shape:
        if d is None or (isinstance(d, str)):
            concrete_shape.append(1)
        else:
            concrete_shape.append(int(d))
    print(f"사용할 입력 shape: {concrete_shape}")

    dummy_input = np.random.randn(*concrete_shape).astype(np.float32)
    print(f"생성된 더미 데이터 모양: {dummy_input.shape}")

    try:
        outputs = session.run(None, {input_name: dummy_input})
        print("--- 추론 성공! ---")
        out0 = outputs[0]
        print(f"출력 shape: {getattr(out0, 'shape', 'N/A')}")
        if hasattr(out0, 'shape') and out0.size <= 20:
            print(f"결과값: {out0}")
        else:
            print(f"결과 샘플 (앞 5개): {out0.flatten()[:5]}")
    except Exception as e:
        print(f"추론 중 에러 발생: {e}")


if __name__ == "__main__":
    test_onnx_inference()