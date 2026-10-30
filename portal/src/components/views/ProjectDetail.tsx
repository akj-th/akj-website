"use client";

import { Box, ChevronRight, File, FileImage, FileText, Folder, FolderOpen, MessagesSquare, Paperclip } from "lucide-react";
import { CHANNELS } from "@/data/messages";
import Link from "next/link";
import { useState } from "react";
import { KIND_LABEL, total } from "@/data/approvals";
import { DEMO_TODAY } from "@/data/demo";
import { MAILS } from "@/data/mail";
import { MINUTES } from "@/data/minutes";
import { person } from "@/data/people";
import { fileTree, typeOf, type FileNode, type Project } from "@/data/projects";
import { EVENTS } from "@/data/schedule";
import { fmtDate, fmtDay, fmtWhen, won, wonShort } from "@/lib/format";
import { Dday, StageBar, StatusBadge } from "@/lib/project-ui";
import { useDemo, useToast } from "@/lib/store";
import { Avatar, Badge, Button, Card, CardHeader, Empty, PageHeader, Progress } from "@/components/ui";

type Tab = "overview" | "files" | "mail" | "minutes" | "docs";

const KIND_ICON = { folder: Folder, pdf: FileText, doc: FileText, xls: FileText, dwg: File, "3dm": Box, img: FileImage } as const;

/** 파일 종류별 데스크톱 프로그램 — 실제 작업은 데스크톱에서, 포털은 찾고 보고 여는 곳 */
const APP: Record<Exclude<FileNode["kind"], "folder">, string> = {
  dwg: "AutoCAD",
  "3dm": "Rhino",
  img: "Photoshop",
  pdf: "Acrobat",
  doc: "Word",
  xls: "Excel",
};

function FileBrowser({ p }: { p: Project }) {
  const tree = fileTree(p);
  const [path, setPath] = useState<string[]>(["02 DESIGN", "02 3D"]);
  const toast = useToast((s) => s.push);

  const nodeAt = (parts: string[]) => {
    let nodes = tree;
    let node: FileNode | undefined;
    for (const part of parts) {
      node = nodes.find((n) => n.name === part);
      nodes = node?.children ?? [];
    }
    return { node, children: parts.length ? nodes : tree };
  };
  const { children } = nodeAt(path);

  return (
    <div className="grid grid-cols-1 border border-line bg-paper md:grid-cols-[240px_1fr]">
      <nav className="border-b border-line p-2 md:border-r md:border-b-0" aria-label="폴더">
        {tree.map((top) => (
          <div key={top.name}>
            <button
              type="button"
              onClick={() => setPath([top.name])}
              className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-surface ${path[0] === top.name && path.length === 1 ? "bg-surface font-medium" : ""}`}
            >
              {path[0] === top.name ? <FolderOpen size={15} /> : <Folder size={15} />} {top.name}
            </button>
            {path[0] === top.name &&
              top.children?.map((sub) => (
                <button
                  key={sub.name}
                  type="button"
                  onClick={() => setPath([top.name, sub.name])}
                  className={`flex w-full items-center gap-2 py-1.5 pr-2 pl-7 text-left text-sm hover:bg-surface ${path[1] === sub.name ? "bg-surface font-medium" : "text-mute"}`}
                >
                  <Folder size={14} /> {sub.name}
                  <span className="ml-auto text-xs text-stone tabular-nums">{sub.children?.length || ""}</span>
                </button>
              ))}
          </div>
        ))}
      </nav>
      <div className="min-w-0">
        <div className="flex items-center gap-1 border-b border-line px-4 py-2.5 text-xs text-mute">
          <button type="button" onClick={() => setPath([])} className="hover:text-ink">
            {p.code}
          </button>
          {path.map((part, i) => (
            <span key={part} className="flex items-center gap-1">
              <ChevronRight size={12} />
              <button type="button" onClick={() => setPath(path.slice(0, i + 1))} className="hover:text-ink">
                {part}
              </button>
            </span>
          ))}
        </div>
        {children.length ? (
          <ul className="divide-y divide-line">
            {children.map((f) => {
              const Icon = KIND_ICON[f.kind];
              const app = f.kind === "folder" ? null : APP[f.kind];
              return (
                <li key={f.name} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <Icon size={16} className={f.kind === "folder" ? "" : "text-mute"} />
                  {f.kind === "folder" ? (
                    <button type="button" className="flex-1 text-left font-medium hover:underline" onClick={() => setPath([...path, f.name])}>
                      {f.name}
                    </button>
                  ) : (
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  )}
                  <span className="w-16 text-right text-xs text-stone tabular-nums">{f.size}</span>
                  {f.kind === "3dm" &&
                    (f.sample ? (
                      <Link href={`/viewer?src=${encodeURIComponent(f.sample)}`} className="border border-ink px-2 py-1 text-xs hover:bg-ink hover:text-paper">
                        뷰어로 열기
                      </Link>
                    ) : (
                      <Button size="sm" onClick={() => toast("NAS 연결 후 열 수 있습니다 (데모 파일 없음)")}>
                        뷰어로 열기
                      </Button>
                    ))}
                  {app && (
                    <Button
                      size="sm"
                      variant="ghost"
                      title="NAS 구축 후 사내 연결 도우미로 데스크톱 프로그램에서 바로 연다"
                      onClick={() => toast(`NAS 구축 후 ${app}에서 바로 엽니다 — 브라우저는 보안상 PC 프로그램을 직접 못 열어 사내 연결 도우미(akj-open)를 둔다`)}
                    >
                      {app}에서 열기
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>빈 폴더</Empty>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetail({ p }: { p: Project }) {
  const [tab, setTab] = useState<Tab>("overview");
  const approvals = useDemo((s) => s.approvals).filter((a) => a.project === p.code);
  const contracts = useDemo((s) => s.contracts).filter((c) => c.project === p.code);
  const done = useDemo((s) => s.actionsDone);
  const mails = MAILS.filter((m) => m.project === p.code);
  const minutes = MINUTES.filter((m) => m.project === p.code);
  const events = EVENTS.filter((e) => e.project === p.code && e.date.slice(0, 10) >= DEMO_TODAY);
  const openActions = minutes.flatMap((m) => m.actions).filter((a) => !done[a.id]);
  const toast = useToast((s) => s.push);

  const TABS: [Tab, string, number?][] = [
    ["overview", "개요"],
    ["files", "파일"],
    ["mail", "메일", mails.length],
    ["minutes", "회의록", minutes.length],
    ["docs", "결재·계약", approvals.length + contracts.length],
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[{ href: "/projects", label: "프로젝트" }]}
        title={
          <span className="flex flex-wrap items-baseline gap-3">
            <span className="tabular-nums">{p.code}</span>
            <span>{p.name}</span>
          </span>
        }
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <Badge>{typeOf(p.code)}</Badge>
            <StatusBadge status={p.status} />
            <span>{p.client}</span>
            <span className="text-stone">·</span>
            <span>{p.address}</span>
          </span>
        }
        actions={
          <>
            {CHANNELS.some((c) => c.project === p.code) && (
              <Link href={`/messages?c=c-${p.code}`} className="inline-flex h-9 items-center gap-1.5 border border-line bg-paper px-3.5 text-sm font-medium hover:border-ink">
                <MessagesSquare size={15} /> 채널
              </Link>
            )}
            <Button onClick={() => toast(`NAS 연결 후 \\\\AKJ-NAS\\Projects\\${p.code} 폴더를 엽니다`)}>
              <FolderOpen size={15} /> 폴더 열기
            </Button>
            {p.models.find((m) => m.sample) && (
              <Link
                href={`/viewer?src=${encodeURIComponent(p.models.find((m) => m.sample)!.sample!)}`}
                className="inline-flex h-9 items-center gap-1.5 bg-ink px-3.5 text-sm font-medium text-paper hover:bg-[#262626]"
              >
                <Box size={15} /> 모델 보기
              </Link>
            )}
          </>
        }
      />

      <div className="flex gap-1 border-b border-line" role="tablist">
        {TABS.map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === id ? "border-ink font-medium" : "border-transparent text-mute hover:text-ink"}`}
          >
            {label}
            {!!n && <span className="ml-1 text-xs text-stone tabular-nums">{n}</span>}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="flex flex-col gap-5 xl:col-span-2">
            <Card>
              <CardHeader title="진행 단계" sub={`${p.stage} ${p.progress}%`} action={p.status !== "완료" && <Dday date={p.due} today={DEMO_TODAY} />} />
              <div className="px-4 py-4">
                <StageBar p={p} labels />
              </div>
            </Card>
            <Card>
              <CardHeader title="남은 할 일" sub={`${openActions.length}건`} />
              {openActions.length ? (
                <ul className="divide-y divide-line">
                  {openActions.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <Avatar id={person(a.owner) ? a.owner : undefined} name={a.owner} size={24} />
                      <span className="flex-1">{a.task}</span>
                      <span className="text-xs text-mute tabular-nums">{fmtDay(a.due)}</span>
                      <Dday date={a.due} today={DEMO_TODAY} />
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>남은 할 일이 없습니다</Empty>
              )}
            </Card>
            <Card>
              <CardHeader title="다가오는 일정" />
              {events.length ? (
                <ul className="divide-y divide-line">
                  {events.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <span className="w-24 text-xs text-mute tabular-nums">{fmtDay(e.date)}</span>
                      {e.kind === "deadline" && <Badge tone="bad">마감</Badge>}
                      <span>{e.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>예정된 일정이 없습니다</Empty>
              )}
            </Card>
          </div>
          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader title="정보" />
              <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-2.5 px-4 py-4 text-sm">
                <dt className="text-mute">건축주</dt>
                <dd>{p.client}</dd>
                <dt className="text-mute">위치</dt>
                <dd>{p.address}</dd>
                {p.area && (
                  <>
                    <dt className="text-mute">연면적</dt>
                    <dd className="tabular-nums">{p.area.toLocaleString()}㎡</dd>
                  </>
                )}
                <dt className="text-mute">기간</dt>
                <dd className="tabular-nums">
                  {fmtDate(p.start)} – {fmtDate(p.due)}
                </dd>
                <dt className="text-mute">PM</dt>
                <dd className="flex items-center gap-2">
                  <Avatar id={p.pm} size={22} /> {person(p.pm)?.name}
                </dd>
                <dt className="text-mute">팀</dt>
                <dd className="flex flex-wrap gap-2">
                  {p.team.map((id) => (
                    <span key={id} className="flex items-center gap-1.5">
                      <Avatar id={id} size={22} /> {person(id)?.name}
                    </span>
                  ))}
                </dd>
                <dt className="text-mute">메모</dt>
                <dd>{p.note}</dd>
              </dl>
            </Card>
            {p.fee > 0 && (
              <Card>
                <CardHeader title="용역비" sub="데모 금액" />
                <div className="flex flex-col gap-2 px-4 py-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-semibold tabular-nums">{wonShort(p.billed)}</span>
                    <span className="text-sm text-mute tabular-nums">/ {wonShort(p.fee)}</span>
                  </div>
                  <Progress value={(p.billed / p.fee) * 100} />
                  <span className="text-xs text-mute">
                    청구 {Math.round((p.billed / p.fee) * 100)}% · 남은 금액 {won(p.fee - p.billed)}
                  </span>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === "files" && (
        <div className="flex flex-col gap-2">
          <FileBrowser p={p} />
          <p className="text-xs text-mute">폴더 구조는 실제 프로젝트 템플릿과 같다. 파일은 데모 — NAS 연결 후 실제 폴더를 보여준다.</p>
        </div>
      )}

      {tab === "mail" && (
        <Card>
          {mails.length ? (
            <ul className="divide-y divide-line">
              {mails.map((m) => (
                <li key={m.id}>
                  <Link href={`/mail?id=${m.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface">
                    <Badge>{m.folder === "inbox" ? "받음" : "보냄"}</Badge>
                    <span className="w-40 truncate">{m.from.name}</span>
                    <span className="min-w-0 flex-1 truncate">{m.subject}</span>
                    {m.attachments.length > 0 && <Paperclip size={13} className="text-stone" />}
                    <span className="text-xs text-mute tabular-nums">{fmtWhen(m.date, DEMO_TODAY)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>이 프로젝트 메일이 없습니다</Empty>
          )}
        </Card>
      )}

      {tab === "minutes" && (
        <Card>
          {minutes.length ? (
            <ul className="divide-y divide-line">
              {minutes.map((m) => (
                <li key={m.id}>
                  <Link href={`/minutes?id=${m.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-surface">
                    <span className="flex items-center gap-3 text-sm">
                      <span className="font-medium">{m.title}</span>
                      <span className="text-xs text-mute">{fmtDay(m.date)}</span>
                    </span>
                    <span className="text-sm text-mute">{m.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>이 프로젝트 회의록이 없습니다</Empty>
          )}
        </Card>
      )}

      {tab === "docs" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="결재" />
            {approvals.length ? (
              <ul className="divide-y divide-line">
                {approvals.map((a) => (
                  <li key={a.id}>
                    <Link href={`/approvals?id=${a.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface">
                      <Badge>{KIND_LABEL[a.kind]}</Badge>
                      <span className="flex-1 truncate">{a.title}</span>
                      {a.kind === "expense" && <span className="tabular-nums">{won(total(a))}</span>}
                      <Badge tone={a.status === "승인" ? "ok" : a.status === "반려" ? "bad" : "warn"}>{a.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>결재 문서가 없습니다</Empty>
            )}
          </Card>
          <Card>
            <CardHeader title="계약" />
            {contracts.length ? (
              <ul className="divide-y divide-line">
                {contracts.map((c) => (
                  <li key={c.id}>
                    <Link href={`/contracts?id=${c.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface">
                      <span className="flex-1 truncate">{c.title}</span>
                      <span className="tabular-nums">{wonShort(c.amount)}</span>
                      <Badge tone={c.status === "완료" ? "ok" : "info"}>{c.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>계약이 없습니다</Empty>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
