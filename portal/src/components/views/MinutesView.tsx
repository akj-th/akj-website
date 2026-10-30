"use client";

import { Check, Download, FolderInput, Mic, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DEMO_TODAY } from "@/data/demo";
import { MINUTES } from "@/data/minutes";
import { person } from "@/data/people";
import { PROJECTS, project } from "@/data/projects";
import { fmtDay, fmtTime } from "@/lib/format";
import { Dday } from "@/lib/project-ui";
import { useDemo, useToast } from "@/lib/store";
import { Field, inputCls, Modal } from "@/components/overlay";
import { Avatar, Badge, Button, Card, PageHeader, ProjectChip } from "@/components/ui";

function NewMinutes({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="새 회의록"
      width={640}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
          <Button variant="primary" disabled title="3단계에서 연결">
            AKJ 회의록으로 정리
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="프로젝트">
            <select className={inputCls} defaultValue="">
              <option value="" disabled>
                고르기
              </option>
              {PROJECTS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="일시">
            <input type="datetime-local" className={inputCls} defaultValue={`${DEMO_TODAY}T14:00`} />
          </Field>
        </div>
        <Field label="회의 제목">
          <input className={inputCls} placeholder="예: 실시설계 3차 건축주 협의" />
        </Field>
        <Field label="녹음 전사본 또는 메모" hint="클로바노트 등에서 내보낸 텍스트를 붙여 넣는다. 음성 파일 업로드는 음성인식 서비스를 정한 뒤 붙인다.">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full border border-line p-3 text-sm outline-none focus:border-ink"
            placeholder="참석자1 00:00 ..."
          />
        </Field>
        <div className="flex items-center gap-2 border border-dashed border-stone px-3 py-2 text-xs text-mute">
          <Mic size={14} /> 음성 파일 올리기 — 준비 중
        </div>
        <p className="text-xs text-mute">정리하기는 다음 단계(회의록 3단계)에서 연결한다. 결과는 참석자별 할 일 중심으로 나오고 프로젝트 폴더 00 ADMIN/03 MEETING에 저장된다.</p>
      </div>
    </Modal>
  );
}

export default function MinutesView() {
  const params = useSearchParams();
  const router = useRouter();
  const done = useDemo((s) => s.actionsDone);
  const toggle = useDemo((s) => s.toggleAction);
  const toast = useToast((s) => s.push);
  const [openId, setOpenId] = useState(MINUTES[0].id);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const id = params.get("id");
    if (id && MINUTES.some((m) => m.id === id)) setOpenId(id);
    if (params.get("new")) setShowNew(true);
  }, [params]);

  const m = MINUTES.find((x) => x.id === openId)!;
  const ownerName = (o: string) => person(o)?.name ?? o;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="회의록"
        sub="참석자별 할 일 중심 · 데모 회의록"
        actions={
          <Button variant="primary" onClick={() => setShowNew(true)}>
            <Plus size={15} /> 새 회의록
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <ul className="divide-y divide-line">
            {MINUTES.map((x) => {
              const n = x.actions.length;
              const d = x.actions.filter((a) => done[a.id]).length;
              return (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(x.id)}
                    className={`flex w-full flex-col gap-1.5 px-4 py-3 text-left ${openId === x.id ? "bg-surface" : "hover:bg-surface"}`}
                  >
                    <span className="flex items-center gap-2">
                      <ProjectChip code={x.project} />
                      <span className="text-xs text-mute">{fmtDay(x.date)}</span>
                    </span>
                    <span className="text-sm font-medium">{x.title}</span>
                    <span className="flex items-center gap-2 text-xs text-mute">
                      할 일 {d}/{n}
                      <span className="block h-1 w-16 bg-line">
                        <span className="block h-full bg-ink" style={{ width: `${(d / n) * 100}%` }} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <article className="flex flex-col gap-6 px-6 py-5">
            <header className="flex flex-col gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-2 text-xs text-mute">
                <ProjectChip code={m.project} /> {project(m.project)?.name}
              </div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-xl font-semibold">{m.title}</h2>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => toast("데모 — Word 내보내기는 3단계")}>
                    <Download size={13} /> Word
                  </Button>
                  <Button size="sm" onClick={() => toast(`${m.project} / 00 ADMIN / 03 MEETING 에 저장 (데모)`)}>
                    <FolderInput size={13} /> 프로젝트 폴더
                  </Button>
                </div>
              </div>
              <dl className="grid grid-cols-[4rem_1fr] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-mute">일시</dt>
                <dd className="tabular-nums">
                  {fmtDay(m.date)} {fmtTime(m.date)}
                </dd>
                <dt className="text-mute">장소</dt>
                <dd>{m.place}</dd>
                <dt className="text-mute">참석</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  {m.internal.map((id) => (
                    <span key={id} className="flex items-center gap-1.5">
                      <Avatar id={id} size={22} /> {person(id)?.name}
                    </span>
                  ))}
                  {m.external.map((n) => (
                    <span key={n} className="flex items-center gap-1.5 text-mute">
                      <Avatar name={n} size={22} /> {n}
                    </span>
                  ))}
                </dd>
                <dt className="text-mute">원본</dt>
                <dd className="text-mute">{m.source}</dd>
              </dl>
            </header>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-mute">요약</h3>
              <p className="text-sm leading-relaxed">{m.summary}</p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-mute">결정 사항</h3>
              <ol className="flex flex-col gap-1.5">
                {m.decisions.map((d, i) => (
                  <li key={d} className="flex gap-3 text-sm">
                    <span className="w-5 shrink-0 text-mute tabular-nums">{i + 1}</span>
                    {d}
                  </li>
                ))}
              </ol>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-mute">할 일</h3>
              <ul className="divide-y divide-line border-y border-line">
                {m.actions.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <button
                      type="button"
                      aria-pressed={!!done[a.id]}
                      aria-label="완료 표시"
                      onClick={() => toggle(a.id)}
                      className={`grid h-4 w-4 shrink-0 place-items-center border ${done[a.id] ? "border-ink bg-ink text-paper" : "border-stone hover:border-ink"}`}
                    >
                      {done[a.id] && <Check size={11} strokeWidth={3} />}
                    </button>
                    <span className="flex w-36 shrink-0 items-center gap-2 text-sm">
                      <Avatar id={person(a.owner) ? a.owner : undefined} name={a.owner} size={22} />
                      <span className="truncate">{ownerName(a.owner)}</span>
                    </span>
                    <span className={`min-w-0 flex-1 text-sm ${done[a.id] ? "text-stone line-through" : ""}`}>{a.task}</span>
                    <span className="text-xs text-mute tabular-nums">{fmtDay(a.due)}</span>
                    <span className="w-12 text-right">{done[a.id] ? <Badge tone="ok">완료</Badge> : <Dday date={a.due} today={DEMO_TODAY} />}</span>
                  </li>
                ))}
              </ul>
            </section>
          </article>
        </Card>
      </div>
      <NewMinutes open={showNew} onClose={() => (setShowNew(false), params.get("new") && router.replace("/minutes"))} />
    </div>
  );
}
