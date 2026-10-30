const DOW = ["일", "월", "화", "수", "목", "금", "토"];

const parse = (s: string) => new Date(s.length <= 10 ? `${s}T00:00:00` : s);

/** YYYY-MM-DD 로 시작하는지 — 회의록의 '기한 미정' 같은 글을 걸러낸다 */
export const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}/.test(s);

/** 10.30 (금) — 날짜가 아니면 글 그대로 */
export function fmtDay(s: string) {
  if (!isDate(s)) return s;
  const d = parse(s);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")} (${DOW[d.getDay()]})`;
}

/** 2026.10.30 */
export function fmtDate(s: string) {
  const d = parse(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 14:00 */
export function fmtTime(s: string) {
  const d = parse(s);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 오늘이면 시각, 아니면 날짜 */
export function fmtWhen(s: string, today: string) {
  return s.slice(0, 10) === today ? fmtTime(s) : fmtDay(s);
}

/** 180,000,000원 */
export function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

/** 1.8억 / 3,250만 / 45,000원 */
export function wonShort(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(n % 100_000_000 ? 1 : 0)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString("ko-KR")}만`;
  return won(n);
}

/** 두 날짜 사이 일수 (b - a) */
export function daysBetween(a: string, b: string) {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
}

export function hm(min: number) {
  return `${Math.floor(min / 60)}시간 ${String(min % 60).padStart(2, "0")}분`;
}
