# ATELIER KJ 사내 포털

회사 NAS에서 돌리는 사내 웹. 지금은 틀(v0.1)만 있다 — 메뉴, 대시보드, 모듈 자리 페이지, 로드맵.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## 구조

```
src/
  lib/modules.ts        모듈 목록 — 메뉴·대시보드·모듈 페이지·로드맵이 전부 여기서 나온다
  lib/roadmap.ts        구글 → NAS 전환 단계
  app/page.tsx          대시보드
  app/roadmap/          로드맵
  app/[module]/         아직 만들지 않은 모듈의 자리 페이지
  components/           Sidebar, StatusBadge
```

## 모듈을 실제로 만들 때

1. `src/app/<slug>/page.tsx`를 만든다. 정적 라우트가 `[module]` 자리 페이지보다 우선한다.
2. `src/lib/modules.ts`에서 그 모듈의 `status`를 `building` → `live`로 바꾼다.

## 배포 (NAS 구축 후)

`next.config.ts`가 `output: "standalone"`이라 `.next/standalone`만으로 돌아간다. NAS Container Manager(Docker)에 올리고 VPN 안에서만 열리게 한다. 설정은 NAS가 들어온 뒤 정한다.

Next.js 16은 예전 버전과 API가 다른 곳이 있다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`를 확인한다.
