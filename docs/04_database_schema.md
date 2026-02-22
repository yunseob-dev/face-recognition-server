# 데이터베이스 스키마 (Database Schema)

## 1. 개요

- DBMS: SQLite (개발 및 테스트 환경)
- Driver: aiosqlite (비동기 처리 지원)
- ORM: SQLAlchemy 2.0+ (Async Extension)
- 테이블 생성: `main.py` lifespan에서 `Base.metadata.create_all`로 자동 생성

모델 정의는 `app/db/models.py`에 있으며, User, Admin, PredictionLog 세 테이블을 사용한다.

## 2. 모델 정의

### 2.1 User

얼굴 임베딩이 등록된 사용자(피식별자) 정보.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, Index | 레코드 고유 식별자 (Auto Increment) |
| `name` | VARCHAR(100) | Not Null | 사용자 이름 |
| `identity_id` | VARCHAR(50) | Unique, Index | 외부 식별자(UUID 등) |
| `face_embedding` | TEXT | Not Null | 얼굴 임베딩 벡터를 JSON 문자열로 저장 |
| `face_image_path` | VARCHAR(255) | Nullable | 등록 시 저장한 얼굴 이미지 파일의 상대 경로 |
| `face_preprocessed_path` | VARCHAR(255) | Nullable | 등록 시 저장한 전처리(리사이즈 직후) 디버그 이미지의 상대 경로 |
| `is_active` | BOOLEAN | Default: True | 검색 대상 여부 |
| `created_at` | DATETIME | Default: Now | 레코드 생성 일시 |

### 2.2 Admin

JWT로 보호되는 API에 로그인하는 관리자 계정.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, Index, Auto Increment | 레코드 고유 식별자 |
| `username` | VARCHAR(50) | Unique, Index | 로그인 ID |
| `hashed_password` | VARCHAR(255) | Not Null | 해시된 비밀번호 |
| `email` | VARCHAR(100) | Nullable | 이메일 |
| `created_at` | DATETIME | Default: Now | 레코드 생성 일시 |
| `is_active` | BOOLEAN | Default: True | 계정 활성 여부 |

초기 슈퍼유저는 환경 변수(SUPERUSER_ID, SUPERUSER_PASSWORD, SUPERUSER_EMAIL)로 `app/db/init_admin.py`의 `create_initial_admin`이 기동 시 생성한다.

### 2.3 PredictionLog

Raw ONNX 추론 요청 이력을 저장한다.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, Index | 레코드 고유 식별자 (Auto Increment) |
| `request_id` | VARCHAR(50) | Index | 클라이언트가 생성한 요청 추적 ID |
| `input_source` | VARCHAR(255) | Nullable | 입력 데이터의 출처 또는 메타 정보 |
| `result_json` | TEXT | Not Null | 추론 결과 벡터(List)를 JSON 문자열로 저장 |
| `execution_time` | FLOAT | Nullable | 순수 모델 추론 소요 시간 (ms 단위) |
| `created_at` | DATETIME | Default: Now | 레코드 생성 일시 |

## 3. 설계 고려사항

- **face_embedding (JSON TEXT)**: 벡터 길이가 가변이므로 별도 벡터 테이블 대신 TEXT에 JSON 직렬화하여 저장한다. PostgreSQL 이전 시 `JSONB`로 전환 가능하다.
- **face_image_path**: 회원 등록 시 업로드된 얼굴 이미지는 `app/utils/face_image_storage.py`를 통해 `FACE_IMAGE_DIR`에 저장되고, 이 컬럼에 상대 경로가 기록된다. 기존 DB에 컬럼을 추가한 경우에는 수동으로 `face_image_path` 컬럼을 추가하거나 DB를 재생성해야 한다.
- **face_preprocessed_path**: 등록 시 모델 입력 직전의 전처리 이미지(얼굴 검출·크롭·리사이즈만 적용된 BGR 이미지)를 `{identity_id}_preprocessed.jpg`로 저장한 경로. 디버깅 및 Users 페이지 조회용.
- **인덱스**: PredictionLog는 `request_id`에 인덱스를 두어 요청 단위 조회 성능을 확보한다. User는 `identity_id`, Admin은 `username`에 유니크·인덱스를 둔다.
