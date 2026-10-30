// 데모 데이터 — 데모 로그인 사용자의 10월 근태를 규칙으로 만든다 (실제 기록 아님).

export type DayKind = "normal" | "late" | "leave" | "half" | "field" | "holiday";

export interface DayRecord {
  date: string;
  kind: DayKind;
  in?: string;
  out?: string;
}

export const DAY_LABEL: Record<DayKind, string> = {
  normal: "정상",
  late: "지각",
  leave: "휴가",
  half: "반차",
  field: "외근",
  holiday: "공휴일",
};

/** 출근 기준 시각 (유연근무 상한) */
export const START_LIMIT = "09:30";

const HOLIDAYS: Record<string, string> = { "2026-10-05": "개천절 대체공휴일", "2026-10-09": "한글날" };
const SPECIAL: Record<string, DayKind> = { "2026-10-16": "leave", "2026-10-23": "half", "2026-10-08": "field", "2026-10-21": "field" };

// 날짜로 정해지는 의사난수 — 새로고침해도 같은 값
function rand(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function monthRecords(year: number, month: number, untilExclusive: string): DayRecord[] {
  const out: DayRecord[] = [];
  const days = new Date(year, month, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (date >= untilExclusive) break;
    const dow = new Date(`${date}T00:00:00`).getDay();
    if (dow === 0 || dow === 6) continue;
    if (HOLIDAYS[date]) {
      out.push({ date, kind: "holiday" });
      continue;
    }
    const special = SPECIAL[date];
    if (special === "leave") {
      out.push({ date, kind: "leave" });
      continue;
    }
    const r = rand(date);
    const inMin = special === "field" ? 9 * 60 + 40 : 8 * 60 + 35 + Math.round(r * 62);
    const outMin = special === "half" ? 13 * 60 + 5 : 18 * 60 + Math.round(rand(date + "o") * 150);
    const late = inMin > 9 * 60 + 30 && !special;
    out.push({ date, kind: special ?? (late ? "late" : "normal"), in: hhmm(inMin), out: hhmm(outMin) });
  }
  return out;
}

export const holidayName = (date: string) => HOLIDAYS[date];

export function workedMinutes(r: { in?: string; out?: string }) {
  if (!r.in || !r.out) return 0;
  const [ih, im] = r.in.split(":").map(Number);
  const [oh, om] = r.out.split(":").map(Number);
  const raw = oh * 60 + om - (ih * 60 + im);
  // 4시간 넘게 일하면 점심 1시간 뺀다
  return Math.max(0, raw > 240 ? raw - 60 : raw);
}
