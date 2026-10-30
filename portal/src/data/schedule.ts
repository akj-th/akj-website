// 데모 데이터 — 지어낸 일정.

export interface Event {
  id: string;
  date: string;
  end?: string;
  title: string;
  project?: string;
  kind: "meeting" | "deadline" | "site";
}

export const EVENTS: Event[] = [
  { id: "s1", date: "2026-10-30T10:00", end: "2026-10-30T11:00", title: "공모 패널 중간 점검", project: "72611", kind: "meeting" },
  { id: "s2", date: "2026-10-30T15:00", end: "2026-10-30T16:00", title: "연희동 허가 보완 회의", project: "22611", kind: "meeting" },
  { id: "s3", date: "2026-11-02T14:00", title: "양평 주말주택 창호 대안 미팅", project: "12612", kind: "meeting" },
  { id: "s4", date: "2026-11-03T10:00", title: "핀테크 오피스 천장 검측", project: "32611", kind: "site" },
  { id: "s5", date: "2026-11-03T18:00", title: "구조 마감 방향 회신 기한", project: "12611", kind: "deadline" },
  { id: "s6", date: "2026-11-06T17:00", title: "문화센터 설계공모 제출 마감", project: "72611", kind: "deadline" },
  { id: "s7", date: "2026-11-09T18:00", title: "해안마을 중간보고 자료 송부", project: "42611", kind: "deadline" },
];
