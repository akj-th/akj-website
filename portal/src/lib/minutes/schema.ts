// AI 회의록 결과 형식 — akj-minutes 스킬의 spec(references/formats.md)과 같은 뼈대.
// 구조화 출력(JSON 스키마)이라 모든 필드가 항상 온다. 없는 값은 빈 문자열·빈 배열.

export interface DraftAction {
  owner: string;
  task: string;
  due: string;
  output: string;
}

export interface DraftItem {
  title: string;
  rows: { label: string; text: string }[];
  decision: string;
  open: string;
}

export interface MinutesDraft {
  title: string;
  summary: string;
  actions: DraftAction[];
  items: DraftItem[];
  openItems: { item: string; owner: string; due: string }[];
  next: string;
  internalNotes: string[];
  checks: string[];
  corrections: { heard: string; fixed: string }[];
}

const str = { type: "string" } as const;
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const MINUTES_SCHEMA = obj({
  title: str,
  summary: str,
  actions: { type: "array", items: obj({ owner: str, task: str, due: str, output: str }) },
  items: {
    type: "array",
    items: obj({
      title: str,
      rows: { type: "array", items: obj({ label: str, text: str }) },
      decision: str,
      open: str,
    }),
  },
  openItems: { type: "array", items: obj({ item: str, owner: str, due: str }) },
  next: str,
  internalNotes: { type: "array", items: str },
  checks: { type: "array", items: str },
  corrections: { type: "array", items: obj({ heard: str, fixed: str }) },
});

export const UNDECIDED = { owner: "담당 미정", due: "기한 미정" };

export function undecidedCount(d: Pick<MinutesDraft, "actions">) {
  return d.actions.filter((a) => a.owner === UNDECIDED.owner || a.due === UNDECIDED.due).length;
}
