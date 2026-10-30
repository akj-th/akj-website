"use client";

import { Bell, CalendarPlus, ChevronDown, NotebookPen, Plane, Plus, Receipt, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { currentApprover } from "@/data/approvals";
import { DEMO_TODAY } from "@/data/demo";
import { MAILS } from "@/data/mail";
import { CHANNELS } from "@/data/messages";
import { useUnread } from "@/lib/chat";
import { MINUTES } from "@/data/minutes";
import { ME, PEOPLE, person } from "@/data/people";
import { PROJECTS } from "@/data/projects";
import { daysBetween, fmtDay } from "@/lib/format";
import { useDemo, useToast } from "@/lib/store";
import { Avatar } from "./ui";

function useOutside(ref: React.RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, close]);
}

function Menu({
  button,
  children,
  align = "right",
  width = 280,
}: {
  button: (open: boolean, toggle: () => void) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      {button(open, () => setOpen((o) => !o))}
      {open && (
        <div
          className={`anim-fade absolute top-full z-30 mt-1.5 border border-ink bg-paper shadow-lg ${align === "right" ? "right-0" : "left-0"}`}
          style={{ width }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

interface Hit {
  href: string;
  kind: string;
  label: string;
  sub?: string;
}

function SearchBox() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const contracts = useDemo((s) => s.contracts);
  useOutside(box, () => setOpen(false));

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const has = (...xs: (string | undefined)[]) => xs.some((x) => x?.toLowerCase().includes(s));
    return [
      ...PROJECTS.filter((p) => has(p.code, p.name, p.client)).map((p) => ({ href: `/projects/${p.code}`, kind: "프로젝트", label: `${p.code} ${p.name}`, sub: p.client })),
      ...PEOPLE.filter((p) => has(p.name, p.title, p.team)).map((p) => ({ href: `/people?id=${p.id}`, kind: "사람", label: p.name, sub: `${p.team} · ${p.title}` })),
      ...MAILS.filter((m) => has(m.subject, m.from.name)).map((m) => ({ href: `/mail?id=${m.id}`, kind: "메일", label: m.subject, sub: m.from.name })),
      ...MINUTES.filter((m) => has(m.title, m.project)).map((m) => ({ href: `/minutes?id=${m.id}`, kind: "회의록", label: m.title, sub: fmtDay(m.date) })),
      ...contracts.filter((c) => has(c.title, c.counterparty)).map((c) => ({ href: `/contracts?id=${c.id}`, kind: "계약", label: c.title, sub: c.counterparty })),
    ].slice(0, 9);
  }, [q, contracts]);

  const go = (h: Hit) => {
    setOpen(false);
    setQ("");
    router.push(h.href);
  };

  return (
    <div ref={box} className="relative w-full max-w-md">
      <Search size={15} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-stone" />
      <input
        ref={input}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setSel(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setSel((i) => Math.min(i + 1, hits.length - 1));
          if (e.key === "ArrowUp") setSel((i) => Math.max(i - 1, 0));
          if (e.key === "Enter" && hits[sel]) go(hits[sel]);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="프로젝트·사람·메일·회의록 검색"
        className="h-9 w-full border border-line bg-surface pr-14 pl-8 text-sm outline-none placeholder:text-stone focus:border-ink focus:bg-paper"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 border border-line bg-paper px-1.5 text-[10px] text-mute">Ctrl K</kbd>
      {open && q && (
        <div className="anim-fade absolute top-full right-0 left-0 z-30 mt-1.5 border border-ink bg-paper shadow-lg">
          {hits.length ? (
            <ul role="listbox">
              {hits.map((h, i) => (
                <li key={h.href + i}>
                  <button
                    type="button"
                    onMouseEnter={() => setSel(i)}
                    onClick={() => go(h)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${i === sel ? "bg-surface" : ""}`}
                  >
                    <span className="w-12 shrink-0 text-[11px] text-mute">{h.kind}</span>
                    <span className="min-w-0 flex-1 truncate">{h.label}</span>
                    {h.sub && <span className="max-w-32 truncate text-xs text-stone">{h.sub}</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-4 text-sm text-mute">&lsquo;{q}&rsquo; 결과 없음</p>
          )}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const approvals = useDemo((s) => s.approvals);
  const done = useDemo((s) => s.actionsDone);
  const mailRead = useDemo((s) => s.mailRead);
  const contracts = useDemo((s) => s.contracts);
  const unread = useUnread();

  const items = useMemo(() => {
    const out: { href: string; text: string; when?: string }[] = [];
    const msgs = Object.entries(unread).filter(([, n]) => n > 0);
    if (msgs.length) {
      const [top] = msgs.sort((a, b) => b[1] - a[1]);
      const name = CHANNELS.find((c) => c.id === top[0])?.name;
      out.push({ href: `/messages?c=${top[0]}`, text: `새 메시지 ${msgs.reduce((t, [, n]) => t + n, 0)}개 — ${name}${msgs.length > 1 ? ` 외 ${msgs.length - 1}개 채널` : ""}` });
    }
    approvals
      .filter((a) => a.status === "진행" && currentApprover(a) === ME)
      .forEach((a) => out.push({ href: `/approvals?id=${a.id}`, text: `${person(a.requester)?.name} — ${a.title} 결재 요청`, when: fmtDay(a.created) }));
    MINUTES.flatMap((m) => m.actions)
      .filter((a) => a.owner === ME && !done[a.id] && daysBetween(DEMO_TODAY, a.due) <= 3)
      .forEach((a) => out.push({ href: "/minutes", text: `할 일 마감 임박 — ${a.task}`, when: fmtDay(a.due) }));
    const unreadMail = MAILS.filter((m) => !mailRead[m.id]).length;
    if (unreadMail) out.push({ href: "/mail", text: `읽지 않은 메일 ${unreadMail}통` });
    contracts.filter((c) => c.status === "서명 중").forEach((c) => out.push({ href: `/contracts?id=${c.id}`, text: `서명 대기 — ${c.title}` }));
    return out;
  }, [approvals, done, mailRead, contracts, unread]);

  return (
    <Menu
      width={340}
      button={(open, toggle) => (
        <button type="button" onClick={toggle} aria-label={`알림 ${items.length}건`} className={`relative grid h-9 w-9 place-items-center border ${open ? "border-ink" : "border-line"} bg-paper hover:border-ink`}>
          <Bell size={16} />
          {items.length > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-4 bg-bad px-1 text-center text-[10px] leading-4 text-paper tabular-nums">{items.length}</span>}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="border-b border-line px-3 py-2 text-xs font-medium text-mute">알림</div>
          <ul className="max-h-80 overflow-y-auto">
            {items.map((n, i) => (
              <li key={i}>
                <Link href={n.href} onClick={close} className="flex gap-3 border-b border-line px-3 py-2.5 text-sm last:border-0 hover:bg-surface">
                  <span className="min-w-0 flex-1">{n.text}</span>
                  {n.when && <span className="shrink-0 text-xs text-stone">{n.when}</span>}
                </Link>
              </li>
            ))}
            {!items.length && <li className="px-3 py-6 text-center text-sm text-mute">새 알림 없음</li>}
          </ul>
        </div>
      )}
    </Menu>
  );
}

export default function Topbar() {
  const me = person(ME)!;
  const reset = useDemo((s) => s.reset);
  const toast = useToast((s) => s.push);
  const NEW = [
    { href: "/approvals?new=expense", icon: Receipt, label: "지출결의" },
    { href: "/approvals?new=leave", icon: Plane, label: "휴가 신청" },
    { href: "/minutes?new=1", icon: NotebookPen, label: "회의록" },
    { href: "/calendar?new=1", icon: CalendarPlus, label: "일정" },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-paper/95 px-6 backdrop-blur">
      <SearchBox />
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden border border-dashed border-stone px-2 py-1 text-[11px] text-mute lg:inline" title="실제 데이터가 아니다. 저장은 이 브라우저에만 된다.">
          데모 데이터 · 기준일 {fmtDay(DEMO_TODAY)}
        </span>
        <Menu
          width={200}
          button={(open, toggle) => (
            <button type="button" onClick={toggle} className={`flex h-9 items-center gap-1.5 bg-ink px-3 text-sm font-medium text-paper hover:bg-[#262626] ${open ? "ring-2 ring-ink/20" : ""}`}>
              <Plus size={15} /> 새로 만들기
            </button>
          )}
        >
          {(close) => (
            <ul>
              {NEW.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} onClick={close} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-surface">
                    <n.icon size={15} /> {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Menu>
        <Notifications />
        <Menu
          width={240}
          button={(open, toggle) => (
            <button type="button" onClick={toggle} className="flex h-9 items-center gap-2 pr-1 pl-1 hover:bg-surface">
              <Avatar id={ME} size={30} />
              <span className="hidden flex-col text-left leading-tight md:flex">
                <span className="text-sm font-medium">{me.name}</span>
                <span className="text-[11px] text-mute">{me.title}</span>
              </span>
              <ChevronDown size={14} className="text-mute" />
            </button>
          )}
        >
          {(close) => (
            <div>
              <div className="border-b border-line px-3 py-3">
                <div className="text-sm font-medium">{me.name}</div>
                <div className="text-xs text-mute">{me.email}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  reset();
                  close();
                  toast("데모 데이터를 처음 상태로 되돌렸습니다");
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface"
              >
                <RotateCcw size={14} /> 데모 데이터 초기화
              </button>
              <p className="border-t border-line px-3 py-2 text-[11px] text-stone">로그인·권한은 NAS 계정 연결 후</p>
            </div>
          )}
        </Menu>
      </div>
    </header>
  );
}
