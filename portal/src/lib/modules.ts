// 포털 모듈 목록 — 메뉴, 대시보드, 모듈 페이지, 로드맵이 전부 이 파일을 읽는다.
// 모듈을 실제로 만들면 src/app/<slug>/page.tsx 를 추가하고 status 를 바꾼다.
// (정적 라우트가 [module] 자리 페이지보다 우선한다)

export type ModuleStatus = "planned" | "building" | "live";
export type ModuleGroup = "work" | "design" | "office";
export type Stage = 1 | 2 | 3;

export interface PortalModule {
  slug: string;
  name: string;
  group: ModuleGroup;
  stage: Stage;
  status: ModuleStatus;
  summary: string;
  scope: string[];
  notes?: string[];
}

export const GROUPS: { id: ModuleGroup; name: string }[] = [
  { id: "work", name: "프로젝트 업무" },
  { id: "design", name: "설계 도구" },
  { id: "office", name: "회사 운영" },
];

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  planned: "준비 중",
  building: "개발 중",
  live: "운영 중",
};

export const MODULES: PortalModule[] = [
  {
    slug: "projects",
    name: "프로젝트",
    group: "work",
    stage: 1,
    status: "planned",
    summary: "프로젝트 코드 하나로 파일·도면·메일·회의록·결재를 모아 보는 곳",
    scope: [
      "프로젝트 목록 — 코드 체계 [유형][연도][순번]",
      "NAS 프로젝트 폴더 연결",
      "프로젝트별 도면·모델, 메일, 회의록, 결재 모아 보기",
    ],
    notes: ["프로젝트 코드가 포털 전체를 잇는 기준이다"],
  },
  {
    slug: "viewer",
    name: "도면·모델 뷰어",
    group: "work",
    stage: 1,
    status: "planned",
    summary: "CAD·라이노 없이 웹에서 DWG·3DM을 열어 보고 표시하는 곳",
    scope: [
      "3DM 뷰어 — rhino3dm으로 읽기, 큰 파일은 NAS에서 미리 가볍게 변환",
      "DWG 뷰어 — 사내에서 DXF로 변환해 표시, 한글 SHX 글꼴은 일반 한글 글꼴로 대체",
      "치수 재기, 좌표 확인",
      "코멘트·구름표 마크업",
      "3DM 간단 수정 — 레이어·색·이동·삭제, 새 버전으로 저장",
    ],
    notes: [
      "원본 파일은 덮어쓰지 않는다",
      "고객 도면은 외부 클라우드 변환 서비스에 올리지 않는다",
      "불리언·필렛 같은 모델링은 라이노에서 한다",
    ],
  },
  {
    slug: "minutes",
    name: "회의록",
    group: "work",
    stage: 1,
    status: "planned",
    summary: "회의 녹음을 올리면 할 일 중심 회의록이 프로젝트 폴더에 남는 곳",
    scope: [
      "녹음 파일 업로드",
      "음성 받아쓰기 (외부 음성인식 API)",
      "AKJ 회의록 규칙으로 정리 — 참석자별 할 일 중심",
      "프로젝트 폴더에 저장, 배포용은 Word·PDF로",
    ],
    notes: [
      "음성인식은 NAS에서 직접 돌리지 않는다 (성능)",
      "정리 규칙은 akj-minutes 스킬과 같은 기준",
    ],
  },
  {
    slug: "mail",
    name: "메일",
    group: "work",
    stage: 2,
    status: "planned",
    summary: "회사 메일 전체 사본을 NAS에 쌓고 프로젝트별로 묶어 보는 곳",
    scope: [
      "메일 서비스에 IMAP으로 연결 — 받은 메일함·보낸 메일함",
      "메일 원본·첨부 NAS 보관, 검색",
      "프로젝트 코드별 자동 분류, 첨부는 프로젝트 폴더로",
      "긴 대화 요약, AKJ 말투 답장 초안",
      "보관이 확인된 오래된 메일은 메일 서비스에서 정리 (용량 관리)",
    ],
    notes: [
      "메일 서버는 외부 서비스를 쓴다 — NAS에서 직접 운영하지 않는다",
      "NAS 저장이 확인된 메일만 지운다",
      "메일 보관함은 NAS 백업 대상에 꼭 넣는다",
    ],
  },
  {
    slug: "aad",
    name: "AAD System",
    group: "design",
    stage: 1,
    status: "building",
    summary: "대지·법규·사업성·매스를 노드 캔버스로 검토하는 사내 설계 앱",
    scope: [
      "지금은 별도 앱(aad_system)으로 개발 중",
      "서버를 NAS로 옮기면 라이노 AAD 명령이 모든 PC에서 같은 서버를 쓴다",
      "포털 로그인·프로젝트 코드와 연결",
    ],
    notes: [
      "계산은 코드, 판단은 AI — 법규 수치는 룰 엔진이 내고 숫자마다 출처를 남긴다",
      "브이월드 인증키는 포털 주소로 새로 등록해야 한다",
      "지형 데이터는 서버에 저장하지 않는다 (국토부 보안규정)",
    ],
  },
  {
    slug: "tools",
    name: "건축 계산기",
    group: "design",
    stage: 1,
    status: "planned",
    summary: "실무에서 반복하는 계산을 웹에서 바로 하는 작은 도구 모음",
    scope: [
      "주차장 램프 계산기 — 결과를 DXF로 바로 그리기",
      "면적표·실명표 정리",
      "건폐율·용적률·사선 개략 검토",
    ],
    notes: ["법규 수치는 코드가 아니라 데이터 파일로 두고 근거 조문을 같이 적는다"],
  },
  {
    slug: "approvals",
    name: "결재",
    group: "office",
    stage: 2,
    status: "planned",
    summary: "지출결의와 휴가 신청을 올리고 승인하는 곳",
    scope: [
      "지출결의 — 영수증 첨부, 프로젝트 코드 연결",
      "휴가 신청·승인, 남은 연차 표시",
      "결재선과 승인 기록",
    ],
  },
  {
    slug: "attendance",
    name: "근태",
    group: "office",
    stage: 3,
    status: "planned",
    summary: "출퇴근과 근무시간을 기록하는 곳",
    scope: ["출퇴근 기록", "근무시간·연차 집계", "월별 내보내기 (급여 대행용)"],
    notes: ["근로 관련 기록은 법정 보존 대상이라 백업이 필수다"],
  },
  {
    slug: "contracts",
    name: "계약서",
    group: "office",
    stage: 3,
    status: "planned",
    summary: "계약서 목록·진행 상태·원본을 한곳에 두는 곳",
    scope: [
      "계약 목록과 진행 상태 — 작성·서명 중·완료",
      "원본 PDF 보관, 프로젝트 연결",
      "서명은 전자서명 서비스에서 하고 결과만 가져온다",
    ],
    notes: ["서명의 법적 효력은 전자서명 서비스에 맡긴다"],
  },
  {
    slug: "people",
    name: "인사",
    group: "office",
    stage: 3,
    status: "planned",
    summary: "직원 기본 정보와 권한을 관리하는 곳",
    scope: ["직원 기본 정보, 입·퇴사 기록", "권한 — 누가 어떤 메뉴와 폴더를 보는지"],
    notes: [
      "주민번호·급여·계좌 같은 민감정보는 마지막 단계에서, 꼭 필요한 것만 암호화해 보관한다",
      "급여·4대보험 계산은 세무 대행을 유지한다",
    ],
  },
];

export function getModule(slug: string): PortalModule | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function modulesInGroup(group: ModuleGroup): PortalModule[] {
  return MODULES.filter((m) => m.group === group);
}
