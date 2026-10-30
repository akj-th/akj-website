"use client";

import { LayoutGrid, List, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DEMO_TODAY } from "@/data/demo";
import { person } from "@/data/people";
import { PROJECTS, TYPE_LABEL, typeOf, type ProjectStatus } from "@/data/projects";
import { fmtDate, wonShort } from "@/lib/format";
import { Dday, StageBar, StatusBadge } from "@/lib/project-ui";
import { inputCls } from "@/components/overlay";
import { Avatar, AvatarStack, Badge, Card, Empty, PageHeader } from "@/components/ui";

const STATUSES: ("전체" | ProjectStatus)[] = ["전체", "진행", "대기", "보류", "완료"];

export default function Projects() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("전체");
  const [type, setType] = useState("all");
  const [mode, setMode] = useState<"table" | "cards">("table");
  const router = useRouter();

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PROJECTS.filter(
      (p) =>
        (status === "전체" || p.status === status) &&
        (type === "all" || p.code[0] === type) &&
        (!s || [p.code, p.name, p.client, person(p.pm)?.name].some((x) => x?.toLowerCase().includes(s))),
    );
  }, [q, status, type]);

  const count = (st: (typeof STATUSES)[number]) => (st === "전체" ? PROJECTS.length : PROJECTS.filter((p) => p.status === st).length);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="프로젝트" sub="코드 체계: [유형][연도][순번] · 데모 프로젝트" />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-stone" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="코드·이름·건축주·PM" className={`${inputCls} pl-8`} />
        </div>
        <div className="flex border border-line bg-paper" role="group" aria-label="상태">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={`h-9 px-3 text-sm ${status === s ? "bg-ink text-paper" : "hover:bg-surface"}`}
            >
              {s} <span className="text-xs opacity-60 tabular-nums">{count(s)}</span>
            </button>
          ))}
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} w-36`} aria-label="유형">
          <option value="all">유형 전체</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {k} {v}
            </option>
          ))}
        </select>
        <div className="ml-auto flex border border-line bg-paper" role="group" aria-label="보기">
          <button type="button" aria-label="표" aria-pressed={mode === "table"} onClick={() => setMode("table")} className={`grid h-9 w-9 place-items-center ${mode === "table" ? "bg-ink text-paper" : ""}`}>
            <List size={16} />
          </button>
          <button type="button" aria-label="카드" aria-pressed={mode === "cards"} onClick={() => setMode("cards")} className={`grid h-9 w-9 place-items-center ${mode === "cards" ? "bg-ink text-paper" : ""}`}>
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {!list.length ? (
        <Card>
          <Empty>조건에 맞는 프로젝트가 없습니다</Empty>
        </Card>
      ) : mode === "table" ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-mute">
                <th className="px-4 py-2.5 font-medium">코드</th>
                <th className="px-4 py-2.5 font-medium">프로젝트</th>
                <th className="px-4 py-2.5 font-medium">유형</th>
                <th className="w-52 px-4 py-2.5 font-medium">단계</th>
                <th className="px-4 py-2.5 font-medium">PM·팀</th>
                <th className="px-4 py-2.5 font-medium">마감</th>
                <th className="px-4 py-2.5 text-right font-medium">용역비</th>
                <th className="px-4 py-2.5 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((p) => (
                <tr key={p.code} className="cursor-pointer hover:bg-surface" onClick={() => router.push(`/projects/${p.code}`)}>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    <Link href={`/projects/${p.code}`} onClick={(e) => e.stopPropagation()}>
                      {p.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-mute">{p.client}</div>
                  </td>
                  <td className="px-4 py-3 text-mute">{typeOf(p.code)}</td>
                  <td className="px-4 py-3">
                    <div className="mb-1 text-xs">
                      {p.stage} <span className="text-mute tabular-nums">{p.progress}%</span>
                    </div>
                    <StageBar p={p} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Avatar id={p.pm} size={24} />
                      {p.team.length > 0 && <AvatarStack ids={p.team} size={20} />}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    <div className="text-xs">{fmtDate(p.due)}</div>
                    {p.status !== "완료" && <Dday date={p.due} today={DEMO_TODAY} />}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.fee ? wonShort(p.fee) : <span className="text-stone">—</span>}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <Link key={p.code} href={`/projects/${p.code}`} className="flex flex-col gap-3 border border-line bg-paper p-4 hover:border-ink">
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">{p.code}</span>
                <span className="flex gap-1">
                  <Badge>{typeOf(p.code)}</Badge>
                  <StatusBadge status={p.status} />
                </span>
              </div>
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-mute">{p.client}</div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span>
                    {p.stage} <span className="text-mute">{p.progress}%</span>
                  </span>
                  {p.status !== "완료" && <Dday date={p.due} today={DEMO_TODAY} />}
                </div>
                <StageBar p={p} />
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Avatar id={p.pm} size={24} />
                  <AvatarStack ids={p.team} size={20} />
                </span>
                <span className="max-w-[65%] truncate text-xs text-mute" title={p.note}>
                  {p.note}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
