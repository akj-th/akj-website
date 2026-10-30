// 데모 데이터 — 지어낸 결재 문서. 금액·내역 모두 가상.

export type ApprovalKind = "expense" | "leave";
export type LineStatus = "done" | "pending" | "waiting" | "rejected";
export type ApprovalStatus = "진행" | "승인" | "반려";

export interface ApprovalLine {
  person: string;
  role: "기안" | "검토" | "승인";
  status: LineStatus;
  at?: string;
  comment?: string;
}

export interface Approval {
  id: string;
  kind: ApprovalKind;
  title: string;
  requester: string;
  created: string;
  project?: string;
  items?: { desc: string; amount: number }[];
  leave?: { type: "연차" | "반차" | "병가"; from: string; to: string; days: number };
  note?: string;
  receipt?: string;
  line: ApprovalLine[];
  status: ApprovalStatus;
}

export const KIND_LABEL: Record<ApprovalKind, string> = { expense: "지출결의", leave: "휴가" };

export const APPROVALS: Approval[] = [
  {
    id: "e1", kind: "expense", title: "구조 검토용 모형 재료비", requester: "p4", created: "2026-10-29T10:20", project: "12611",
    items: [{ desc: "우드락·아크릴 판재", amount: 86_000 }, { desc: "레이저 커팅 외주", amount: 154_000 }],
    receipt: "영수증_모형재료.jpg", note: "건축주 협의용 1/200 모형",
    line: [
      { person: "p4", role: "기안", status: "done", at: "2026-10-29T10:20" },
      { person: "p3", role: "검토", status: "pending" },
      { person: "p2", role: "승인", status: "waiting" },
    ],
    status: "진행",
  },
  {
    id: "e2", kind: "leave", title: "연차 1일 (11/7)", requester: "p6", created: "2026-10-28T18:02",
    leave: { type: "연차", from: "2026-11-07", to: "2026-11-07", days: 1 }, note: "개인 일정",
    line: [
      { person: "p6", role: "기안", status: "done", at: "2026-10-28T18:02" },
      { person: "p3", role: "검토", status: "pending" },
      { person: "p2", role: "승인", status: "waiting" },
    ],
    status: "진행",
  },
  {
    id: "e3", kind: "expense", title: "현장 검측 출장 교통비", requester: "p5", created: "2026-10-27T09:15", project: "32611",
    items: [{ desc: "택시 (사무실↔현장 왕복)", amount: 38_400 }],
    receipt: "택시영수증.pdf",
    line: [
      { person: "p5", role: "기안", status: "done", at: "2026-10-27T09:15" },
      { person: "p3", role: "검토", status: "pending" },
      { person: "p2", role: "승인", status: "waiting" },
    ],
    status: "진행",
  },
  {
    id: "e4", kind: "expense", title: "공모전 출력·제본비", requester: "p3", created: "2026-10-26T16:40", project: "72611",
    items: [{ desc: "A1 패널 출력 4장", amount: 120_000 }, { desc: "설명서 제본 10부", amount: 65_000 }],
    receipt: "출력소_견적서.pdf",
    line: [
      { person: "p3", role: "기안", status: "done", at: "2026-10-26T16:40" },
      { person: "p8", role: "검토", status: "done", at: "2026-10-27T09:30" },
      { person: "p2", role: "승인", status: "pending" },
    ],
    status: "진행",
  },
  {
    id: "e5", kind: "leave", title: "오후 반차 (10/23)", requester: "p3", created: "2026-10-20T11:00",
    leave: { type: "반차", from: "2026-10-23", to: "2026-10-23", days: 0.5 },
    line: [
      { person: "p3", role: "기안", status: "done", at: "2026-10-20T11:00" },
      { person: "p2", role: "승인", status: "done", at: "2026-10-20T14:12" },
    ],
    status: "승인",
  },
  {
    id: "e6", kind: "expense", title: "렌더링 소프트웨어 월 구독", requester: "p7", created: "2026-10-15T13:30",
    items: [{ desc: "렌더러 월 구독 (1석)", amount: 79_000 }],
    line: [
      { person: "p7", role: "기안", status: "done", at: "2026-10-15T13:30" },
      { person: "p3", role: "검토", status: "done", at: "2026-10-15T17:02" },
      { person: "p2", role: "승인", status: "rejected", at: "2026-10-16T10:05", comment: "연간 라이선스로 일괄 구매 예정 — 개별 구독 보류" },
    ],
    status: "반려",
  },
];

export const total = (a: Approval) => (a.items ?? []).reduce((s, i) => s + i.amount, 0);
/** 지금 결재할 차례인 사람 */
export const currentApprover = (a: Approval) => a.line.find((l) => l.status === "pending")?.person;
