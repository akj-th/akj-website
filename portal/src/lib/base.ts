// 배포 경로 — GitHub Pages(정적 웹 데모)에서는 "/akj-website/app", NAS 에서는 "".
// next/link·router 는 알아서 붙이므로, 직접 쓰는 주소(fetch·wasm 경로 등)에만 쓴다.
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 서버 없이 정적 파일로만 도는 웹 데모 — API 가 필요한 기능은 예시로 대신한다 */
export const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

/** "/samples/x.3dm" 같은 사이트 안 절대 경로에 배포 경로를 붙인다 */
export const withBase = (p: string) => (p.startsWith("/") && !p.startsWith(`${BASE}/`) ? `${BASE}${p}` : p);
