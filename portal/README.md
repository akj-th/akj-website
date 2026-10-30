# ATELIER KJ 사내 포털

회사 NAS에서 돌릴 사내 웹. 지금은 **가짜 데이터로 모든 메뉴를 써 볼 수 있는 시안**이다.
NAS가 들어오기 전까지 데이터는 저장소(`src/data/`)에 있고, 사용자가 바꾼 것(결재·할 일·출퇴근 등)은 브라우저 localStorage에만 저장된다. 상단 사용자 메뉴의 '데모 데이터 초기화'로 처음 상태로 돌린다.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## 데모 데이터 원칙

- 직원·건축주·금액·연락처·메일·회의 내용은 **모두 지어낸 값**이다. 이메일은 `example.com`, 전화는 `010-0000-xxxx`
- 프로젝트 코드는 AKJ 체계를 따르되 실제 코드와 겹치지 않게 순번 11~19를 쓴다
- 폴더 구조는 실제 프로젝트 템플릿(00 ADMIN ~ 04 OUTPUT)과 같다
- 저장소는 공개 상태다. 실제 업무 데이터는 넣지 않는다

## 구조

```
src/
  data/                 데모 데이터 (사람·프로젝트·메일·회의록·결재·계약·일정·근태)
  lib/store.ts          데모 상태 (zustand + localStorage)
  lib/modules.ts        메뉴·로드맵의 모듈 목록과 상태
  lib/roadmap.ts        구글 → NAS 전환 단계
  lib/viewer/           3DM 뷰어 장면 (three.js + rhino3dm)
  components/           Sidebar, Topbar(검색·알림·새로 만들기), ui(공통 부품), overlay(서랍·모달·알림)
  components/views/     화면별 컴포넌트
  app/                  라우트 — 대시보드, 프로젝트(+상세), 뷰어, 회의록, 메일, AAD, 계산기, 결재, 근태, 계약서, 인사, 로드맵
public/samples/         뷰어 시연용 데모 매스 모델 (scripts/make-demo-model.mjs 로 생성)
```

## NAS로 옮길 때

- `src/data/*` 를 서버 API로 바꾸고, `lib/store.ts` 의 localStorage 저장을 서버 저장으로 바꾼다
- 뷰어는 `/viewer?src=<NAS 파일 API 주소>` 로 연다
- `next.config.ts` 가 `output: "standalone"` 이라 Docker(NAS Container Manager)로 올린다. `public/` 은 따로 복사한다

Next.js 16은 예전 버전과 API가 다른 곳이 있다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`를 확인한다.
