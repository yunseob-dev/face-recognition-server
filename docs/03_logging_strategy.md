# 로깅 전략 (Logging Strategy)

시스템의 안정적인 운영과 디버깅을 위한 중앙 집중식 로깅 전략을 기술한다.

## 1. 개요
- 라이브러리: `loguru` (메인), `logging` (표준 라이브러리 인터셉트)
- 목표: 애플리케이션 및 서드파티 라이브러리(Uvicorn, SQLAlchemy 등)의 로그를 통합 관리한다.

## 2. 로그 아키텍처
1.  표준 로그 가로채기 (Interception)
    - `LogHandler` 클래스를 구현하여 Python 표준 `logging` 모듈로 발생하는 모든 이벤트를 가로챈다.
    - 가로챈 로그는 `loguru` 싱크(Sink)로 전달되어 통합된 포맷으로 출력된다.

2.  비동기 로깅
    - `enqueue=True` 옵션을 활성화하여 로그 기록 작업이 메인 애플리케이션 스레드를 블로킹하지 않도록 처리한다.

## 3. 운영 정책
`app/core/logger.py`에서 설정을 적용하며, 로그 경로·레벨은 `app/core/config.py`의 `LOG_FILE_PATH`, `LOG_LEVEL` 환경 변수를 사용한다.

- 저장 경로: 기본 `logs/server.log` (환경 변수 `LOG_FILE_PATH`로 변경 가능).
- 로테이션 (Rotation): 단일 로그 파일의 크기가 10MB를 초과하면 새로운 파일을 생성한다.
- 보존 기간 (Retention): 생성된 지 30일이 지난 로그 파일은 자동으로 삭제한다.
- 압축 (Compression): 로테이션된 과거 로그 파일은 `zip` 형식으로 압축하여 저장 공간을 절약한다.

## 4. 로그 포맷
가독성을 위해 다음과 같은 구조화된 포맷을 사용한다.
- Format: `{time} | {level} | {name}:{function}:{line} - {message}`
- Console: 레벨별 색상(Colorize) 지원을 통해 시인성을 확보한다.