# 포털 작업 규칙

설계 기준은 `../docs/architecture.md`. 작업 전에 읽는다.

## 스택
Next.js 16 (App Router) / TypeScript / Tailwind 4 — AAD System과 같다.
Next.js 16은 예전 버전과 다르다 (`params`는 Promise, `middleware` → `proxy`). 코드를 쓰기 전에 `node_modules/next/dist/docs/`에서 해당 문서를 확인한다.

## 절대 규칙
- 저장소가 공개 상태다. `src/data/` 에는 지어낸 데이터만 — 실제 직원·건축주·금액·연락처·메일·도면을 넣지 않는다
- 데모 프로젝트 코드는 순번 11~19 (실제 코드와 겹치지 않게)
- 모듈 목록·상태는 `src/lib/modules.ts` 한 곳에서만 고친다
- API 키는 서버 코드에만. 클라이언트 번들과 저장소에 넣지 않는다
- 원본 파일(DWG·3DM 등)은 덮어쓰지 않는다. 수정 결과는 새 버전으로
- 고객 자료를 외부 변환·저장 서비스로 보내지 않는다
- 민감정보(주민번호·급여·계좌)는 3단계 전까지 다루지 않는다

## 명령어
npm run dev / npm run build
