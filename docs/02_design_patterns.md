# 디자인 패턴 (Design Patterns)

본 프로젝트의 코드 품질과 효율성을 높이기 위해 적용된 주요 디자인 패턴에 대해 기술한다.

## 1. 싱글톤 패턴 (Singleton Pattern)
- 적용 컴포넌트: `app/services/ai_service.py` - `ModelService`
- 구현 방식: 모듈 레벨에서 클래스 인스턴스를 생성(`ai_service = ModelService()`)하여 전역적으로 재사용한다.
- 채택 이유:
    - ONNX 모델(`InferenceSession`) 로딩은 CPU 및 메모리 리소스를 많이 소모하는 작업이다.
    - 매 요청마다 모델을 로드하는 오버헤드를 방지하고, 애플리케이션 수명 주기 동안 단 하나의 세션만 유지하기 위함이다.

## 2. 의존성 주입 (Dependency Injection)
- 적용 컴포넌트: `app/api/endpoints/predict.py`
- 구현 방식: FastAPI의 `Depends`를 사용하여 데이터베이스 세션(`AsyncSession`)을 엔드포인트 함수에 주입한다.
- 채택 이유:
    - 결합도 감소: 비즈니스 로직이 데이터베이스 연결 생성 방식에 구애받지 않도록 한다.
    - 테스트 용이성: 테스트 환경에서 실제 DB 대신 Mock 객체로 쉽게 대체할 수 있다.
    - 생명주기 관리: 요청 시작 시 세션을 열고, 종료 시 자동으로 닫는 자원 관리를 프레임워크에 위임한다.

## 3. DTO (Data Transfer Object)
- 적용 컴포넌트: `app/schemas/prediction.py`, `app/schemas/user.py`
- 구현 방식: Pydantic의 `BaseModel`을 상속받아 요청/응답 형식을 정의한다. 추론용 `PredictionRequest`, `PredictionResponse`, 사용자용 `UserResponse`, 등록/검색 요청 스키마 등.
- 채택 이유:
    - API 계층과 비즈니스 계층 간의 데이터 교환 형식을 명확히 정의한다.
    - 런타임 데이터 검증을 수행하여 잘못된 데이터 유입을 사전에 차단한다.

## 4. 인증 의존성 (Authentication Dependency)
- 적용 컴포넌트: `app/api/endpoints/auth.py` — `get_current_user`, `OAuth2PasswordBearer`
- 구현 방식: `OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")`로 Bearer 토큰 추출, `get_current_user(token: str = Depends(oauth2_scheme))`에서 JWT 검증 후 페이로드에서 사용자 정보를 반환한다. 보호가 필요한 엔드포인트(users 라우트 등)에서 `Depends(get_current_user)`로 주입한다.
- 채택 이유:
    - 인증이 필요한 라우트를 선언적으로 구분하고, 토큰 검증·401 처리 로직을 한 곳에서 재사용한다.
    - 테스트 시 Mock 사용자로 대체하기 쉽다.