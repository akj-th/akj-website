"use client";

// 데모 상태 — 결재·할 일·메일 읽음·출퇴근을 브라우저(localStorage)에만 저장한다.
// 서버 저장은 NAS 구축 후. '데모 데이터 초기화'로 처음 상태로 돌린다.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { APPROVALS, type Approval } from "@/data/approvals";
import { CONTRACTS, type Contract, type ContractStatus } from "@/data/contracts";
import { DEMO_TODAY } from "@/data/demo";
import { MAILS } from "@/data/mail";
import { CHANNELS, LAST_READ, type ChatMessage } from "@/data/messages";
import { MINUTES, type Minutes } from "@/data/minutes";
import { person } from "@/data/people";
import type { Event } from "@/data/schedule";

interface DemoState {
  approvals: Approval[];
  contracts: Contract[];
  /** 포털에서 새로 만든 회의록 (AI 정리 결과) */
  minutes: Minutes[];
  /** 데모 중 보낸 메시지·자동 알림 */
  chat: ChatMessage[];
  lastRead: Record<string, string>;
  reacted: Record<string, boolean>;
  /** 데모 중 추가한 일정 */
  events: Event[];
  sendMessage: (m: Omit<ChatMessage, "id">) => void;
  markRead: (channel: string, at: string) => void;
  toggleReaction: (key: string) => void;
  addEvent: (e: Event) => void;
  actionsDone: Record<string, boolean>;
  mailRead: Record<string, boolean>;
  clock: Record<string, { in?: string; out?: string }>;
  approve: (id: string, me: string, comment?: string) => void;
  reject: (id: string, me: string, comment: string) => void;
  addApproval: (a: Approval) => void;
  addMinutes: (m: Minutes) => void;
  toggleAction: (id: string) => void;
  readMail: (id: string) => void;
  clockIn: (time: string) => void;
  clockOut: (time: string) => void;
  setContractStatus: (id: string, status: ContractStatus) => void;
  reset: () => void;
}

const seed = () => ({
  approvals: structuredClone(APPROVALS),
  contracts: structuredClone(CONTRACTS),
  minutes: [] as Minutes[],
  chat: [] as ChatMessage[],
  lastRead: { ...LAST_READ },
  reacted: {} as Record<string, boolean>,
  events: [] as Event[],
  actionsDone: Object.fromEntries(MINUTES.flatMap((m) => m.actions.map((a) => [a.id, a.done]))),
  mailRead: Object.fromEntries(MAILS.map((m) => [m.id, !m.unread])),
  clock: { [DEMO_TODAY]: { in: "08:52" } } as Record<string, { in?: string; out?: string }>,
});

const now = () => `${DEMO_TODAY}T${new Date().toTimeString().slice(0, 5)}`;

/** 포털에서 일어난 일을 프로젝트 채널에 자동 알림으로 남긴다 */
function botNote(project: string | undefined, text: string, link: ChatMessage["link"]): ChatMessage[] {
  const ch = project && CHANNELS.find((c) => c.project === project);
  return ch ? [{ id: `bot-${Date.now()}`, channel: ch.id, author: "bot", at: now(), text, link }] : [];
}

export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      ...seed(),
      approve: (id, me, comment) =>
        set((s) => ({
          approvals: s.approvals.map((a) => {
            if (a.id !== id) return a;
            const line = a.line.map((l) => ({ ...l }));
            const i = line.findIndex((l) => l.status === "pending" && l.person === me);
            if (i < 0) return a;
            line[i] = { ...line[i], status: "done", at: now(), comment };
            const next = line.findIndex((l) => l.status === "waiting");
            if (next >= 0) line[next].status = "pending";
            return { ...a, line, status: next >= 0 ? "진행" : "승인" };
          }),
        })),
      reject: (id, me, comment) =>
        set((s) => ({
          approvals: s.approvals.map((a) => {
            if (a.id !== id) return a;
            const line = a.line.map((l) =>
              l.status === "pending" && l.person === me ? { ...l, status: "rejected" as const, at: now(), comment } : l,
            );
            return { ...a, line, status: "반려" };
          }),
        })),
      addApproval: (a) =>
        set((s) => ({
          approvals: [a, ...s.approvals],
          chat: [...s.chat, ...botNote(a.project, `${person(a.requester)?.name}님이 결재를 올렸습니다 — ${a.title}`, { href: `/approvals?id=${a.id}`, label: "결재 보기" })],
        })),
      addMinutes: (m) =>
        set((s) => ({
          minutes: [m, ...s.minutes],
          chat: [...s.chat, ...botNote(m.project, `회의록이 저장되었습니다 — ${m.title} (할 일 ${m.actions.length}건)`, { href: `/minutes?id=${m.id}`, label: "회의록 보기" })],
          actionsDone: { ...s.actionsDone, ...Object.fromEntries(m.actions.map((a) => [a.id, a.done])) },
        })),
      toggleAction: (id) => set((s) => ({ actionsDone: { ...s.actionsDone, [id]: !s.actionsDone[id] } })),
      readMail: (id) => set((s) => ({ mailRead: { ...s.mailRead, [id]: true } })),
      clockIn: (time) => set((s) => ({ clock: { ...s.clock, [DEMO_TODAY]: { in: time } } })),
      clockOut: (time) => set((s) => ({ clock: { ...s.clock, [DEMO_TODAY]: { ...s.clock[DEMO_TODAY], out: time } } })),
      setContractStatus: (id, status) =>
        set((s) => ({
          contracts: s.contracts.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status,
                  signedAt: status === "완료" ? DEMO_TODAY : c.signedAt,
                  signers: status === "완료" ? c.signers.map((x) => ({ ...x, signed: true })) : c.signers,
                }
              : c,
          ),
        })),
      sendMessage: (m) => set((s) => ({ chat: [...s.chat, { ...m, id: `msg-${Date.now()}` }], lastRead: { ...s.lastRead, [m.channel]: m.at } })),
      markRead: (channel, at) => set((s) => (s.lastRead[channel] >= at ? s : { lastRead: { ...s.lastRead, [channel]: at } })),
      toggleReaction: (key) => set((s) => ({ reacted: { ...s.reacted, [key]: !s.reacted[key] } })),
      addEvent: (e) =>
        set((s) => ({
          events: [...s.events, e],
          chat: [...s.chat, ...botNote(e.project, `일정이 추가되었습니다 — ${e.title} (${e.date.slice(5, 10).replace("-", ".")} ${e.date.slice(11, 16)})`, { href: "/calendar", label: "캘린더 보기" })],
        })),
      reset: () => set(seed()),
    }),
    {
      name: "akj-portal-demo-v1",
      storage: createJSONStorage(() => localStorage),
      // 서버 렌더와 첫 화면을 맞추려고 마운트 뒤에 불러온다 (DemoHydrator)
      skipHydration: true,
      partialize: ({ approvals, contracts, minutes, chat, lastRead, reacted, events, actionsDone, mailRead, clock }) => ({
        approvals,
        contracts,
        minutes,
        chat,
        lastRead,
        reacted,
        events,
        actionsDone,
        mailRead,
        clock,
      }),
      // 예전 저장본에 없는 필드는 처음 값으로 채운다
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<DemoState>) }),
    },
  ),
);

// 잠깐 떴다 사라지는 알림
interface ToastState {
  items: { id: number; text: string }[];
  push: (text: string) => void;
}

export const useToast = create<ToastState>()((set) => ({
  items: [],
  push: (text) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { id, text }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 2600);
  },
}));
