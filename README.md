# ATELIER KJ 웹

공개 사이트와 사내 포털을 함께 두는 저장소. 구조와 원칙은 [docs/architecture.md](docs/architecture.md).

| 폴더 | 내용 | 로컬 확인 |
|---|---|---|
| `site/` | 공개 사이트 — 포트폴리오, 회사 소개. 정적, 빌드 없음 | `npx serve site` |
| `portal/` | 사내 포털 소스 — Next.js | `cd portal` → `npm install` → `npm run dev` |
| `app/` | 사내 포털 **웹 데모** (portal 에서 만든 정적 파일 — 직접 고치지 않는다) | — |
| `docs/` | 구조·원칙·정할 것 | — |

## 웹 주소 (GitHub Pages, main 브랜치 그대로)

- 공개 사이트: https://akj-th.github.io/akj-website/site/ (맨 아래 `Staff ↗` → 포털)
- 사내 포털 웹 데모: https://akj-th.github.io/akj-website/app/

포털 웹 데모는 **가짜 데이터**로만 돈다. 링크를 아는 누구나 볼 수 있으니 실제 업무 데이터는 넣지 않는다.
서버가 없어 AI 회의록은 예시 결과로만 동작한다. 실제 운영은 NAS(사내망·VPN)에서 한다.

포털을 고친 뒤 웹 데모 갱신:

```bash
cd portal
npm run export:pages   # → ../app/ 다시 만듦
# app/ 를 커밋·푸시하면 1~2분 뒤 반영
```

`.nojekyll` 은 지우지 않는다 — 없으면 GitHub Pages 가 `app/_next/` 를 숨겨 포털이 깨진다.

## 배포 (나중)

- `site/` → 도메인 연결 시 Cloudflare Pages 등. 출력 폴더 `site`
- `portal/` → 회사 NAS Docker (NAS 구축 후, `npm run build` = 서버 포함 standalone)
