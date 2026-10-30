/** 소수점 자릿수는 크기에 맞춰 — 큰 값은 정수, 작은 값은 소수 셋째 자리까지 */
export function formatLength(v: number): string {
  const d = v >= 1000 ? 0 : v >= 10 ? 1 : 3;
  return v.toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });
}
