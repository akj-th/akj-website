# ATELIER KJ 웹사이트 (시안)

정적 사이트. 빌드 없음 — `index.html` + `projects.json` + `img/`.

- `index.html` — 페이지 전체 (프로젝트 목록 데이터 `P`, 대표작 `FEATURED`는 스크립트 상단)
- `projects.json` — 프로젝트 상세 페이지 본문·정보·이미지 목록
- `img/` 대표 이미지, `img/p/` 상세 페이지 이미지
- `logo.svg` — 모노그램 로고

로컬 확인: 이 폴더에서 `npx serve` 후 브라우저로 열기 (file://로 열면 projects.json을 못 읽음)
배포: Cloudflare Pages — 이 저장소 연결, 빌드 명령 없음, 출력 폴더 `/`
