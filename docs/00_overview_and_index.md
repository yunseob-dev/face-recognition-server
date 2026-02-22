# 프로젝트 개요 및 문서 목차

## 1. 프로젝트 개요

본 저장소는 **모노레포** 구조로, 다음 두 부분으로 구성된다.

| 구성요소 | 경로 | 설명 |
|----------|------|------|
| **Face Recognition Server** | `server/` | FastAPI 기반 얼굴 인식 추론 서버. 사용자 등록·얼굴 임베딩 저장·검색(코사인 유사도) API 제공. |
| **Admin Dashboard** | `client/` | React 관리자 대시보드. JWT 로그인 후 사용자 CRUD, 얼굴 등록·일괄 등록·얼굴 검색 테스트 화면 제공. |

시스템은 얼굴 이미지를 ONNX 모델로 임베딩하고, 등록된 사용자와 코사인 유사도를 비교해 신원을 식별한다.

---

## 2. 문서 목차 (Table of Contents)

| 인덱스 | 문서 | 설명 |
|--------|------|------|
| 01 | [01_architecture.md](01_architecture.md) | 시스템 아키텍처, 3계층 구조, API·클라이언트 라우트, 추론 파이프라인 |
| 02 | [02_design_patterns.md](02_design_patterns.md) | 싱글톤, 의존성 주입, DTO, 인증 의존성 |
| 03 | [03_logging_strategy.md](03_logging_strategy.md) | 로깅 전략(Loguru, 로테이션·보존·포맷) |
| 04 | [04_database_schema.md](04_database_schema.md) | DB 스키마: User, Admin, PredictionLog |
| 05 | [05_adr.md](05_adr.md) | 아키텍처 결정 기록(ADR) |
| 06 | [06_develop_plan.md](06_develop_plan.md) | 향후 개발 계획(테스트, 에러/엣지, 운영/관리) |

---

## 3. 권장 읽기 순서

- **전체 파악**: 00(본 문서) → 01(아키텍처) → 04(DB 스키마)
- **구현 세부**: 02(디자인 패턴), 03(로깅)
- **의사결정 배경**: 05(ADR)
- **다음 단계 계획**: 06(개발 계획)
