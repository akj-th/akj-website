// 인프라 전환 단계 — 구글 → NAS 전환과 공개 사이트 배포.
// 포털 기능 단계는 modules.ts 의 stage 에서 만든다.

export interface RoadmapStep {
  title: string;
  when: string;
  items: string[];
}

export const INFRA_STEPS: RoadmapStep[] = [
  {
    title: "지금 바로",
    when: "2026-10",
    items: [
      "메일 도메인 인증(SPF·DKIM·DMARC) 정비",
      "공개 사이트 시안 정리 (site/)",
      "포털 화면 시안 — 가짜 데이터로 전 메뉴 (portal/)",
      "3DM 뷰어",
    ],
  },
  {
    title: "NAS 구축",
    when: "2026-11",
    items: [
      "NAS 설치, 공유 폴더·계정·권한",
      "스냅샷(변경 불가 스냅샷 포함), 외장 하드 백업, 회사 밖 백업",
      "구글 워크스페이스 전체 백업 시작 (Active Backup for Google Workspace)",
      "도면 외부참조 경로 점검",
    ],
  },
  {
    title: "병행 기간",
    when: "NAS 구축 후 몇 달",
    items: [
      "구글 드라이브와 NAS를 함께 사용",
      "메일·캘린더 서비스 결정과 이전",
      "직원 PC 네트워크 드라이브 연결",
      "이전 파일 대조 검증, 도면 링크 수정",
    ],
  },
  {
    title: "전환 마무리",
    when: "검증이 끝난 뒤",
    items: [
      "구글 워크스페이스 해지 — 데이터 내보내기를 확인한 뒤",
      "공개 사이트 배포 (Cloudflare Pages), 기존 홈페이지 호스팅 정리",
      "도메인 atelier-kj.com은 유지",
    ],
  },
];

export const STAGE_TITLE: Record<1 | 2 | 3, string> = {
  1: "1단계 — 프로젝트 일의 기본",
  2: "2단계 — 메일과 결재",
  3: "3단계 — 근태·계약·인사",
};
