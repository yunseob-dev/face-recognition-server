# 아키텍처 결정 기록 (Architecture Decision Records - ADR)

프로젝트 진행 과정에서 내린 주요 기술적 의사결정과 그 근거를 기록한다.

## ADR-001: FastAPI 프레임워크 채택
- 상태: 채택됨
- 결정: Python 웹 프레임워크로 FastAPI를 사용한다.
- 근거:
    - 성능: Starlette과 Pydantic을 기반으로 하여 NodeJS 및 Go와 대등한 성능을 제공한다.
    - 비동기 지원: Python의 `async`/`await` 문법을 네이티브로 지원하여 고성능 I/O 처리가 가능하다.
    - 문서화: Swagger UI(OpenAPI)가 자동으로 생성되어 API 테스트 및 협업에 유리하다.

## ADR-002: ONNX Runtime 추론 엔진 사용
- 상태: 채택됨
- 결정: 모델 추론을 위해 PyTorch나 TensorFlow 대신 ONNX Runtime을 사용한다.
- 근거:
    - 호환성: 다양한 프레임워크에서 학습된 모델을 표준 포맷(ONNX)으로 변환하여 실행할 수 있다.
    - 최적화: 하드웨어 가속(CoreML, TensorRT 등)을 쉽게 적용할 수 있다. 본 프로젝트에서는 macOS 환경 최적화를 위해 `CoreMLExecutionProvider`를 우선순위로 설정했다.
    - 경량화: 학습 관련 종속성을 제거하여 배포 이미지 크기를 줄일 수 있다.

## ADR-003: SQLite 및 비동기 드라이버 사용
- 상태: 채택됨 (초기 단계)
- 결정: 데이터베이스로 SQLite를 사용하며, 드라이버는 `aiosqlite`를 사용한다.
- 근거:
    - 개발 편의성: 별도의 DB 서버 설치 없이 파일 기반으로 즉시 개발 환경 구성이 가능하다.
    - 비동기 처리: SQLite는 기본적으로 동기식이지만, FastAPI의 비동기 이점을 해치지 않기 위해 `aiosqlite`를 통해 비동기 래퍼를 적용했다.