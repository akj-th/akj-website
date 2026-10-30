"use client";

import { Check, Paperclip, Plane, Plus, Receipt, Trash2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { currentApprover, KIND_LABEL, total, type Approval, type ApprovalKind, type LineStatus } from "@/data/approvals";
import { DEMO_TODAY } from "@/data/demo";
import { ME, person } from "@/data/people";
import { PROJECTS } from "@/data/projects";
import { fmtDay, fmtTime, won } from "@/lib/format";
import { useDemo, useToast } from "@/lib/store";
import { Drawer, Field, inputCls, Modal } from "@/components/overlay";
import { Avatar, Badge, Button, Card, Empty, PageHeader, ProjectChip, type Tone } from "@/components/ui";

type Tab = "todo" | "mine" | "all";

const STATUS_TONE: Record<Approval["status"], Tone> = { 진행: "warn", 승인: "ok", 반려: "bad" };
const LINE_RING: Record<LineStatus, string> = {
  done: "ring-ok",
  pending: "ring-warn",
  waiting: "ring-line",
  rejected: "ring-bad",
};
const LINE_LABEL: Record<LineStatus, string> = { done: "완료", pending: "결재 중", waiting: "대기", rejected: "반려" };

function LineMini({ a }: { a: Approval }) {
  return (
    <span className="flex items-center gap-1">
      {a.line.map((l, i) => (
        <span key={i} className={`rounded-full ring-2 ${LINE_RING[l.status]}`} title={`${person(l.person)?.name} ${l.role} · ${LINE_LABEL[l.status]}`}>
          <Avatar id={l.person} size={20} />
        </span>
      ))}
    </span>
  );
}

function Amount({ a }: { a: Approval }) {
  if (a.kind === "expense") return <span className="tabular-nums">{won(total(a))}</span>;
  return (
    <span className="tabular-nums">
      {a.leave?.type} {a.leave?.days}일
    </span>
  );
}

function NewApproval({ kind, onClose }: { kind: ApprovalKind | null; onClose: () => void }) {
  const add = useDemo((s) => s.addApproval);
  const toast = useToast((s) => s.push);
  const me = person(ME)!;
  const [title, setTitle] = useState("");
  const [proj, setProj] = useState("");
  const [items, setItems] = useState([{ desc: "", amount: 0 }]);
  const [receipt, setReceipt] = useState("");
  const [leaveType, setLeaveType] = useState<"연차" | "반차" | "병가">("연차");
  const [from, setFrom] = useState("2026-11-09");
  const [to, setTo] = useState("2026-11-09");
  const [note, setNote] = useState("");

  const days = leaveType === "반차" ? 0.5 : Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1);
  const sum = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const left = me.leaveTotal - me.leaveUsed;
  const valid = kind === "expense" ? title.trim() && sum > 0 : from <= to && days <= left;

  const submit = () => {
    const now = `${DEMO_TODAY}T${new Date().toTimeString().slice(0, 5)}`;
    const base = {
      id: `new-${Date.now()}`,
      requester: ME,
      created: now,
      note: note || undefined,
      // 실장은 대표에게 바로 올린다 (데모 결재선)
      line: [
        { person: ME, role: "기안" as const, status: "done" as const, at: now },
        { person: "p2", role: "승인" as const, status: "pending" as const },
      ],
      status: "진행" as const,
    };
    if (kind === "expense") {
      add({ ...base, kind: "expense", title, project: proj || undefined, items: items.filter((i) => i.desc && i.amount), receipt: receipt || undefined });
    } else {
      add({ ...base, kind: "leave", title: `${leaveType} ${days}일 (${fmtDay(from)}${from !== to ? `~${fmtDay(to)}` : ""})`, leave: { type: leaveType, from, to, days } });
    }
    toast("결재를 올렸습니다 — 윤서아 대표에게 전달");
    onClose();
  };

  return (
    <Modal
      open={!!kind}
      onClose={onClose}
      title={kind === "expense" ? "지출결의 작성" : "휴가 신청"}
      width={600}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" disabled={!valid} onClick={submit}>
            결재 올리기
          </Button>
        </>
      }
    >
      {kind === "expense" ? (
        <div className="flex flex-col gap-4">
          <Field label="제목">
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 현장 출장 교통비" />
          </Field>
          <Field label="프로젝트" hint="프로젝트 비용으로 잡힌다. 일반 경비면 비워 둔다.">
            <select className={inputCls} value={proj} onChange={(e) => setProj(e.target.value)}>
              <option value="">일반 경비</option>
              {PROJECTS.filter((p) => p.status !== "완료").map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} {p.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-mute">내역</span>
            {items.map((it, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={inputCls}
                  value={it.desc}
                  placeholder="내역"
                  onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))}
                />
                <input
                  className={`${inputCls} w-36 text-right tabular-nums`}
                  inputMode="numeric"
                  value={it.amount ? it.amount.toLocaleString() : ""}
                  placeholder="금액"
                  onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value.replace(/\D/g, "")) } : x)))}
                />
                <button type="button" aria-label="내역 삭제" disabled={items.length === 1} onClick={() => setItems(items.filter((_, j) => j !== i))} className="px-2 text-mute hover:text-bad disabled:opacity-30">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Button size="sm" variant="ghost" onClick={() => setItems([...items, { desc: "", amount: 0 }])}>
                <Plus size={13} /> 내역 추가
              </Button>
              <span className="text-sm font-semibold tabular-nums">합계 {won(sum)}</span>
            </div>
          </div>
          <Field label="영수증" hint="파일 이름만 기록한다. NAS 구축 후 원본을 보관한다.">
            <input type="file" accept="image/*,.pdf" className="text-sm" onChange={(e) => setReceipt(e.target.files?.[0]?.name ?? "")} />
          </Field>
          <Field label="메모">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border border-line bg-surface px-4 py-3 text-sm">
            <span>남은 연차</span>
            <span className="font-semibold tabular-nums">
              {left}일 <span className="font-normal text-mute">/ {me.leaveTotal}일</span>
            </span>
          </div>
          <Field label="종류">
            <div className="flex border border-line" role="group">
              {(["연차", "반차", "병가"] as const).map((t) => (
                <button key={t} type="button" aria-pressed={leaveType === t} onClick={() => setLeaveType(t)} className={`h-9 flex-1 text-sm ${leaveType === t ? "bg-ink text-paper" : "hover:bg-surface"}`}>
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="시작">
              <input type="date" className={inputCls} value={from} onChange={(e) => (setFrom(e.target.value), leaveType === "반차" && setTo(e.target.value))} />
            </Field>
            <Field label="끝">
              <input type="date" className={inputCls} value={leaveType === "반차" ? from : to} disabled={leaveType === "반차"} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          <p className={`text-sm ${days > left ? "text-bad" : "text-mute"}`}>
            {days}일 사용 {days > left && "— 남은 연차보다 많습니다"}
          </p>
          <Field label="사유">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="개인 일정" />
          </Field>
        </div>
      )}
    </Modal>
  );
}

export default function ApprovalsView() {
  const params = useSearchParams();
  const router = useRouter();
  const approvals = useDemo((s) => s.approvals);
  const approve = useDemo((s) => s.approve);
  const reject = useDemo((s) => s.reject);
  const toast = useToast((s) => s.push);
  const [tab, setTab] = useState<Tab>("todo");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<ApprovalKind | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const id = params.get("id");
    if (id) setOpenId(id);
    const n = params.get("new");
    if (n === "expense" || n === "leave") setNewKind(n);
  }, [params]);

  const todo = approvals.filter((a) => a.status === "진행" && currentApprover(a) === ME);
  const mine = approvals.filter((a) => a.requester === ME);
  const list = tab === "todo" ? todo : tab === "mine" ? mine : approvals;
  const open = approvals.find((a) => a.id === openId);
  const myTurn = open && open.status === "진행" && currentApprover(open) === ME;

  const close = () => {
    setOpenId(null);
    setRejecting(false);
    setComment("");
    if (params.get("id")) router.replace("/approvals");
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="결재"
        sub="지출결의 · 휴가 — 데모 문서, 처리 결과는 이 브라우저에만 저장"
        actions={
          <>
            <Button onClick={() => setNewKind("leave")}>
              <Plane size={15} /> 휴가 신청
            </Button>
            <Button variant="primary" onClick={() => setNewKind("expense")}>
              <Receipt size={15} /> 지출결의
            </Button>
          </>
        }
      />

      <div className="flex gap-1 border-b border-line" role="tablist">
        {(
          [
            ["todo", "결재할 문서", todo.length],
            ["mine", "내가 올린 문서", mine.length],
            ["all", "전체", approvals.length],
          ] as [Tab, string, number][]
        ).map(([id, label, n]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === id ? "border-ink font-medium" : "border-transparent text-mute hover:text-ink"}`}>
            {label} <span className="text-xs text-stone tabular-nums">{n}</span>
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        {list.length ? (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-mute">
                <th className="px-4 py-2.5 font-medium">종류</th>
                <th className="px-4 py-2.5 font-medium">제목</th>
                <th className="px-4 py-2.5 font-medium">기안</th>
                <th className="px-4 py-2.5 text-right font-medium">금액·기간</th>
                <th className="px-4 py-2.5 font-medium">결재선</th>
                <th className="px-4 py-2.5 font-medium">기안일</th>
                <th className="px-4 py-2.5 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((a) => (
                <tr key={a.id} onClick={() => setOpenId(a.id)} className="cursor-pointer hover:bg-surface">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-mute">
                      {a.kind === "expense" ? <Receipt size={14} /> : <Plane size={14} />} {KIND_LABEL[a.kind]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      {a.project && <ProjectChip code={a.project} />}
                      <span className="font-medium">{a.title}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Avatar id={a.requester} size={22} /> {person(a.requester)?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Amount a={a} />
                  </td>
                  <td className="px-4 py-3">
                    <LineMini a={a} />
                  </td>
                  <td className="px-4 py-3 text-xs text-mute tabular-nums">{fmtDay(a.created)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[a.status]}>{a.status === "진행" && currentApprover(a) === ME ? "내 차례" : a.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>{tab === "todo" ? "결재할 문서가 없습니다" : "문서가 없습니다"}</Empty>
        )}
      </Card>

      <Drawer
        open={!!open}
        onClose={close}
        title={
          open && (
            <span className="flex items-center gap-2">
              <Badge>{KIND_LABEL[open.kind]}</Badge> {open.title}
            </span>
          )
        }
        footer={
          myTurn &&
          (rejecting ? (
            <div className="flex w-full flex-col gap-2">
              <input className={inputCls} autoFocus value={comment} onChange={(e) => setComment(e.target.value)} placeholder="반려 사유 (기안자에게 전달)" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setRejecting(false)}>
                  취소
                </Button>
                <Button variant="danger" disabled={!comment.trim()} onClick={() => (reject(open!.id, ME, comment), toast("반려했습니다"), close())}>
                  반려 확정
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button variant="danger" onClick={() => setRejecting(true)}>
                <X size={14} /> 반려
              </Button>
              <Button variant="primary" onClick={() => (approve(open!.id, ME), toast("승인했습니다"), close())}>
                <Check size={14} /> 승인
              </Button>
            </>
          ))
        }
      >
        {open && (
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="mb-3 text-xs font-medium text-mute">결재선</h3>
              <ol className="flex flex-col">
                {open.line.map((l, i) => (
                  <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < open.line.length - 1 && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" />}
                    <span className={`h-fit rounded-full ring-2 ${LINE_RING[l.status]}`}>
                      <Avatar id={l.person} size={30} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col text-sm">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{person(l.person)?.name}</span>
                        <span className="text-xs text-mute">{l.role}</span>
                        <Badge tone={l.status === "done" ? "ok" : l.status === "pending" ? "warn" : l.status === "rejected" ? "bad" : "neutral"}>{LINE_LABEL[l.status]}</Badge>
                      </span>
                      {l.at && (
                        <span className="text-xs text-mute tabular-nums">
                          {fmtDay(l.at)} {fmtTime(l.at)}
                        </span>
                      )}
                      {l.comment && <span className="mt-1 border-l-2 border-line pl-2 text-sm text-mute">{l.comment}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {open.kind === "expense" ? (
              <section>
                <h3 className="mb-2 text-xs font-medium text-mute">지출 내역</h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-line border-y border-line">
                    {open.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2">{it.desc}</td>
                        <td className="py-2 text-right tabular-nums">{won(it.amount)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="py-2">합계</td>
                      <td className="py-2 text-right tabular-nums">{won(total(open))}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            ) : (
              <section>
                <h3 className="mb-2 text-xs font-medium text-mute">휴가</h3>
                <dl className="grid grid-cols-[4rem_1fr] gap-y-1.5 text-sm">
                  <dt className="text-mute">종류</dt>
                  <dd>{open.leave?.type}</dd>
                  <dt className="text-mute">기간</dt>
                  <dd className="tabular-nums">
                    {open.leave && fmtDay(open.leave.from)}
                    {open.leave && open.leave.from !== open.leave.to && ` ~ ${fmtDay(open.leave.to)}`} ({open.leave?.days}일)
                  </dd>
                  <dt className="text-mute">남은 연차</dt>
                  <dd>
                    {(person(open.requester)?.leaveTotal ?? 0) - (person(open.requester)?.leaveUsed ?? 0)}일
                  </dd>
                </dl>
              </section>
            )}

            <section className="flex flex-col gap-2 text-sm">
              {open.project && (
                <span className="flex items-center gap-2">
                  <span className="w-16 text-xs text-mute">프로젝트</span>
                  <ProjectChip code={open.project} />
                </span>
              )}
              {open.receipt && (
                <span className="flex items-center gap-2">
                  <span className="w-16 text-xs text-mute">영수증</span>
                  <span className="flex items-center gap-1.5 border border-line px-2 py-1 text-xs">
                    <Paperclip size={12} /> {open.receipt}
                  </span>
                </span>
              )}
              {open.note && (
                <span className="flex items-center gap-2">
                  <span className="w-16 text-xs text-mute">메모</span>
                  {open.note}
                </span>
              )}
            </section>
          </div>
        )}
      </Drawer>

      <NewApproval key={newKind ?? "none"} kind={newKind} onClose={() => (setNewKind(null), params.get("new") && router.replace("/approvals"))} />
    </div>
  );
}
