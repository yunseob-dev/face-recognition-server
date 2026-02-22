# 시스템 아키텍처 (System Architecture)

## 1. 개요

본 문서는 FastAPI 기반 얼굴 인식 서버와 React 관리자 대시보드를 포함한 모노레포의 고수준 아키텍처와 데이터 흐름을 기술한다. 서버는 확장성과 유지보수성을 위해 계층형 아키텍처를 채택하였다.

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| Server | FastAPI (Python 3.10+), ONNX Runtime, SQLite (aiosqlite), SQLAlchemy 2.0 Async, Loguru |
| Client | React 19, TypeScript, Vite, TailwindCSS v4, Axios |

## 3. 서버 3계층 구조 (Layered Architecture)

| 계층 | 위치 | 역할 |
|------|------|------|
| **프레젠테이션** | `app/api/endpoints/`, `app/schemas/` | HTTP 요청 수신, Pydantic 검증, 응답 포맷. 비즈니스 로직 없이 서비스/DB 호출. |
| **비즈니스** | `app/services/`, `app/utils/` | `ModelService`(ONNX 세션), `preprocessing.py`(YuNet 검출·전처리), `recognition.py`(코사인 유사도·매칭). |
| **데이터 접근** | `app/db/` | 세션 관리, 모델 정의(User, Admin, PredictionLog), 초기 관리자 생성(`init_admin.py`). |

주요 파일 매핑:

- **Auth**: `app/api/endpoints/auth.py` — JWT 로그인, `get_current_user`(다른 라우트 보호용)
- **Face 추론**: `app/api/endpoints/predict.py` — Raw ONNX 추론, `prediction_logs` 저장
- **사용자**: `app/api/endpoints/users.py` — 사용자 CRUD, 얼굴 등록·일괄 등록·얼굴 검색(모두 JWT 필요)
- **AI 서비스**: `app/services/ai_service.py` — 싱글톤 `ModelService`, lifespan에서 모델 로드
- **전처리**: `app/utils/preprocessing.py` — YuNet 얼굴 검출 → 크롭 → 112×112 정규화 → NCHW
- **매칭**: `app/utils/recognition.py` — 코사인 유사도, `find_best_match`(임베딩 vs 활성 사용자)

## 4. API 라우트

모든 API는 prefix `/api/v1` (auth는 `/api/v1/auth`). 인증 필요 여부는 코드 기준이다.

| Method | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/auth/login` | No | 폼 로그인 → JWT Bearer 토큰 반환 |
| GET | `/api/v1/auth/me` | Yes | 현재 로그인 관리자 정보 |
| GET | `/api/v1/health` | No | 헬스 체크(모델 로드 여부 등) |
| POST | `/api/v1/face/inference` | No | Raw ONNX 추론, 결과는 `prediction_logs`에 저장 |
| POST | `/api/v1/users/register` | Yes | 단일 사용자 + 얼굴 이미지(multipart) 등록 |
| POST | `/api/v1/users/register/bulk` | Yes | 서버 측 디렉터리 경로로 일괄 등록 |
| POST | `/api/v1/users/search` | Yes | 업로드 이미지로 신원 검색(코사인 유사도) |
| GET | `/api/v1/users/` | Yes | 사용자 목록 |
| GET | `/api/v1/users/{user_id}` | Yes | 사용자 단건 조회 |
| PATCH | `/api/v1/users/{user_id}` | Yes | 사용자 수정 |
| DELETE | `/api/v1/users/{user_id}` | Yes | 사용자 삭제 |
| DELETE | `/api/v1/users/all` | Yes | 전체 사용자 삭제 |

루트 수준: `GET /` (상태), `GET /health` (모델 상태·프로바이더 등). CORS는 `main.py`에서 localhost(5173) 허용.

## 5. 추론 파이프라인 (Inference Pipeline)

1. **이미지 수신** — `read_image_file()` 등으로 바이트 → numpy BGR 배열
2. **전처리** — `pre_process()`: YuNet 얼굴 검출 → 최적 얼굴 크롭 → 112×112 리사이즈 → [-1, 1] 정규화 → NCHW float32
3. **임베딩** — `ai_service.inference()`: ONNX 세션으로 얼굴 임베딩 벡터 생성
4. **검색(사용자 식별)** — `recognition.find_best_match`: `is_active=True` 사용자와 코사인 유사도 비교, `FACE_MATCH_THRESHOLD`(기본 0.70) 이상이면 매칭

## 6. 클라이언트 아키텍처

- **HTTP**: `src/services/api.ts` — axios `baseURL: '/api/v1'`, 요청 시 `localStorage`의 JWT를 `Authorization: Bearer` 헤더에 자동 주입
- **인증**: `AuthContext`로 앱 래핑, `PrivateRoute`에서 미인증 시 `/login`으로 리다이렉트
- **라우트**: React Router. 공개: `/login`. 보호( MainLayout 내 ): `/` → `/dashboard`, `/dashboard`, `/users`, `/users/new`, `/users/bulk`, `/test`(얼굴 검색 테스트)

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/login` | Login | 관리자 로그인 폼 |
| `/dashboard` | Dashboard | 대시보드 |
| `/users` | UserList | 사용자 목록·삭제 |
| `/users/new` | UserRegister | 단일 사용자 등록(웹캠/파일) |
| `/users/bulk` | BulkRegister | 서버 측 디렉터리 일괄 등록 |
| `/test` | FaceTest | 웹캠 기반 실시간 얼굴 검색 |

개발 시 Vite가 `/api/v1`을 FastAPI로 프록시; Docker에서는 Nginx 등으로 연동.

## 7. 데이터 흐름 (추론 요청 예)

`POST /api/v1/face/inference` 기준:

1. 클라이언트가 이미지 데이터 전송(JSON 등)
2. `PredictionRequest` 스키마로 검증
3. `ai_service`가 ONNX Runtime으로 추론(CPU/CoreML 등)
4. 추론 결과·소요 시간·request_id를 `prediction_logs`에 비동기 저장
5. `PredictionResponse`로 클라이언트에 반환

DB 테이블은 lifespan에서 `Base.metadata.create_all`로 생성되며, 기동 시 `create_initial_admin`으로 초기 슈퍼유저가 생성된다.
