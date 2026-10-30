// 데모 데이터 — 지어낸 메일. 보낸 사람·회사·내용 모두 가상.
// AI 요약·답장 초안도 미리 써 둔 예시다 (실제 생성은 메일 모듈 2단계).

export interface Mail {
  id: string;
  folder: "inbox" | "sent";
  from: { name: string; email: string };
  to: string;
  subject: string;
  date: string;
  project?: string;
  body: string[];
  attachments: { name: string; size: string }[];
  unread: boolean;
  summary?: string[];
  draft?: string;
}

export const MAILS: Mail[] = [
  {
    id: "m1", folder: "inbox", from: { name: "가상구조 김구조", email: "structure@example.com" }, to: "jiho.han@example.com",
    subject: "[12611] 구조 검토 의견 회신 — 6층 캔틸레버", date: "2026-10-30T09:12", project: "12611",
    body: [
      "실장님 안녕하세요, 가상구조 김구조입니다.",
      "보내주신 10/27자 도면 기준으로 6층 캔틸레버 구간 검토했습니다. 현재 2.4m 돌출은 보 춤 700 이상이 필요하고, 하부 천장고를 지키려면 1.8m로 줄이시는 쪽을 권합니다.",
      "외벽 마감 하중은 석재 기준으로 넣었는데, 금속 패널로 가시면 다시 계산해 드리겠습니다. 다음 주 화요일까지 마감 방향 알려주시면 일정 맞추겠습니다.",
    ],
    attachments: [{ name: "12611_구조검토의견서.pdf", size: "2.1MB" }], unread: true,
    summary: ["6층 캔틸레버 2.4m → 보 춤 700 이상 필요, 1.8m로 축소 권고", "외벽이 금속 패널이면 하중 재계산", "회신 기한: 11/3(화)까지 마감 방향"],
    draft: "김구조 님, 검토 감사합니다.\n\n캔틸레버는 1.8m 축소안으로 내부 검토해 보겠습니다. 외벽은 금속 패널 쪽으로 기울어 있어서, 11/3(화)까지 확정해서 다시 연락드리겠습니다.\n\n한지호 드림",
  },
  {
    id: "m2", folder: "inbox", from: { name: "라마바핀테크 총무팀", email: "office@example.com" }, to: "siwoo.lim@example.com",
    subject: "[32611] 회의실 유리 시트지 변경 요청", date: "2026-10-30T08:41", project: "32611",
    body: [
      "안녕하세요. 회의실 4개 유리 시트지를 반투명 줄무늬에서 회사 로고 패턴으로 바꿀 수 있을지 문의드립니다.",
      "로고 파일 첨부합니다. 추가 비용이 있다면 알려주세요.",
    ],
    attachments: [{ name: "logo_pattern.ai", size: "3.4MB" }], unread: true,
    summary: ["회의실 4개 유리 시트지를 로고 패턴으로 변경 요청", "추가 비용 문의 — 견적 필요"],
    draft: "안녕하세요, 아틀리에케이제이 임시우입니다.\n\n로고 패턴 시트지 가능합니다. 시공사에 단가 확인해서 내일 중으로 추가 비용과 일정 같이 정리해 드리겠습니다.\n\n임시우 드림",
  },
  {
    id: "m3", folder: "inbox", from: { name: "가상군청 도시재생팀", email: "regen@example.com" }, to: "doyun.kang@example.com",
    subject: "[42611] 중간보고회 일정 확정 안내", date: "2026-10-29T16:20", project: "42611",
    body: [
      "해안마을 재생 마스터플랜 중간보고회를 11월 12일(목) 오후 2시, 군청 3층 회의실로 확정했습니다.",
      "보고 자료는 11월 9일까지 PDF로 보내주시고, 출력본 15부 준비 부탁드립니다.",
    ],
    attachments: [], unread: false,
    summary: ["중간보고회 11/12(목) 14:00, 군청 3층", "자료 PDF 11/9까지, 출력본 15부"],
  },
  {
    id: "m4", folder: "inbox", from: { name: "건축주 A", email: "client.a@example.com" }, to: "harin.oh@example.com",
    subject: "[12612] 거실 창 크기 관련", date: "2026-10-29T11:05", project: "12612",
    body: [
      "지난번 보여주신 안에서 거실 창이 생각보다 커서 겨울에 춥지 않을까 걱정됩니다.",
      "강 쪽 조망은 살리면서 크기를 조금 줄이는 방법이 있을까요?",
    ],
    attachments: [], unread: true,
    summary: ["거실 창 크기 → 단열 걱정", "조망 유지하면서 축소 검토 요청"],
    draft: "건축주님 안녕하세요, 오하린입니다.\n\n창 크기는 줄이되 높이를 낮추지 않고 폭을 조정하면 조망은 거의 그대로 둘 수 있습니다. 삼중유리로 가면 단열도 보완됩니다. 두 가지 안을 그려서 다음 주 미팅 때 보여드리겠습니다.\n\n오하린 드림",
  },
  {
    id: "m5", folder: "inbox", from: { name: "가상건설 현장소장", email: "site@example.com" }, to: "siwoo.lim@example.com",
    subject: "[32611] 11/3 천장 마감 검측 요청", date: "2026-10-28T17:32", project: "32611",
    body: ["천장 텍스 마감 11/1 완료 예정입니다. 11/3(화) 오전 10시 검측 가능하신지 회신 부탁드립니다."],
    attachments: [{ name: "천장_시공사진.zip", size: "45MB" }], unread: false,
    summary: ["천장 마감 11/1 완료 예정", "검측 요청: 11/3(화) 10:00"],
  },
  {
    id: "m6", folder: "inbox", from: { name: "가상구청 공모 담당", email: "contest@example.com" }, to: "seoa.yoon@example.com",
    subject: "[72611] 질의응답 공고 게시", date: "2026-10-27T10:00", project: "72611",
    body: ["구립 문화센터 설계공모 질의응답이 게시되었습니다. 주차대수 산정 기준과 공연장 객석 수 관련 답변이 포함되어 있으니 확인 바랍니다."],
    attachments: [{ name: "질의응답.pdf", size: "820KB" }], unread: false,
    summary: ["질의응답 게시 — 주차대수 기준, 객석 수 답변 포함"],
  },
  {
    id: "m7", folder: "inbox", from: { name: "가상건축연구원 연구관리", email: "research@example.com" }, to: "seoa.yoon@example.com",
    subject: "[52611] 최종보고서 목차 검토 의견", date: "2026-10-26T14:48", project: "52611",
    body: ["보내주신 최종보고서 목차 검토했습니다. 4장 사례분석에 국외 사례 2건 정도 보강 부탁드리고, 부록 체크리스트는 본문으로 올리는 게 좋겠습니다."],
    attachments: [], unread: false,
    summary: ["4장 국외 사례 2건 보강", "부록 체크리스트 → 본문으로"],
  },
  {
    id: "m8", folder: "sent", from: { name: "한지호", email: "jiho.han@example.com" }, to: "structure@example.com",
    subject: "[12611] 10/27 도면 송부 — 구조 검토 요청", date: "2026-10-27T18:10", project: "12611",
    body: ["김구조 님, 10/27자 평면·단면 보내드립니다. 6층 캔틸레버 구간 위주로 봐주시면 됩니다."],
    attachments: [{ name: "12611_261027_평면단면.pdf", size: "12MB" }], unread: false,
  },
  {
    id: "m9", folder: "sent", from: { name: "임시우", email: "siwoo.lim@example.com" }, to: "office@example.com",
    subject: "[32611] 10월 공정 보고", date: "2026-10-24T17:45", project: "32611",
    body: ["10월 공정 보고드립니다. 전체 공정률 85%, 가구 반입은 11/10 예정입니다."],
    attachments: [{ name: "32611_10월공정보고.pdf", size: "4.4MB" }], unread: false,
  },
];
