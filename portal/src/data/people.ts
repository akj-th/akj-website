// 데모 데이터 — 실제 직원이 아니다. 이름·연락처·입사일 모두 지어낸 값.
// NAS 구축 후 사내 계정 데이터로 바꾼다.

export type PresenceStatus = "office" | "remote" | "field" | "leave";
export type Role = "admin" | "manager" | "member";

export interface Person {
  id: string;
  name: string;
  title: string;
  team: string;
  email: string;
  phone: string;
  joined: string;
  status: PresenceStatus;
  role: Role;
  leaveTotal: number;
  leaveUsed: number;
}

export const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  office: "사무실",
  remote: "재택",
  field: "외근",
  leave: "휴가",
};

export const PEOPLE: Person[] = [
  { id: "p1", name: "강도윤", title: "대표 건축가", team: "디자인", email: "doyun.kang@example.com", phone: "010-0000-0101", joined: "2016-05-02", status: "field", role: "admin", leaveTotal: 20, leaveUsed: 6 },
  { id: "p2", name: "윤서아", title: "공동 대표", team: "디자인", email: "seoa.yoon@example.com", phone: "010-0000-0102", joined: "2016-05-02", status: "office", role: "admin", leaveTotal: 20, leaveUsed: 9 },
  { id: "p3", name: "한지호", title: "실장", team: "설계", email: "jiho.han@example.com", phone: "010-0000-0103", joined: "2019-03-04", status: "office", role: "manager", leaveTotal: 17, leaveUsed: 8.5 },
  { id: "p4", name: "오하린", title: "선임", team: "설계", email: "harin.oh@example.com", phone: "010-0000-0104", joined: "2021-07-12", status: "office", role: "member", leaveTotal: 16, leaveUsed: 11 },
  { id: "p5", name: "임시우", title: "선임", team: "인테리어", email: "siwoo.lim@example.com", phone: "010-0000-0105", joined: "2022-01-03", status: "field", role: "member", leaveTotal: 15, leaveUsed: 7 },
  { id: "p6", name: "배유나", title: "디자이너", team: "인테리어", email: "yuna.bae@example.com", phone: "010-0000-0106", joined: "2023-09-01", status: "remote", role: "member", leaveTotal: 15, leaveUsed: 4 },
  { id: "p7", name: "송태오", title: "디자이너", team: "설계", email: "taeo.song@example.com", phone: "010-0000-0107", joined: "2024-03-04", status: "leave", role: "member", leaveTotal: 15, leaveUsed: 10 },
  { id: "p8", name: "문채원", title: "경영지원", team: "운영", email: "chaewon.moon@example.com", phone: "010-0000-0108", joined: "2022-06-20", status: "office", role: "manager", leaveTotal: 15, leaveUsed: 5 },
];

/** 데모 로그인 사용자 */
export const ME = "p3";

export const person = (id: string) => PEOPLE.find((p) => p.id === id);
