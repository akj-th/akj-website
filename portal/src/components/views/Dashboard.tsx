"use client";

import { ArrowRight, Check, LogIn, LogOut, Paperclip } from "lucide-react";
import Link from "next/link";
import { currentApprover, KIND_LABEL, total } from "@/data/approvals";
import { DEMO_TODAY } from "@/data/demo";
import { MAILS } from "@/data/mail";
import { MINUTES } from "@/data/minutes";
import { ME, person } from "@/data/people";
import { PROJECTS } from "@/data/projects";
import { EVENTS } from "@/data/schedule";
import { workedMinutes } from "@/data/attendance";
import { daysBetween, fmtDay, fmtTime, fmtWhen, hm, wonShort } from "@/lib/format";
import { Dday, StageBar } from "@/lib/project-ui";
import { useDemo, useToast } from "@/lib/store";
import { useNowHM } from "@/lib/useNow";
import { Avatar, Badge, Button, Card, CardHeader, Empty, ProjectChip, Stat } from "@/components/ui";

const nowHM = () => new Date().toTimeString().slice(0, 5);

function ClockCard() {
  const clock = useDemo((s) => s.clock[DEMO_TODAY]);
  const clockIn = useDemo((s) => s.clockIn);
  const clockOut = useDemo((s) => s.clockOut);
  const toast = useToast((s) => s.push);
  const now = useNowHM();
  const worked = clock?.in && (clock.out || now) ? workedMinutes({ in: clock.in, out: clock.out ?? now! }) : null;
  return (
    <div className="flex items-center gap-4 border border-line bg-paper px-4 py-3">
      <div className="flex flex-col text-sm">
        <span className="text-xs text-mute">오늘 근무</span>
        <span className="tabular-nums">
          {clock?.in ? `출근 ${clock.in}` : "출근 전"}
          {clock?.out && ` · 퇴근 ${clock.out}`}
        </span>
        {worked !== null && <span className="text-xs text-mute tabular-nums">{hm(worked)}</span>}
      </div>
      {!clock?.in ? (
        <Button variant="primary" onClick={() => (clockIn(nowHM()), toast("출근 기록했습니다"))}>
          <LogIn size={15} /> 출근
        </Button>
      ) : !clock.out ? (
        <Button onClick={() => (clockOut(nowHM()), toast("퇴근 기록했습니다"))}>
          <LogOut size={15} /> 퇴근
        </Button>
      ) : (
        <Badge tone="ok">근무 종료</Badge>
      )}
    </div>
  );
}

export default function Dashboard() {
  const me = person(ME)!;
  const approvals = useDemo((s) => s.approvals);
  const done = useDemo((s) => s.actionsDone);
  const toggle = useDemo((s) => s.toggleAction);
  const mailRead = useDemo((s) => s.mailRead);
  const approve = useDemo((s) => s.approve);
  const toast = useToast((s) => s.push);

  const active = PROJECTS.filter((p) => p.status === "진행").sort((a, b) => a.due.localeCompare(b.due));
  const myQueue = approvals.filter((a) => a.status === "진행" && currentApprover(a) === ME);
  const unread = MAILS.filter((m) => !mailRead[m.id]);
  const deadlines = EVENTS.filter((e) => e.kind === "deadline" && daysBetween(DEMO_TODAY, e.date) >= 0 && daysBetween(DEMO_TODAY, e.date) <= 7);
  const myActions = MINUTES.flatMap((m) => m.actions.map((a) => ({ ...a, project: m.project, meeting: m.title })))
    .filter((a) => a.owner === ME)
    .sort((a, b) => Number(!!done[a.id]) - Number(!!done[b.id]) || a.due.localeCompare(b.due));
  const upcoming = EVENTS.filter((e) => e.date.slice(0, 10) >= DEMO_TODAY).slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mute">{fmtDay(DEMO_TODAY)}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            안녕하세요, {me.name} {me.title}님
          </h1>
        </div>
        <ClockCard />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="진행 중 프로젝트" value={active.length} sub={`전체 ${PROJECTS.length}건`} href="/projects" />
        <Stat label="내가 결재할 문서" value={myQueue.length} sub={myQueue.length ? "확인 필요" : "모두 처리"} href="/approvals" />
        <Stat label="7일 안 마감" value={deadlines.length} sub={deadlines[0] ? `가장 빠른 것 ${fmtDay(deadlines[0].date)}` : "없음"} />
        <Stat label="읽지 않은 메일" value={unread.length} sub="받은 메일함" href="/mail" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader
              title="진행 프로젝트"
              sub="마감 순"
              action={
                <Link href="/projects" className="flex items-center gap-1 text-xs text-mute hover:text-ink">
                  전체 <ArrowRight size={12} />
                </Link>
              }
            />
            <ul className="divide-y divide-line">
              {active.slice(0, 6).map((p) => (
                <li key={p.code}>
                  <Link href={`/projects/${p.code}`} className="grid grid-cols-[3.5rem_1fr_9rem_4.5rem_2rem] items-center gap-4 px-4 py-3 hover:bg-surface">
                    <span className="text-sm font-semibold tabular-nums">{p.code}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-mute">{p.client}</span>
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="text-xs">
                        {p.stage} <span className="text-mute tabular-nums">{p.progress}%</span>
                      </span>
                      <StageBar p={p} />
                    </span>
                    <span className="text-right">
                      <Dday date={p.due} today={DEMO_TODAY} />
                    </span>
                    <Avatar id={p.pm} size={26} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="최근 메일"
              sub={`안 읽음 ${unread.length}`}
              action={
                <Link href="/mail" className="flex items-center gap-1 text-xs text-mute hover:text-ink">
                  메일함 <ArrowRight size={12} />
                </Link>
              }
            />
            <ul className="divide-y divide-line">
              {MAILS.filter((m) => m.folder === "inbox")
                .slice(0, 4)
                .map((m) => (
                  <li key={m.id}>
                    <Link href={`/mail?id=${m.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${mailRead[m.id] ? "bg-transparent" : "bg-info"}`} />
                      <span className={`w-36 shrink-0 truncate text-sm ${mailRead[m.id] ? "" : "font-semibold"}`}>{m.from.name}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{m.subject}</span>
                      {m.attachments.length > 0 && <Paperclip size={13} className="shrink-0 text-stone" />}
                      <span className="w-14 shrink-0 text-right text-xs text-mute tabular-nums">{fmtWhen(m.date, DEMO_TODAY)}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="결재 대기" sub={`${myQueue.length}건`} />
            {myQueue.length ? (
              <ul className="divide-y divide-line">
                {myQueue.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar id={a.requester} size={26} />
                    <Link href={`/approvals?id=${a.id}`} className="min-w-0 flex-1 hover:underline">
                      <span className="block truncate text-sm">{a.title}</span>
                      <span className="block text-xs text-mute">
                        {KIND_LABEL[a.kind]}
                        {a.kind === "expense" && ` · ${wonShort(total(a))}`}
                      </span>
                    </Link>
                    <Button size="sm" variant="primary" onClick={() => (approve(a.id, ME), toast(`${a.title} — 승인했습니다`))}>
                      승인
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>결재할 문서가 없습니다</Empty>
            )}
          </Card>

          <Card>
            <CardHeader title="내 할 일" sub="회의록에서" />
            <ul className="divide-y divide-line">
              {myActions.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-4 py-2.5">
                  <button
                    type="button"
                    aria-pressed={!!done[a.id]}
                    aria-label="완료 표시"
                    onClick={() => toggle(a.id)}
                    className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center border ${done[a.id] ? "border-ink bg-ink text-paper" : "border-stone hover:border-ink"}`}
                  >
                    {done[a.id] && <Check size={11} strokeWidth={3} />}
                  </button>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${done[a.id] ? "text-stone line-through" : ""}`}>{a.task}</span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <ProjectChip code={a.project} />
                      <span className="truncate text-xs text-mute">{a.meeting}</span>
                    </span>
                  </span>
                  {!done[a.id] && <Dday date={a.due} today={DEMO_TODAY} />}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="다가오는 일정" />
            <ol className="flex flex-col px-4 py-2">
              {upcoming.map((e) => (
                <li key={e.id} className="grid grid-cols-[4.5rem_1fr] gap-3 border-l border-line py-2 pl-3">
                  <span className="text-xs text-mute tabular-nums">
                    {fmtDay(e.date)}
                    <br />
                    {fmtTime(e.date)}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-sm">
                      {e.kind === "deadline" && <Badge tone="bad">마감</Badge>} {e.kind === "site" && <Badge tone="info">현장</Badge>} {e.title}
                    </span>
                    {e.project && <ProjectChip code={e.project} />}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
