// 데모 데이터 — 지어낸 계약. 상대방·금액 모두 가상.

export const CONTRACT_STAGES = ["작성", "검토", "서명 중", "완료"] as const;
export type ContractStatus = (typeof CONTRACT_STAGES)[number];

export interface Contract {
  id: string;
  project: string;
  title: string;
  kind: string;
  counterparty: string;
  amount: number;
  status: ContractStatus;
  created: string;
  signedAt?: string;
  signers: { name: string; org: string; signed: boolean }[];
  file: string;
}

export const CONTRACTS: Contract[] = [
  {
    id: "c1", project: "32612", title: "베이커리 카페 인테리어 설계용역", kind: "설계용역", counterparty: "(주)사아자베이커리",
    amount: 28_000_000, status: "검토", created: "2026-10-22",
    signers: [{ name: "윤서아", org: "아틀리에케이제이", signed: false }, { name: "대표이사", org: "(주)사아자베이커리", signed: false }],
    file: "32612_설계용역계약서_초안.pdf",
  },
  {
    id: "c2", project: "12611", title: "구조설계 외주 계약", kind: "구조 외주", counterparty: "가상구조사무소",
    amount: 14_500_000, status: "서명 중", created: "2026-10-14",
    signers: [{ name: "윤서아", org: "아틀리에케이제이", signed: true }, { name: "김구조", org: "가상구조사무소", signed: false }],
    file: "12611_구조외주계약서.pdf",
  },
  {
    id: "c3", project: "42611", title: "해안마을 재생 마스터플랜 용역 (변경 1차)", kind: "용역 변경", counterparty: "가상군청",
    amount: 210_000_000, status: "작성", created: "2026-10-29",
    signers: [{ name: "강도윤", org: "아틀리에케이제이", signed: false }, { name: "도시재생팀장", org: "가상군청", signed: false }],
    file: "42611_변경계약서_작성중.docx",
  },
  {
    id: "c4", project: "32611", title: "핀테크 오피스 인테리어 설계·감리", kind: "설계·감리", counterparty: "(주)라마바핀테크",
    amount: 65_000_000, status: "완료", created: "2026-05-20", signedAt: "2026-05-28",
    signers: [{ name: "윤서아", org: "아틀리에케이제이", signed: true }, { name: "대표이사", org: "(주)라마바핀테크", signed: true }],
    file: "32611_설계감리계약서_서명완료.pdf",
  },
  {
    id: "c5", project: "12612", title: "양평 주말주택 설계용역", kind: "설계용역", counterparty: "개인 건축주 A",
    amount: 42_000_000, status: "완료", created: "2026-08-10", signedAt: "2026-08-14",
    signers: [{ name: "윤서아", org: "아틀리에케이제이", signed: true }, { name: "건축주 A", org: "개인", signed: true }],
    file: "12612_설계용역계약서_서명완료.pdf",
  },
  {
    id: "c6", project: "52611", title: "탄소저감 설계지침 연구용역", kind: "연구용역", counterparty: "가상건축연구원",
    amount: 95_000_000, status: "완료", created: "2026-04-24", signedAt: "2026-04-30",
    signers: [{ name: "윤서아", org: "아틀리에케이제이", signed: true }, { name: "원장", org: "가상건축연구원", signed: true }],
    file: "52611_연구용역계약서_서명완료.pdf",
  },
];
