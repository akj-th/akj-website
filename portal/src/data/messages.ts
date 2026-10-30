// 데모 데이터 — 지어낸 메신저 대화. 프로젝트 채널·팀 채널·개인 메시지.
// author "bot" 은 포털이 자동으로 남기는 알림(결재·회의록·메일 연결)이다.

export type ChannelKind = "project" | "team" | "dm";

export interface Channel {
  id: string;
  kind: ChannelKind;
  name: string;
  project?: string;
  members: string[];
  topic?: string;
}

export interface ChatMessage {
  id: string;
  channel: string;
  author: string;
  at: string;
  text: string;
  files?: { name: string; size: string; sample?: string }[];
  reactions?: { label: string; by: string[] }[];
  link?: { href: string; label: string };
}

export const CHANNELS: Channel[] = [
  { id: "c-all", kind: "team", name: "전체", members: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"], topic: "회사 공지·일정" },
  { id: "c-design", kind: "team", name: "설계팀", members: ["p1", "p3", "p4", "p7"], topic: "설계팀 업무" },
  { id: "c-interior", kind: "team", name: "인테리어팀", members: ["p2", "p5", "p6"], topic: "인테리어팀 업무" },
  { id: "c-12611", kind: "project", name: "12611 성수동 근린생활시설", project: "12611", members: ["p3", "p4", "p7", "p2"], topic: "실시설계 · 마감 2027-01-29" },
  { id: "c-32611", kind: "project", name: "32611 핀테크 오피스", project: "32611", members: ["p5", "p6", "p2"], topic: "시공 · 가구 반입 11/10" },
  { id: "c-72611", kind: "project", name: "72611 문화센터 공모", project: "72611", members: ["p2", "p3", "p6", "p7"], topic: "제출 11/6 17:00" },
  { id: "c-42611", kind: "project", name: "42611 해안마을 마스터플랜", project: "42611", members: ["p1", "p3", "p7"], topic: "중간보고 11/12" },
  { id: "c-12612", kind: "project", name: "12612 양평 주말주택", project: "12612", members: ["p4", "p7", "p3"], topic: "기본설계" },
  { id: "d-p2", kind: "dm", name: "윤서아", members: ["p3", "p2"] },
  { id: "d-p4", kind: "dm", name: "오하린", members: ["p3", "p4"] },
  { id: "d-p8", kind: "dm", name: "문채원", members: ["p3", "p8"] },
];

export const MESSAGES: ChatMessage[] = [
  // 전체
  { id: "m-all-1", channel: "c-all", author: "p8", at: "2026-10-29T09:02", text: "11월 둘째 주에 사무실 네트워크 공사가 있습니다. NAS 설치 일정 나오면 다시 공지할게요." },
  { id: "m-all-2", channel: "c-all", author: "p2", at: "2026-10-29T09:15", text: "이번 주 금요일 점심은 다 같이 해요. 공모 마감 전에 한 번 모입시다.", reactions: [{ label: "좋아요", by: ["p3", "p4", "p6", "p7"] }] },
  { id: "m-all-3", channel: "c-all", author: "p8", at: "2026-10-30T08:40", text: "10월 지출결의는 오늘까지 올려 주세요. 영수증 사진 꼭 첨부 부탁드립니다." },

  // 12611
  { id: "m1-1", channel: "c-12611", author: "p3", at: "2026-10-27T18:12", text: "구조사무소에 10/27 평면·단면 보냈습니다. 6층 캔틸레버 위주로 봐 달라고 했어요.", files: [{ name: "12611_261027_평면단면.pdf", size: "12MB" }] },
  { id: "m1-2", channel: "c-12611", author: "bot", at: "2026-10-28T15:05", text: "회의록이 저장되었습니다 — 실시설계 2차 건축주 협의 (할 일 3건)", link: { href: "/minutes?id=n1", label: "회의록 보기" } },
  { id: "m1-3", channel: "c-12611", author: "p4", at: "2026-10-29T10:24", text: "@한지호 1층 3구획 평면 수정 시작했어요. 화장실 위치 때문에 코어를 조금 옮겨야 할 것 같은데 오후에 잠깐 봐 주실 수 있을까요?" },
  { id: "m1-4", channel: "c-12611", author: "p3", at: "2026-10-29T10:31", text: "네 3시에 봐요. 모델도 같이 올려 줘요." },
  { id: "m1-5", channel: "c-12611", author: "p4", at: "2026-10-29T14:52", text: "수정 매스 올렸습니다.", files: [{ name: "261029_MASS_STUDY.3dm", size: "24.1MB", sample: "/samples/demo-massing.3dm" }], reactions: [{ label: "확인", by: ["p3"] }] },
  { id: "m1-6", channel: "c-12611", author: "bot", at: "2026-10-29T10:20", text: "오하린님이 지출결의를 올렸습니다 — 구조 검토용 모형 재료비 240,000원", link: { href: "/approvals?id=e1", label: "결재 보기" } },
  { id: "m1-7", channel: "c-12611", author: "bot", at: "2026-10-30T09:12", text: "새 메일 — [12611] 구조 검토 의견 회신 — 6층 캔틸레버 (가상구조 김구조)", link: { href: "/mail?id=m1", label: "메일 보기" } },
  { id: "m1-8", channel: "c-12611", author: "p7", at: "2026-10-30T09:40", text: "구조 회신 보니 캔틸레버 1.8m로 줄이는 쪽이네요. 입면 다시 그려 볼까요?" },

  // 32611
  { id: "m3-1", channel: "c-32611", author: "p5", at: "2026-10-28T17:40", text: "11/3 오전 10시 천장 검측으로 현장소장님이랑 확정했어요." },
  { id: "m3-2", channel: "c-32611", author: "p6", at: "2026-10-30T08:50", text: "건축주가 회의실 유리 시트지를 로고 패턴으로 바꾸고 싶어 해요. 로고 파일 받았습니다.", files: [{ name: "logo_pattern.ai", size: "3.4MB" }] },
  { id: "m3-3", channel: "c-32611", author: "p5", at: "2026-10-30T09:05", text: "시공사에 단가 물어볼게요. 내일까지 견적 받아서 회신하죠." },

  // 72611
  { id: "m7-1", channel: "c-72611", author: "p2", at: "2026-10-29T19:30", text: "패널 2장 평면 레이아웃 거의 됐어요. 내일 오전 크리틱 10시." },
  { id: "m7-2", channel: "c-72611", author: "p7", at: "2026-10-30T09:20", text: "질의응답 기준으로 주차대수 다시 냈어요. 법정 42대 → 계획 45대.", reactions: [{ label: "확인", by: ["p2", "p3"] }] },
  { id: "m7-3", channel: "c-72611", author: "p6", at: "2026-10-30T09:55", text: "다이어그램 4종 공유 폴더에 올렸습니다.", files: [{ name: "72611_다이어그램_v3.pdf", size: "8.2MB" }] },

  // 42611
  { id: "m4-1", channel: "c-42611", author: "bot", at: "2026-10-29T16:20", text: "새 메일 — [42611] 중간보고회 일정 확정 안내 (가상군청 도시재생팀)", link: { href: "/mail?id=m3", label: "메일 보기" } },
  { id: "m4-2", channel: "c-42611", author: "p1", at: "2026-10-29T17:02", text: "중간보고 11/12 확정입니다. 자료는 11/9까지 보내야 하니 북측 권역 대안은 11/5까지 정리해 주세요." },

  // 12612
  { id: "m2-1", channel: "c-12612", author: "p4", at: "2026-10-29T11:20", text: "건축주가 거실 창 크기 걱정하셔서 폭 줄이는 안이랑 높이 낮추는 안 두 개 그려 갈게요." },

  // 개인 메시지
  { id: "dm2-1", channel: "d-p2", author: "p2", at: "2026-10-30T08:15", text: "지호 실장, 공모 투시도 렌더 세팅 오늘 오후까지 가능해요?" },
  { id: "dm4-1", channel: "d-p4", author: "p4", at: "2026-10-29T18:40", text: "실장님 모형 재료비 결재 올렸습니다. 확인 부탁드려요." },
  { id: "dm8-1", channel: "d-p8", author: "p8", at: "2026-10-28T13:00", text: "NAS 견적 두 군데 받았어요. 다음 주에 같이 봐요." },
];

/** 데모 사용자가 마지막으로 읽은 시각 — 이후 메시지는 '안 읽음' */
export const LAST_READ: Record<string, string> = {
  "c-all": "2026-10-29T23:59",
  "c-design": "2026-10-30T00:00",
  "c-interior": "2026-10-30T00:00",
  "c-12611": "2026-10-29T15:00",
  "c-32611": "2026-10-30T09:10",
  "c-72611": "2026-10-30T09:00",
  "c-42611": "2026-10-30T00:00",
  "c-12612": "2026-10-30T00:00",
  "d-p2": "2026-10-30T00:00",
  "d-p4": "2026-10-30T00:00",
  "d-p8": "2026-10-30T00:00",
};
