// 데모 데이터 — 지어낸 회의록. 외부 참석자·내용 모두 가상.

export interface ActionItem {
  id: string;
  /** 사내 직원 id 또는 외부 참석자 이름 */
  owner: string;
  task: string;
  /** YYYY-MM-DD 또는 "기한 미정" 같은 글 */
  due: string;
  done: boolean;
  output?: string;
}

export interface Minutes {
  id: string;
  project: string;
  title: string;
  date: string;
  place: string;
  internal: string[];
  external: string[];
  summary: string;
  decisions: string[];
  actions: ActionItem[];
  source: string;
  // AI 정리(회의록 스킬 형식)에서 오는 항목
  distribute?: boolean;
  items?: { title: string; rows: { label: string; text: string }[]; decision: string; open: string }[];
  openItems?: { item: string; owner: string; due: string }[];
  next?: string;
  checks?: string[];
  internalNotes?: string[];
}

export const MINUTES: Minutes[] = [
  {
    id: "n1", project: "12611", title: "실시설계 2차 건축주 협의", date: "2026-10-28T14:00", place: "사무실 회의실",
    internal: ["p3", "p4"], external: ["가나다개발 박대리", "가나다개발 최팀장"],
    summary: "1층 근린 구획과 6층 캔틸레버, 외벽 마감 방향을 논의했다. 외벽은 금속 패널로 가되 저층부만 석재로 하는 안으로 좁혔다.",
    decisions: ["1층 근린 2개 구획 → 3개로 분할", "외벽: 저층부 석재, 상층부 금속 패널", "6층 캔틸레버는 구조 회신 후 결정"],
    actions: [
      { id: "a1", owner: "p4", task: "1층 3구획 평면 수정안 작성", due: "2026-11-04", done: false },
      { id: "a2", owner: "p3", task: "구조사무소에 금속 패널 기준 하중 재검토 요청", due: "2026-10-31", done: false },
      { id: "a3", owner: "가나다개발 박대리", task: "임대 MD 구성안 전달", due: "2026-11-06", done: false },
    ],
    source: "클로바노트 녹음 (52분)",
  },
  {
    id: "n2", project: "72611", title: "문화센터 공모 내부 크리틱", date: "2026-10-27T10:00", place: "사무실 큰 테이블",
    internal: ["p2", "p3", "p6", "p7"], external: [],
    summary: "매스 3안 중 B안(중정형)으로 확정. 패널 구성과 다이어그램 담당을 나눴다.",
    decisions: ["B안 중정형으로 확정", "패널 1장: 대지·개념, 2장: 평면, 3장: 단면·투시, 4장: 운영 시나리오"],
    actions: [
      { id: "a4", owner: "p6", task: "개념 다이어그램 4종", due: "2026-11-02", done: true },
      { id: "a5", owner: "p7", task: "주차대수 질의응답 기준으로 재산정", due: "2026-10-30", done: false },
      { id: "a6", owner: "p3", task: "투시도 2컷 렌더 세팅", due: "2026-11-03", done: false },
    ],
    source: "메모 정리",
  },
  {
    id: "n3", project: "32611", title: "현장 정례회의 (10월 4주)", date: "2026-10-24T09:30", place: "현장",
    internal: ["p5", "p6"], external: ["가상건설 현장소장", "라마바핀테크 총무팀"],
    summary: "천장 마감, 가구 반입 일정, 회의실 유리 시트지 변경 가능성을 논의했다.",
    decisions: ["가구 반입 11/10 확정", "천장 검측 11/3 오전"],
    actions: [
      { id: "a7", owner: "p5", task: "유리 시트지 변경 단가 확인", due: "2026-10-31", done: false },
      { id: "a8", owner: "가상건설 현장소장", task: "가구 반입 동선 보양 계획", due: "2026-11-07", done: false },
    ],
    source: "클로바노트 녹음 (38분)",
  },
  {
    id: "n4", project: "42611", title: "권역별 공공시설 배치 검토", date: "2026-10-21T15:00", place: "온라인",
    internal: ["p1", "p3", "p7"], external: ["가상군청 도시재생팀"],
    summary: "3개 권역 중 북측 권역 커뮤니티센터 위치를 항구 쪽으로 옮기는 안을 검토했다.",
    decisions: ["북측 커뮤니티센터 → 항구 인접 부지로 이동 검토", "중간보고 전 주민 설명자료 별도 제작"],
    actions: [
      { id: "a9", owner: "p7", task: "북측 권역 대안 배치 2안", due: "2026-11-05", done: false },
      { id: "a10", owner: "p1", task: "주민 설명자료 구성 검토", due: "2026-11-09", done: false },
    ],
    source: "화상회의 녹화",
  },
];
