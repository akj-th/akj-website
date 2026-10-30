"use client";

import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { holidayName } from "@/data/attendance";
import { DEMO_TODAY } from "@/data/demo";
import { person } from "@/data/people";
import { PROJECTS, project } from "@/data/projects";
import { EVENTS, type Event } from "@/data/schedule";
import { fmtDay, fmtTime } from "@/lib/format";
import { useDemo, useToast } from "@/lib/store";
import { Drawer, Field, inputCls, Modal } from "@/components/overlay";
import { Badge, Button, Card, CardHeader, PageHeader, ProjectChip, type Tone } from "@/components/ui";

type Kind = "meeting" | "deadline" | "site" | "leave" | "due";

interface CalEvent {
  id: string;
  date: string;
  allDay: boolean;
  title: string;
  kind: Kind;
  project?: string;
  href?: string;
  note?: string;
}

const KIND: Record<Kind, { label: string; tone: Tone; bar: string }> = {
  meeting: { label: "회의", tone: "dark", bar: "border-ink bg-ink text-paper" },
  site: { label: "현장", tone: "info", bar: "border-info bg-info-bg text-info" },
  deadline: { label: "마감", tone: "bad", bar: "border-bad bg-bad-bg text-bad" },
  due: { label: "프로젝트 마감", tone: "warn", bar: "border-warn bg-warn-bg text-warn" },
  leave: { label: "휴가", tone: "ok", bar: "border-ok bg-ok-bg text-ok" },
};

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");

function NewEvent({ open, onClose }: { open: boolean; onClose: () => void }) {
  const add = useDemo((s) => s.addEvent);
  const toast = useToast((s) => s.push);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-11-04");
  const [time, setTime] = useState("14:00");
  const [kind, setKind] = useState<Event["kind"]>("meeting");
  const [code, setCode] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="새 일정"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            disabled={!title.trim()}
            onClick={() => {
              add({ id: `ev-${Date.now()}`, date: `${date}T${time}`, title: title.trim(), kind, project: code || undefined });
              toast(code ? `일정을 추가했습니다 — ${code} 채널에도 알렸습니다` : "일정을 추가했습니다");
              setTitle("");
              onClose();
            }}
          >
            추가
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="제목">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 건축주 마감재 미팅" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="날짜">
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="시각">
            <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <Field label="종류">
          <div className="flex border border-line" role="group">
            {(["meeting", "site", "deadline"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`h-9 flex-1 text-sm ${kind === k ? "bg-ink text-paper" : "hover:bg-surface"}`}>
                {KIND[k].label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="프로젝트" hint="고르면 그 프로젝트 채널에 알림이 간다">
          <select className={inputCls} value={code} onChange={(e) => setCode(e.target.value)}>
            <option value="">없음</option>
            {PROJECTS.filter((p) => p.status !== "완료").map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

export default function CalendarView() {
  const params = useSearchParams();
  const router = useRouter();
  const added = useDemo((s) => s.events);
  const approvals = useDemo((s) => s.approvals);
  const [ym, setYm] = useState(DEMO_TODAY.slice(0, 7));
  const [hidden, setHidden] = useState<Record<Kind, boolean>>({ meeting: false, site: false, deadline: false, due: false, leave: false });
  const [openId, setOpenId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (params.get("new")) setShowNew(true);
  }, [params]);

  const events = useMemo<CalEvent[]>(() => {
    const out: CalEvent[] = [...EVENTS, ...added].map((e) => ({ id: e.id, date: e.date, allDay: false, title: e.title, kind: e.kind, project: e.project }));
    // 휴가 결재 — 승인됐거나 진행 중인 것
    for (const a of approvals) {
      if (a.kind !== "leave" || !a.leave || a.status === "반려") continue;
      const from = new Date(`${a.leave.from}T00:00:00`);
      const to = new Date(`${a.leave.to}T00:00:00`);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        out.push({ id: `${a.id}-${iso}`, date: iso, allDay: true, title: `${person(a.requester)?.name} ${a.leave.type}`, kind: "leave", href: `/approvals?id=${a.id}`, note: a.status === "승인" ? "승인" : "결재 중" });
      }
    }
    // 프로젝트 마감일
    for (const p of PROJECTS) {
      if (p.status === "완료") continue;
      out.push({ id: `due-${p.code}`, date: p.due, allDay: true, title: `${p.code} ${p.name} 마감`, kind: "due", project: p.code, href: `/projects/${p.code}` });
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [added, approvals]);

  const shown = events.filter((e) => !hidden[e.kind]);
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => `${ym}-${pad(i + 1)}`)];
  while (cells.length % 7) cells.push(null);
  const move = (d: number) => {
    const t = new Date(y, m - 1 + d, 1);
    setYm(`${t.getFullYear()}-${pad(t.getMonth() + 1)}`);
  };
  const open = events.find((e) => e.id === openId);
  const upcoming = shown.filter((e) => e.date.slice(0, 10) >= DEMO_TODAY).slice(0, 9);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="캘린더"
        sub="회의·현장·마감 일정, 휴가 결재, 프로젝트 마감이 한곳에 · 데모 일정"
        actions={
          <Button variant="primary" onClick={() => setShowNew(true)}>
            <CalendarPlus size={15} /> 새 일정
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-1">
              <button type="button" aria-label="이전 달" onClick={() => move(-1)} className="grid h-8 w-8 place-items-center hover:bg-surface">
                <ChevronLeft size={16} />
              </button>
              <span className="w-28 text-center font-semibold tabular-nums">
                {y}년 {m}월
              </span>
              <button type="button" aria-label="다음 달" onClick={() => move(1)} className="grid h-8 w-8 place-items-center hover:bg-surface">
                <ChevronRight size={16} />
              </button>
              <Button size="sm" variant="ghost" onClick={() => setYm(DEMO_TODAY.slice(0, 7))}>
                오늘
              </Button>
            </div>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {(Object.keys(KIND) as Kind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={!hidden[k]}
                  onClick={() => setHidden((h) => ({ ...h, [k]: !h[k] }))}
                  className={`border px-2 py-0.5 text-xs ${hidden[k] ? "border-line text-stone line-through" : KIND[k].bar}`}
                >
                  {KIND[k].label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-line p-px">
            {DOW.map((d, i) => (
              <div key={d} className={`bg-paper px-2 py-1.5 text-center text-xs ${i === 0 ? "text-bad" : i === 6 ? "text-info" : "text-mute"}`}>
                {d}
              </div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`e${i}`} className="min-h-28 bg-surface" />;
              const list = shown.filter((e) => e.date.slice(0, 10) === date);
              const hol = holidayName(date);
              const dow = i % 7;
              const today = date === DEMO_TODAY;
              return (
                <div key={date} className={`flex min-h-28 flex-col gap-1 bg-paper p-1.5 ${today ? "outline-2 -outline-offset-2 outline-ink" : ""}`}>
                  <span className="flex items-center justify-between text-xs">
                    <span className={`tabular-nums ${today ? "bg-ink px-1 font-semibold text-paper" : dow === 0 || hol ? "text-bad" : dow === 6 ? "text-info" : ""}`}>{Number(date.slice(8))}</span>
                    {hol && <span className="truncate text-[10px] text-bad">{hol}</span>}
                  </span>
                  {list.slice(0, 3).map((e) => (
                    <button key={e.id} type="button" onClick={() => setOpenId(e.id)} className={`truncate border-l-2 px-1.5 py-0.5 text-left text-[11px] leading-tight ${KIND[e.kind].bar}`} title={e.title}>
                      {!e.allDay && <span className="tabular-nums opacity-70">{fmtTime(e.date)} </span>}
                      {e.title}
                    </button>
                  ))}
                  {list.length > 3 && <span className="text-[11px] text-mute">+{list.length - 3}</span>}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="다가오는 일정" />
          <ul className="divide-y divide-line">
            {upcoming.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => setOpenId(e.id)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-surface">
                  <span className="w-16 shrink-0 text-xs text-mute tabular-nums">
                    {fmtDay(e.date.slice(0, 10))}
                    {!e.allDay && (
                      <>
                        <br />
                        {fmtTime(e.date)}
                      </>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-sm">{e.title}</span>
                    <span className="flex gap-1.5">
                      <Badge tone={KIND[e.kind].tone}>{KIND[e.kind].label}</Badge>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.title} width={440}>
        {open && (
          <div className="flex flex-col gap-4 text-sm">
            <dl className="grid grid-cols-[4rem_1fr] gap-y-2">
              <dt className="text-mute">종류</dt>
              <dd>
                <Badge tone={KIND[open.kind].tone}>{KIND[open.kind].label}</Badge> {open.note && <span className="text-mute">{open.note}</span>}
              </dd>
              <dt className="text-mute">일시</dt>
              <dd className="tabular-nums">
                {fmtDay(open.date.slice(0, 10))} {!open.allDay && fmtTime(open.date)}
              </dd>
              {open.project && (
                <>
                  <dt className="text-mute">프로젝트</dt>
                  <dd className="flex items-center gap-2">
                    <ProjectChip code={open.project} /> {project(open.project)?.name}
                  </dd>
                </>
              )}
            </dl>
            <div className="flex flex-wrap gap-2">
              {open.href && (
                <Link href={open.href} className="border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-paper">
                  원본 보기
                </Link>
              )}
              {open.project && (
                <Link href={`/messages?c=c-${open.project}`} className="border border-line px-3 py-1.5 text-xs hover:border-ink">
                  프로젝트 채널
                </Link>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <NewEvent open={showNew} onClose={() => (setShowNew(false), params.get("new") && router.replace("/calendar"))} />
    </div>
  );
}
