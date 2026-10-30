"use client";

import { Check, Clock, FileText, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CONTRACT_STAGES, type ContractStatus } from "@/data/contracts";
import { project } from "@/data/projects";
import { fmtDate, won, wonShort } from "@/lib/format";
import { useDemo, useToast } from "@/lib/store";
import { Drawer } from "@/components/overlay";
import { Badge, Button, Card, Empty, PageHeader, ProjectChip, type Tone } from "@/components/ui";

const TONE: Record<ContractStatus, Tone> = { 작성: "neutral", 검토: "warn", "서명 중": "info", 완료: "ok" };
const NEXT: Partial<Record<ContractStatus, { to: ContractStatus; label: string; done: string }>> = {
  작성: { to: "검토", label: "검토 요청", done: "검토 요청했습니다" },
  검토: { to: "서명 중", label: "전자서명 요청", done: "전자서명을 요청했습니다 (데모)" },
  "서명 중": { to: "완료", label: "서명 완료 처리 (데모)", done: "서명 완료로 바꿨습니다" },
};

export default function ContractsView() {
  const params = useSearchParams();
  const router = useRouter();
  const contracts = useDemo((s) => s.contracts);
  const setStatus = useDemo((s) => s.setContractStatus);
  const toast = useToast((s) => s.push);
  const [filter, setFilter] = useState<ContractStatus | "전체">("전체");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const id = params.get("id");
    if (id) setOpenId(id);
  }, [params]);

  const list = contracts.filter((c) => filter === "전체" || c.status === filter).sort((a, b) => b.created.localeCompare(a.created));
  const open = contracts.find((c) => c.id === openId);
  const next = open && NEXT[open.status];
  const close = () => {
    setOpenId(null);
    if (params.get("id")) router.replace("/contracts");
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="계약서" sub="서명은 전자서명 서비스에서, 목록·상태·원본은 여기서 · 데모 계약" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {CONTRACT_STAGES.map((s, i) => {
          const items = contracts.filter((c) => c.status === s);
          const on = filter === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(on ? "전체" : s)}
              className={`flex flex-col gap-1 border px-4 py-3 text-left ${on ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink"}`}
            >
              <span className={`flex items-center gap-1.5 text-xs ${on ? "text-paper/70" : "text-mute"}`}>
                <span className="tabular-nums">{i + 1}</span> {s}
              </span>
              <span className="text-2xl font-semibold tabular-nums">{items.length}</span>
              <span className={`text-xs tabular-nums ${on ? "text-paper/70" : "text-mute"}`}>{wonShort(items.reduce((t, c) => t + c.amount, 0))}</span>
            </button>
          );
        })}
      </div>

      <Card className="overflow-x-auto">
        {list.length ? (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-mute">
                <th className="px-4 py-2.5 font-medium">프로젝트</th>
                <th className="px-4 py-2.5 font-medium">계약</th>
                <th className="px-4 py-2.5 font-medium">상대방</th>
                <th className="px-4 py-2.5 text-right font-medium">금액</th>
                <th className="px-4 py-2.5 font-medium">서명</th>
                <th className="px-4 py-2.5 font-medium">작성일</th>
                <th className="px-4 py-2.5 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((c) => (
                <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer hover:bg-surface">
                  <td className="px-4 py-3">
                    <ProjectChip code={c.project} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-mute">{c.kind}</div>
                  </td>
                  <td className="px-4 py-3">{c.counterparty}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{won(c.amount)}</td>
                  <td className="px-4 py-3 text-xs tabular-nums">
                    {c.signers.filter((s) => s.signed).length}/{c.signers.length}
                  </td>
                  <td className="px-4 py-3 text-xs text-mute tabular-nums">{fmtDate(c.created)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={TONE[c.status]}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>계약이 없습니다</Empty>
        )}
      </Card>

      <Drawer
        open={!!open}
        onClose={close}
        title={open?.title}
        footer={
          next && (
            <Button variant="primary" onClick={() => (setStatus(open!.id, next.to), toast(next.done))}>
              {next.to === "서명 중" ? <Send size={14} /> : <Check size={14} />} {next.label}
            </Button>
          )
        }
      >
        {open && (
          <div className="flex flex-col gap-6">
            <ol className="flex">
              {CONTRACT_STAGES.map((s, i) => {
                const cur = CONTRACT_STAGES.indexOf(open.status);
                return (
                  <li key={s} className="flex flex-1 flex-col gap-1.5">
                    <span className={`h-1.5 ${i <= cur ? "bg-ink" : "bg-line"}`} />
                    <span className={`text-xs ${i === cur ? "font-semibold" : i < cur ? "text-mute" : "text-stone"}`}>{s}</span>
                  </li>
                );
              })}
            </ol>

            <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-mute">프로젝트</dt>
              <dd className="flex items-center gap-2">
                <ProjectChip code={open.project} /> {project(open.project)?.name}
              </dd>
              <dt className="text-mute">종류</dt>
              <dd>{open.kind}</dd>
              <dt className="text-mute">상대방</dt>
              <dd>{open.counterparty}</dd>
              <dt className="text-mute">금액</dt>
              <dd className="tabular-nums">{won(open.amount)} (데모)</dd>
              <dt className="text-mute">작성일</dt>
              <dd className="tabular-nums">{fmtDate(open.created)}</dd>
              {open.signedAt && (
                <>
                  <dt className="text-mute">서명 완료</dt>
                  <dd className="tabular-nums">{fmtDate(open.signedAt)}</dd>
                </>
              )}
            </dl>

            <section>
              <h3 className="mb-2 text-xs font-medium text-mute">서명</h3>
              <ul className="divide-y divide-line border-y border-line">
                {open.signers.map((s) => (
                  <li key={s.name + s.org} className="flex items-center gap-3 py-2.5 text-sm">
                    {s.signed ? <Check size={15} className="text-ok" /> : <Clock size={15} className="text-stone" />}
                    <span className="flex-1">
                      {s.name} <span className="text-mute">· {s.org}</span>
                    </span>
                    <Badge tone={s.signed ? "ok" : "neutral"}>{s.signed ? "서명함" : "대기"}</Badge>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-medium text-mute">원본</h3>
              <div className="flex aspect-[1/1.2] flex-col items-center justify-center gap-2 border border-line bg-surface text-sm text-mute">
                <FileText size={28} />
                {open.file}
                <span className="text-xs text-stone">미리보기는 원본 PDF를 NAS에 보관한 뒤</span>
              </div>
            </section>
          </div>
        )}
      </Drawer>
    </div>
  );
}
