// 포털 모듈 목록 — 메뉴와 로드맵이 이 파일을 읽는다.
// status: planned 준비 중 → demo 시안(가짜 데이터로 화면만) → building 개발 중(실제 기능) → live 운영 중

export type ModuleStatus = "planned" | "demo" | "building" | "live";
export type ModuleGroup = "work" | "design" | "office";
export type Stage = 1 | 2 | 3;

export interface PortalModule {
  slug: string;
  name: string;
  group: ModuleGroup;
  stage: Stage;
  status: ModuleStatus;
  summary: string;
  /** 시안 다음에 실제로 붙일 것 */
  next: string[];
}

export const GROUPS: { id: ModuleGroup; name: string }[] = [
  { id: "work", name: "프로젝트 업무" },
  { id: "design", name: "설계 도구" },
  { id: "office", name: "회사 운영" },
];

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  planned: "준비 중",
  demo: "시안",
  building: "개발 중",
  live: "운영 중",
};

export const MODULES: PortalModule[] = [
  {
    slug: "projects", name: "프로젝트", group: "work", stage: 1, status: "demo",
    summary: "프로젝트 코드 하나로 파일·도면·메일·회의록·결재를 모아 보는 곳",
    next: ["NAS 프로젝트 폴더 실제 연결", "볼트(_PROJECT.md) 정보와 동기화"],
  },
  {
    slug: "viewer", name: "도면·모델 뷰어", group: "work", stage: 1, status: "building",
    summary: "CAD·라이노 없이 웹에서 DWG·3DM을 열어 보고 표시하는 곳",
    next: ["DWG 뷰어 (사내 DXF 변환, 한글 SHX 대체)", "코멘트·구름표 마크업", "3DM 간단 수정 후 새 버전 저장"],
  },
  {
    slug: "minutes", name: "회의록", group: "work", stage: 1, status: "demo",
    summary: "회의 녹음·메모를 올리면 할 일 중심 회의록이 프로젝트 폴더에 남는 곳",
    next: ["전사본 → AKJ 회의록 규칙으로 자동 정리", "음성인식 서비스 연결", "Word·PDF 내보내기"],
  },
  {
    slug: "mail", name: "메일", group: "work", stage: 2, status: "demo",
    summary: "회사 메일 전체 사본을 NAS에 쌓고 프로젝트별로 묶어 보는 곳",
    next: ["메일 서비스 IMAP 연결", "NAS 보관·오래된 메일 정리", "요약·답장 초안 실제 생성"],
  },
  {
    slug: "aad", name: "AAD System", group: "design", stage: 1, status: "building",
    summary: "대지·법규·사업성·매스를 노드 캔버스로 검토하는 사내 설계 앱",
    next: ["서버 NAS 이전", "포털 로그인·프로젝트 코드 연결"],
  },
  {
    slug: "tools", name: "건축 계산기", group: "design", stage: 1, status: "building",
    summary: "실무에서 반복하는 계산을 웹에서 바로 하는 작은 도구 모음",
    next: ["면적표 정리", "건폐율·용적률 개략 검토 (AAD 법규 모듈)", "램프 계산기 — 나선형 다층 연속"],
  },
  {
    slug: "approvals", name: "결재", group: "office", stage: 2, status: "demo",
    summary: "지출결의와 휴가 신청을 올리고 승인하는 곳",
    next: ["서버 저장·알림", "영수증 NAS 보관", "회계 내보내기"],
  },
  {
    slug: "attendance", name: "근태", group: "office", stage: 3, status: "demo",
    summary: "출퇴근과 근무시간, 연차를 보는 곳",
    next: ["서버 저장", "월별 내보내기 (급여 대행용)", "법정 보존 기간 백업"],
  },
  {
    slug: "contracts", name: "계약서", group: "office", stage: 3, status: "demo",
    summary: "계약서 목록·진행 상태·원본을 한곳에 두는 곳",
    next: ["전자서명 서비스 연결", "원본 PDF NAS 보관"],
  },
  {
    slug: "people", name: "인사", group: "office", stage: 3, status: "demo",
    summary: "직원 정보와 메뉴·폴더 권한을 관리하는 곳",
    next: ["NAS 계정과 연결", "민감정보 암호화 보관 (3단계)"],
  },
];

export const modulesInGroup = (g: ModuleGroup) => MODULES.filter((m) => m.group === g);
