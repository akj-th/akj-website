# ATELIER KJ 웹

공개 사이트와 사내 포털을 함께 두는 저장소. 구조와 원칙은 [docs/architecture.md](docs/architecture.md).

| 폴더 | 내용 | 로컬 확인 |
|---|---|---|
| `site/` | 공개 사이트 — 포트폴리오, 회사 소개. 정적, 빌드 없음 | `npx serve site` |
| `portal/` | 사내 포털 — Next.js. 회사 NAS에서 운영 | `cd portal` → `npm install` → `npm run dev` |
| `docs/` | 구조·원칙·정할 것 | — |

## 배포

- `site/` → Cloudflare Pages. 이 저장소 연결, 빌드 명령 없음, **출력 폴더 `site`**
- `portal/` → 회사 NAS Docker (NAS 구축 후). 공개 호스팅에 올리지 않는다
