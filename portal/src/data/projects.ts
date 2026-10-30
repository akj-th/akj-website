// 데모 데이터 — 실제 프로젝트가 아니다. 코드는 AKJ 체계([유형][연도][순번])를 따르되
// 실제 코드와 겹치지 않게 순번 11~19를 쓴다. 건축주·주소·금액은 모두 지어낸 값.

export const TYPE_LABEL: Record<number, string> = {
  1: "신축",
  2: "증축·대수선",
  3: "인테리어",
  4: "도시설계",
  5: "연구용역",
  6: "기획·브랜딩",
  7: "공모전",
  8: "사내스터디",
};

export const STAGES = ["기획", "계획설계", "기본설계", "실시설계", "인허가", "시공", "준공"] as const;
export type Stage = (typeof STAGES)[number];
export type ProjectStatus = "진행" | "대기" | "보류" | "완료";

export interface ModelFile {
  name: string;
  /** 뷰어로 열 수 있는 데모 파일 경로 */
  sample?: string;
}

export interface Project {
  code: string;
  name: string;
  client: string;
  address: string;
  stage: Stage;
  /** 현재 단계 안에서의 진행률 */
  progress: number;
  status: ProjectStatus;
  pm: string;
  team: string[];
  start: string;
  due: string;
  fee: number;
  billed: number;
  area?: number;
  note: string;
  models: ModelFile[];
}

const SAMPLE = "/samples/demo-massing.3dm";

export const PROJECTS: Project[] = [
  {
    code: "12611", name: "성수동 근린생활시설 신축", client: "가나다개발(주)", address: "서울 성동구 성수동2가 000-00",
    stage: "실시설계", progress: 62, status: "진행", pm: "p3", team: ["p4", "p7"], start: "2026-03-09", due: "2027-01-29",
    fee: 180_000_000, billed: 90_000_000, area: 1240, note: "지하 1층·지상 6층. 1층 근린, 상층부 업무.",
    models: [{ name: "261020_MASS_STUDY.3dm", sample: SAMPLE }, { name: "261027_FACADE_v3.3dm" }],
  },
  {
    code: "12612", name: "양평 주말주택", client: "개인 건축주 A", address: "경기 양평군 서종면 000-0",
    stage: "기본설계", progress: 35, status: "진행", pm: "p4", team: ["p7"], start: "2026-08-17", due: "2027-03-31",
    fee: 42_000_000, billed: 12_600_000, area: 132, note: "경사지 단층 주택. 북한강 조망.",
    models: [{ name: "261015_SITE_MASS.3dm", sample: SAMPLE }],
  },
  {
    code: "22611", name: "연희동 다가구 대수선", client: "개인 건축주 B", address: "서울 서대문구 연희동 000-00",
    stage: "인허가", progress: 70, status: "진행", pm: "p3", team: ["p4"], start: "2026-05-11", due: "2026-12-18",
    fee: 38_000_000, billed: 26_600_000, area: 286, note: "1990년대 다가구 구조 보강·외피 교체.",
    models: [{ name: "260930_EXISTING.3dm" }],
  },
  {
    code: "32611", name: "핀테크 오피스 인테리어", client: "(주)라마바핀테크", address: "서울 강남구 테헤란로 000, 12층",
    stage: "시공", progress: 85, status: "진행", pm: "p5", team: ["p6"], start: "2026-06-01", due: "2026-11-20",
    fee: 65_000_000, billed: 52_000_000, area: 820, note: "업무 120석, 라운지·회의실 8개.",
    models: [{ name: "261028_MODELING.3dm", sample: SAMPLE }],
  },
  {
    code: "32612", name: "베이커리 카페 인테리어", client: "(주)사아자베이커리", address: "서울 마포구 연남동 000-0",
    stage: "계획설계", progress: 20, status: "진행", pm: "p5", team: ["p6"], start: "2026-10-05", due: "2027-01-15",
    fee: 28_000_000, billed: 0, area: 165, note: "1층 매장·2층 작업실.",
    models: [],
  },
  {
    code: "42611", name: "해안마을 재생 마스터플랜", client: "가상군청", address: "가상군 해안면 일원",
    stage: "기본설계", progress: 45, status: "진행", pm: "p1", team: ["p3", "p7"], start: "2026-04-20", due: "2027-02-26",
    fee: 210_000_000, billed: 84_000_000, note: "마을 3개 권역, 공공시설 5개소 배치계획.",
    models: [{ name: "261010_MASTERPLAN.3dm", sample: SAMPLE }],
  },
  {
    code: "52611", name: "공공건축 탄소저감 설계지침 연구", client: "가상건축연구원", address: "—",
    stage: "기본설계", progress: 55, status: "진행", pm: "p2", team: ["p4"], start: "2026-05-01", due: "2026-12-31",
    fee: 95_000_000, billed: 47_500_000, note: "중간보고 완료. 최종보고서 작성 중.",
    models: [],
  },
  {
    code: "72611", name: "구립 문화센터 설계공모", client: "가상구청", address: "서울 가상구 000-0",
    stage: "계획설계", progress: 80, status: "진행", pm: "p2", team: ["p3", "p6", "p7"], start: "2026-09-21", due: "2026-11-06",
    fee: 0, billed: 0, area: 3400, note: "제출 마감 11월 6일. 패널 4장·설명서.",
    models: [{ name: "261029_COMPETITION_MASS.3dm", sample: SAMPLE }],
  },
  {
    code: "82611", name: "사내 BIM·도면 표준 정비", client: "사내", address: "—",
    stage: "기획", progress: 30, status: "대기", pm: "p3", team: ["p8"], start: "2026-10-01", due: "2026-12-31",
    fee: 0, billed: 0, note: "레이어·블록·출력 스타일 표준. NAS 이전과 같이 진행.",
    models: [],
  },
  {
    code: "12511", name: "판교 업무시설 신축", client: "(주)차카타", address: "경기 성남시 분당구 000-0",
    stage: "준공", progress: 100, status: "완료", pm: "p1", team: ["p3", "p4"], start: "2025-02-03", due: "2026-08-28",
    fee: 320_000_000, billed: 320_000_000, area: 5200, note: "사용승인 완료.",
    models: [{ name: "260801_AS_BUILT.3dm" }],
  },
];

export const project = (code: string) => PROJECTS.find((p) => p.code === code);
export const typeOf = (code: string) => TYPE_LABEL[Number(code[0])] ?? "기타";

/** 실제 프로젝트 폴더 템플릿(00 ADMIN ~ 04 OUTPUT) 구조에 데모 파일을 몇 개씩 넣는다 */
export interface FileNode {
  name: string;
  kind: "folder" | "pdf" | "dwg" | "3dm" | "img" | "doc" | "xls";
  size?: string;
  sample?: string;
  children?: FileNode[];
}

export function fileTree(p: Project): FileNode[] {
  const models: FileNode[] = p.models.map((m) => ({ name: m.name, kind: "3dm", size: "24.1MB", sample: m.sample }));
  const d = p.code;
  return [
    { name: "00 ADMIN", kind: "folder", children: [
      { name: "00 CONTRACT", kind: "folder", children: [{ name: `${d}_설계용역계약서.pdf`, kind: "pdf", size: "1.2MB" }] },
      { name: "01 INCOMING", kind: "folder", children: [{ name: "건축주_요구사항.pdf", kind: "pdf", size: "640KB" }] },
      { name: "02 OUTGOING", kind: "folder", children: [] },
      { name: "03 MEETING", kind: "folder", children: [{ name: "261015_회의록.docx", kind: "doc", size: "48KB" }, { name: "261024_회의록.docx", kind: "doc", size: "52KB" }] },
      { name: "04 SCHEDULE", kind: "folder", children: [{ name: "공정표.xlsx", kind: "xls", size: "88KB" }] },
    ] },
    { name: "01 DATA", kind: "folder", children: [
      { name: "01 SITE", kind: "folder", children: [{ name: "현황측량도.dwg", kind: "dwg", size: "3.4MB" }, { name: "현장사진_01.jpg", kind: "img", size: "4.1MB" }] },
      { name: "04 REFERENCE", kind: "folder", children: [] },
    ] },
    { name: "02 DESIGN", kind: "folder", children: [
      { name: "01 CAD", kind: "folder", children: [{ name: "01. 평면도 총합.dwg", kind: "dwg", size: "8.7MB" }, { name: "02. 입면도.dwg", kind: "dwg", size: "5.2MB" }] },
      { name: "02 3D", kind: "folder", children: models },
      { name: "03 GRAPHIC", kind: "folder", children: [{ name: "투시도_01.jpg", kind: "img", size: "6.8MB" }] },
    ] },
    { name: "03 REVIEW", kind: "folder", children: [
      { name: "00 법규 검토", kind: "folder", children: [{ name: "법규검토서.pdf", kind: "pdf", size: "900KB" }] },
      { name: "01 건축허가", kind: "folder", children: [] },
    ] },
    { name: "04 OUTPUT", kind: "folder", children: [{ name: "중간보고.pdf", kind: "pdf", size: "18.2MB" }] },
  ];
}
