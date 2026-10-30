"use client";

import { Download, LogIn, LogOut } from "lucide-react";
import { DAY_LABEL, holidayName, monthRecords, START_LIMIT, workedMinutes, type DayKind, type DayRecord } from "@/data/attendance";
import { DEMO_TODAY } from "@/data/demo";
import { ME, PEOPLE, PRESENCE_LABEL, person, type PresenceStatus } from "@/data/people";
import { fmtDay, hm } from "@/lib/format";
import { useDemo, useToast } from "@/lib/store";
import { useNowHM } from "@/lib/useNow";
import { Avatar, Badge, Button, Card, CardHeader, Dot, PageHeader, Progress, type Tone } from "@/components/ui";

const KIND_STYLE: Record<DayKind, string> = {
  normal: "bg-paper",
  late: "bg-warn-bg",
  leave: "bg-info-bg",
  half: "bg-info-bg",
  field: "bg-surface",
  holiday: "bg-surface text-stone",
};
const KIND_TONE: Record<DayKind, Tone> = { normal: "neutral", late: "warn", leave: "info", half: "info", field: "neutral", holiday: "neutral" };
const PRESENCE_TONE: Record<PresenceStatus, Tone> = { office: "ok", remote: "info", field: "warn", leave: "neutral" };
const DOW = ["월", "화", "수", "목", "금"];
const nowHM = () => new Date().toTimeString().slice(0, 5);

export default function AttendanceView() {
  const me = person(ME)!;
  const clock = useDemo((s) => s.clock[DEMO_TODAY]);
  const clockIn = useDemo((s) => s.clockIn);
  const clockOut = useDemo((s) => s.clockOut);
  const toast = useToast((s) => s.push);
  const now = useNowHM();

  const past = monthRecords(2026, 10, DEMO_TODAY);
  const today: DayRecord = { date: DEMO_TODAY, kind: clock?.in && clock.in > START_LIMIT ? "late" : "normal", in: clock?.in, out: clock?.out };
  const records = [...past, today];
  const worked = records.filter((r) => r.in);
  const total = worked.reduce((s, r) => s + workedMinutes({ in: r.in, out: r.out ?? (r.date === DEMO_TODAY ? now ?? undefined : undefined) }), 0);
  const late = records.filter((r) => r.kind === "late").length;
  const avgIn = Math.round(
    worked.filter((r) => r.kind !== "field").reduce((s, r) => s + Number(r.in!.slice(0, 2)) * 60 + Number(r.in!.slice(3)), 0) /
      Math.max(1, worked.filter((r) => r.kind !== "field").length),
  );
  const leftLeave = me.leaveTotal - me.leaveUsed;

  // 10월 달력 — 월요일 시작, 주말 칸은 빼고 평일 5칸
  const first = new Date("2026-10-01T00:00:00");
  const lead = (first.getDay() + 6) % 7; // 월=0
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead && i < 5; i++) cells.push(null);
  for (let d = 1; d <= 31; d++) {
    const date = `2026-10-${String(d).padStart(2, "0")}`;
    const dow = new Date(`${date}T00:00:00`).getDay();
    if (dow !== 0 && dow !== 6) cells.push(date);
  }
  const rec = (date: string) => records.find((r) => r.date === date);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="근태"
        sub={`${me.name} ${me.title} · 2026년 10월 · 데모 기록`}
        actions={
          <Button onClick={() => toast("데모 — 월별 내보내기는 서버 저장 후")}>
            <Download size={15} /> 월별 내보내기
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-col justify-between gap-3 p-4 xl:col-span-1">
          <div>
            <div className="text-xs text-mute">오늘 · {fmtDay(DEMO_TODAY)}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {clock?.in ?? "--:--"} <span className="text-stone">→</span> {clock?.out ?? "--:--"}
            </div>
            <div className="text-xs text-mute">출근 기준 {START_LIMIT} 이전 (유연근무)</div>
          </div>
          {!clock?.in ? (
            <Button variant="primary" onClick={() => (clockIn(nowHM()), toast("출근 기록했습니다"))}>
              <LogIn size={15} /> 출근
            </Button>
          ) : !clock.out ? (
            <Button variant="primary" onClick={() => (clockOut(nowHM()), toast("퇴근 기록했습니다"))}>
              <LogOut size={15} /> 퇴근
            </Button>
          ) : (
            <Badge tone="ok">오늘 근무 종료</Badge>
          )}
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs text-mute">이번 달 근무</span>
          <span className="text-2xl font-semibold tabular-nums">{hm(total)}</span>
          <span className="text-xs text-mute">
            근무일 {worked.length}일 · 평균 출근 {String(Math.floor(avgIn / 60)).padStart(2, "0")}:{String(avgIn % 60).padStart(2, "0")}
          </span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs text-mute">지각</span>
          <span className="text-2xl font-semibold tabular-nums">{late}회</span>
          <span className="text-xs text-mute">기준 {START_LIMIT} 이후 출근</span>
        </Card>
        <Card className="flex flex-col gap-2 p-4">
          <span className="text-xs text-mute">연차</span>
          <span className="text-2xl font-semibold tabular-nums">
            {leftLeave}일 <span className="text-sm font-normal text-mute">남음</span>
          </span>
          <Progress value={(me.leaveUsed / me.leaveTotal) * 100} />
          <span className="text-xs text-mute">
            {me.leaveTotal}일 중 {me.leaveUsed}일 사용
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader
            title="10월"
            action={
              <span className="flex flex-wrap gap-1.5">
                {(["normal", "late", "leave", "field", "holiday"] as DayKind[]).map((k) => (
                  <Badge key={k} tone={KIND_TONE[k]}>
                    {DAY_LABEL[k]}
                  </Badge>
                ))}
              </span>
            }
          />
          <div className="grid grid-cols-5 gap-px bg-line p-px">
            {DOW.map((d) => (
              <div key={d} className="bg-paper px-2 py-1.5 text-center text-xs text-mute">
                {d}
              </div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`e${i}`} className="bg-surface" />;
              const r = rec(date);
              const future = date > DEMO_TODAY;
              const isToday = date === DEMO_TODAY;
              return (
                <div key={date} className={`flex min-h-[78px] flex-col gap-1 px-2 py-1.5 ${future ? "bg-paper text-stone" : r ? KIND_STYLE[r.kind] : "bg-paper"} ${isToday ? "outline-2 -outline-offset-2 outline-ink" : ""}`}>
                  <span className="flex items-center justify-between text-xs">
                    <span className={`tabular-nums ${isToday ? "font-semibold" : ""}`}>{Number(date.slice(8))}</span>
                    {r && r.kind !== "normal" && !future && <span className="text-[10px] text-mute">{holidayName(date) ?? DAY_LABEL[r.kind]}</span>}
                  </span>
                  {r?.in && !future && (
                    <span className="text-[11px] leading-tight tabular-nums">
                      {r.in}
                      <br />
                      <span className="text-mute">{r.out ?? (isToday ? "근무 중" : "")}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="오늘 팀" sub={`${PEOPLE.filter((p) => p.status === "office").length}명 사무실`} />
          <ul className="divide-y divide-line">
            {PEOPLE.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar id={p.id} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{p.name}</span>
                  <span className="block text-xs text-mute">{p.title}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <Dot tone={PRESENCE_TONE[p.status]} /> {PRESENCE_LABEL[p.status]}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
