"use client";

import { Check, Download, FileText, FolderInput, Loader2, Mic, Plus, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEMO_TODAY } from "@/data/demo";
import { MINUTES, type Minutes } from "@/data/minutes";
import { SAMPLE_DRAFT, SAMPLE_REQUEST } from "@/data/minutes-sample";
import { PEOPLE, person } from "@/data/people";
import { PROJECTS, project } from "@/data/projects";
import { fmtDay, fmtTime, isDate } from "@/lib/format";
import { STATIC_DEMO, withBase } from "@/lib/base";
import { minutesMarkdown } from "@/lib/minutes/markdown";
import type { MinutesRequest } from "@/lib/minutes/prompt";
import { undecidedCount, UNDECIDED, type MinutesDraft } from "@/lib/minutes/schema";
import { Dday } from "@/lib/project-ui";
import { useDemo, useToast } from "@/lib/store";
import { Drawer, Field, inputCls } from "@/components/overlay";
import { Avatar, Badge, Button, Card, PageHeader, ProjectChip } from "@/components/ui";

const ownerName = (o: string) => person(o)?.name ?? o;

/** "한지호 실장" 같은 이름을 직원 id 로 — 못 찾으면 이름 그대로 */
function ownerId(name: string) {
  const p = PEOPLE.find((x) => name === x.name || name.startsWith(`${x.name} `));
  return p?.id ?? name;
}

/** "11-16" → "2026-11-16" (회의 연도 기준), 날짜가 아니면 그대로 */
function normDue(due: string, year: string) {
  if (isDate(due)) return due.slice(0, 10);
  const m = /^(\d{1,2})[-./](\d{1,2})/.exec(due);
  return m ? `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : due;
}

function fromDraft(d: MinutesDraft, r: MinutesRequest, code: string): Minutes {
  const id = `g${Date.now()}`;
  const date = /^\d{4}-\d{2}-\d{2}/.exec(r.date)?.[0] ?? DEMO_TODAY;
  const time = /(\d{1,2}):(\d{2})/.exec(r.date);
  const names = r.attendees
    .split(/[,/·\n]/)
    .map((s) => s.replace(/^[^:]*:/, "").trim())
    .filter(Boolean);
  const internal = PEOPLE.filter((p) => names.some((n) => n === p.name || n.startsWith(`${p.name} `))).map((p) => p.id);
  const external = names.filter((n) => !PEOPLE.some((p) => n === p.name || n.startsWith(`${p.name} `)));
  return {
    id,
    project: code,
    title: d.title || r.title || "회의",
    date: `${date}T${time ? `${time[1].padStart(2, "0")}:${time[2]}` : "00:00"}`,
    place: r.place || "—",
    internal,
    external,
    summary: d.summary,
    decisions: d.items.map((i) => i.decision).filter(Boolean),
    actions: d.actions.map((a, i) => ({ id: `${id}-a${i}`, owner: ownerId(a.owner), task: a.task, due: normDue(a.due, date.slice(0, 4)), done: false, output: a.output })),
    source: "포털 AI 정리 (전사본)",
    distribute: r.distribute,
    items: d.items,
    openItems: d.openItems,
    next: d.next,
    checks: d.checks,
    internalNotes: d.internalNotes,
  };
}

function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** 회의록 본문 — 목록 상세와 AI 결과 미리보기가 같이 쓴다 */
function MinutesDoc({ m, preview = false }: { m: Minutes; preview?: boolean }) {
  const done = useDemo((s) => s.actionsDone);
  const toggle = useDemo((s) => s.toggleAction);
  const owners = [...new Set(m.actions.map((a) => a.owner))];
  const undecided = m.actions.filter((a) => a.owner === UNDECIDED.owner || !isDate(a.due)).length;

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-[4rem_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-mute">일시</dt>
        <dd className="tabular-nums">
          {fmtDay(m.date)} {fmtTime(m.date) !== "00:00" && fmtTime(m.date)}
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
        <dd className="flex items-center gap-2 text-mute">
          {m.source} {m.distribute !== undefined && <Badge tone={m.distribute ? "info" : "neutral"}>{m.distribute ? "배포용" : "내부용"}</Badge>}
        </dd>
      </dl>

      <p className="border-l-2 border-ink pl-3 text-sm leading-relaxed">{m.summary}</p>

      <section className="flex flex-col gap-2">
        <h3 className="flex items-center gap-2 text-xs font-medium text-mute">
          담당별 할 일 <span className="tabular-nums">{m.actions.length}건</span>
          {undecided > 0 && <Badge tone="warn">담당·기한 미정 {undecided}</Badge>}
        </h3>
        <div className="flex flex-col divide-y divide-line border-y border-line">
          {owners.map((o) => (
            <div key={o} className="flex gap-4 py-2.5">
              <span className="flex w-32 shrink-0 items-start gap-2 pt-0.5 text-sm font-medium">
                <Avatar id={person(o) ? o : undefined} name={o} size={22} />
                <span className="truncate">{ownerName(o)}</span>
              </span>
              <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
                {m.actions
                  .filter((a) => a.owner === o)
                  .map((a) => (
                    <li key={a.id} className="flex items-start gap-3">
                      {!preview && (
                        <button
                          type="button"
                          aria-pressed={!!done[a.id]}
                          aria-label="완료 표시"
                          onClick={() => toggle(a.id)}
                          className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center border ${done[a.id] ? "border-ink bg-ink text-paper" : "border-stone hover:border-ink"}`}
                        >
                          {done[a.id] && <Check size={11} strokeWidth={3} />}
                        </button>
                      )}
                      <span className="min-w-0 flex-1 text-sm">
                        <span className={done[a.id] && !preview ? "text-stone line-through" : ""}>{a.task}</span>
                        {a.output && <span className="ml-2 text-xs text-mute">→ {a.output}</span>}
                      </span>
                      <span className="shrink-0 text-xs text-mute tabular-nums">{isDate(a.due) ? fmtDay(a.due) : ""}</span>
                      <span className="w-14 shrink-0 text-right">{done[a.id] && !preview ? <Badge tone="ok">완료</Badge> : <Dday date={a.due} today={DEMO_TODAY} />}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {m.items?.length ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-medium text-mute">논의 사항</h3>
          {m.items.map((it) => (
            <div key={it.title} className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">{it.title}</span>
              {it.rows.map((r, i) => (
                <div key={i} className="grid grid-cols-[4.5rem_1fr] gap-2 text-sm">
                  <span className="text-mute">{r.label}</span>
                  <span>{r.text}</span>
                </div>
              ))}
              {it.decision && (
                <div className="grid grid-cols-[4.5rem_1fr] gap-2 text-sm">
                  <span><Badge tone="ok">결정</Badge></span>
                  <span className="font-medium">{it.decision}</span>
                </div>
              )}
              {it.open && (
                <div className="grid grid-cols-[4.5rem_1fr] gap-2 text-sm">
                  <span><Badge tone="warn">미결</Badge></span>
                  <span>{it.open}</span>
                </div>
              )}
            </div>
          ))}
        </section>
      ) : (
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
      )}

      {m.next && (
        <p className="text-sm">
          <span className="text-mute">다음 회의</span> {m.next}
        </p>
      )}

      {!!m.checks?.length && (
        <section className="flex flex-col gap-1.5 border border-warn/40 bg-warn-bg px-4 py-3">
          <h3 className="flex items-center gap-1.5 text-xs font-medium text-warn">
            <TriangleAlert size={13} /> 확인 필요 {m.checks.length}
          </h3>
          <ul className="list-disc pl-5 text-sm">
            {m.checks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      {!!m.internalNotes?.length && (
        <section className="flex flex-col gap-1.5 border border-dashed border-stone px-4 py-3">
          <h3 className="text-xs font-medium text-mute">내부 메모 — 배포본(Word·PDF)에 나가지 않음</h3>
          <ul className="list-disc pl-5 text-sm">
            {m.internalNotes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

type Phase = { k: "form" } | { k: "loading"; started: number } | { k: "error"; error: string; hint?: string; noKey: boolean } | { k: "result"; draft: MinutesDraft; sample: boolean; usage?: string };

const EMPTY: MinutesRequest = { project: "", title: "", date: `${DEMO_TODAY} 14:00`, place: "", attendees: "", distribute: true, memo: "", transcript: "" };

function NewMinutes({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (id: string) => void }) {
  const [req, setReq] = useState<MinutesRequest>(EMPTY);
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<Phase>({ k: "form" });
  const [, tick] = useState(0);
  const add = useDemo((s) => s.addMinutes);
  const toast = useToast((s) => s.push);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof MinutesRequest>(k: K, v: MinutesRequest[K]) => setReq((r) => ({ ...r, [k]: v }));

  useEffect(() => {
    if (phase.k !== "loading") return;
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [phase.k]);

  const run = async () => {
    // 웹 데모(정적 파일)에는 AI 정리 서버가 없다 — 예시 결과로 흐름만 보여 준다
    if (STATIC_DEMO) {
      setPhase({ k: "error", error: "웹 데모에는 AI 정리 서버가 없습니다", hint: "NAS에 설치한 포털에서 API 키를 넣으면 실제로 정리합니다", noKey: true });
      return;
    }
    setPhase({ k: "loading", started: Date.now() });
    try {
      const p = project(code);
      const res = await fetch(withBase("/api/minutes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req, project: p ? `${p.code} ${p.name}` : req.project }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase({ k: "error", error: j.error ?? `오류 ${res.status}`, hint: j.hint, noKey: res.status === 503 });
        return;
      }
      setPhase({ k: "result", draft: j.minutes, sample: false, usage: `${j.model} · 입력 ${j.usage.input.toLocaleString()} · 출력 ${j.usage.output.toLocaleString()} 토큰` });
    } catch {
      setPhase({ k: "error", error: "포털 서버에 연결하지 못했습니다", noKey: false });
    }
  };

  const close = () => {
    onClose();
    setPhase({ k: "form" });
  };

  const preview = phase.k === "result" ? fromDraft(phase.draft, req, code || "—") : null;

  return (
    <Drawer
      open={open}
      onClose={close}
      width={780}
      title={
        <span className="flex items-center gap-2">
          <Sparkles size={16} /> 새 회의록 — AKJ 회의록 규칙으로 정리
        </span>
      }
      footer={
        phase.k === "result" ? (
          <>
            <Button variant="ghost" onClick={() => setPhase({ k: "form" })}>
              <RotateCcw size={14} /> 입력으로
            </Button>
            <Button onClick={() => preview && download(`${preview.date.slice(2, 10).replace(/-/g, "")} ${project(code)?.name ?? ""} ${preview.title} 회의록.md`, minutesMarkdown(preview, project(code)?.name ?? ""))}>
              <Download size={14} /> Markdown
            </Button>
            <Button
              variant="primary"
              disabled={!code}
              title={code ? undefined : "프로젝트를 고르세요"}
              onClick={() => {
                if (!preview) return;
                add(preview);
                toast(`회의록을 저장했습니다 — ${preview.actions.length}건의 할 일`);
                close();
                onSaved(preview.id);
              }}
            >
              저장
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={close}>
              닫기
            </Button>
            <Button variant="primary" disabled={!req.transcript.trim() || phase.k === "loading"} onClick={run}>
              {phase.k === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 정리하기
            </Button>
          </>
        )
      }
    >
      {phase.k === "result" && preview ? (
        <div className="flex flex-col gap-5">
          <div className={`flex flex-wrap items-center gap-2 px-3 py-2 text-sm ${phase.sample ? "border border-dashed border-stone" : "bg-surface"}`}>
            {phase.sample ? <Badge tone="warn">예시 결과 — 실제 AI 출력 아님</Badge> : <Badge tone="ok">AI 정리 완료</Badge>}
            <span className="text-mute">
              할 일 {phase.draft.actions.length}건 · 담당·기한 미정 {undecidedCount(phase.draft)}건 · 확인 필요 {phase.draft.checks.length}건
              {phase.draft.corrections.length > 0 && ` · 용어 교정 ${phase.draft.corrections.length}건`}
            </span>
            {phase.usage && <span className="ml-auto text-xs text-stone">{phase.usage}</span>}
          </div>
          {!code && <p className="text-sm text-bad">저장하려면 입력으로 돌아가 프로젝트를 고르세요.</p>}
          <h2 className="text-lg font-semibold">{preview.title}</h2>
          <MinutesDoc m={preview} preview />
          <p className="text-xs text-mute">배포 전 소장님 검토 · 메일 CC에 소장님. 담당·기한 미정 건은 저장 전에 정해 두는 게 좋다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 border border-line bg-surface px-3 py-2 text-xs text-mute">
            <span>처음이면 예시 전사본으로 흐름을 보세요 (가상의 회의).</span>
            <Button
              size="sm"
              onClick={() => {
                setReq(SAMPLE_REQUEST);
                setCode("12612");
              }}
            >
              예시 넣기
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="프로젝트">
              <select className={inputCls} value={code} onChange={(e) => setCode(e.target.value)}>
                <option value="">고르기</option>
                {PROJECTS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="회의 제목">
              <input className={inputCls} value={req.title} onChange={(e) => set("title", e.target.value)} placeholder="예: 창호 대안 미팅" />
            </Field>
            <Field label="일시">
              <input className={inputCls} value={req.date} onChange={(e) => set("date", e.target.value)} placeholder="2026-11-02 (월) 14:00" />
            </Field>
            <Field label="장소">
              <input className={inputCls} value={req.place} onChange={(e) => set("place", e.target.value)} />
            </Field>
          </div>
          <Field label="참석자" hint="기관별로 — 예: AKJ: 오하린, 한지호 / 건축주: 건축주 A">
            <input className={inputCls} value={req.attendees} onChange={(e) => set("attendees", e.target.value)} />
          </Field>
          <Field label="구분" hint="참석자에게 보낼 회의록이면 배포용 — 내부 판단·평가는 본문에서 빠지고 내부 메모로 간다">
            <div className="flex border border-line" role="group">
              {[
                [true, "배포용 (참석자에게 보냄)"],
                [false, "내부용 (위키에만)"],
              ].map(([v, label]) => (
                <button
                  key={String(v)}
                  type="button"
                  aria-pressed={req.distribute === v}
                  onClick={() => set("distribute", v as boolean)}
                  className={`h-9 flex-1 text-sm ${req.distribute === v ? "bg-ink text-paper" : "hover:bg-surface"}`}
                >
                  {label as string}
                </button>
              ))}
            </div>
          </Field>
          <Field label="회의 중 메모 (선택)" hint="결정 사항은 메모가 더 정확한 경우가 많다 — 메모를 뼈대로 쓴다">
            <textarea className="min-h-16 w-full border border-line p-2.5 text-sm outline-none focus:border-ink" value={req.memo} onChange={(e) => set("memo", e.target.value)} />
          </Field>
          <Field label="녹음 전사본" hint="클로바노트 등에서 내보낸 텍스트를 붙여 넣거나 .txt 파일을 올린다">
            <textarea
              className="min-h-56 w-full border border-line p-2.5 font-mono text-xs leading-relaxed outline-none focus:border-ink"
              value={req.transcript}
              onChange={(e) => set("transcript", e.target.value)}
              placeholder="참석자 1 00:02 ..."
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              <FileText size={13} /> .txt 올리기
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) set("transcript", await f.text());
                e.target.value = "";
              }}
            />
            <span className="flex items-center gap-1.5 border border-dashed border-stone px-2 py-1 text-xs text-mute">
              <Mic size={12} /> 음성 파일 — 음성인식 서비스를 정한 뒤
            </span>
            <span className="ml-auto text-xs text-stone tabular-nums">{req.transcript.length.toLocaleString()}자</span>
          </div>

          {phase.k === "loading" && (
            <div className="flex items-center gap-2 border border-line bg-surface px-3 py-2.5 text-sm">
              <Loader2 size={15} className="animate-spin" /> 정리하는 중… {Math.round((Date.now() - phase.started) / 1000)}초 — 긴 회의는 1~2분 걸린다
            </div>
          )}
          {phase.k === "error" && (
            <div className="flex flex-col gap-2 border border-bad bg-bad-bg px-3 py-2.5 text-sm text-bad">
              <span className="flex items-center gap-1.5 font-medium">
                <TriangleAlert size={15} /> {phase.error}
              </span>
              {phase.hint && <span className="text-xs">{phase.hint}</span>}
              {phase.noKey && (
                <Button size="sm" className="self-start" onClick={() => setPhase({ k: "result", draft: SAMPLE_DRAFT, sample: true })}>
                  예시 결과로 흐름 보기
                </Button>
              )}
            </div>
          )}
          <p className="text-xs text-mute">
            정리하기를 누르면 전사본이 회사 서버를 거쳐 Anthropic API로 전송된다. 고객과 비밀유지 약정이 있는 회의는 확인한 뒤 쓴다. 담당·기한이 전사에 없으면 지어내지 않고 &lsquo;미정&rsquo;으로 둔다.
          </p>
        </div>
      )}
    </Drawer>
  );
}

export default function MinutesView() {
  const params = useSearchParams();
  const router = useRouter();
  const saved = useDemo((s) => s.minutes);
  const done = useDemo((s) => s.actionsDone);
  const toast = useToast((s) => s.push);
  const all = useMemo(() => [...saved, ...MINUTES], [saved]);
  const [openId, setOpenId] = useState(MINUTES[0].id);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const id = params.get("id");
    if (id) setOpenId(id);
    if (params.get("new")) setShowNew(true);
  }, [params]);

  const m = all.find((x) => x.id === openId) ?? all[0];
  const pname = project(m.project)?.name ?? "";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="회의록"
        sub="참석자별 할 일 중심 · 전사본을 AKJ 회의록 규칙으로 정리"
        actions={
          <Button variant="primary" onClick={() => setShowNew(true)}>
            <Plus size={15} /> 새 회의록
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <ul className="divide-y divide-line">
            {all.map((x) => {
              const n = x.actions.length;
              const d = x.actions.filter((a) => done[a.id]).length;
              return (
                <li key={x.id}>
                  <button type="button" onClick={() => setOpenId(x.id)} className={`flex w-full flex-col gap-1.5 px-4 py-3 text-left ${m.id === x.id ? "bg-surface" : "hover:bg-surface"}`}>
                    <span className="flex items-center gap-2">
                      <ProjectChip code={x.project} />
                      <span className="text-xs text-mute">{fmtDay(x.date)}</span>
                      {x.source.startsWith("포털 AI") && <Badge tone="info">AI 정리</Badge>}
                    </span>
                    <span className="text-sm font-medium">{x.title}</span>
                    <span className="flex items-center gap-2 text-xs text-mute">
                      할 일 {d}/{n}
                      <span className="block h-1 w-16 bg-line">
                        <span className="block h-full bg-ink" style={{ width: `${n ? (d / n) * 100 : 0}%` }} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <article className="flex flex-col gap-5 px-6 py-5">
            <header className="flex flex-col gap-2 border-b border-line pb-4">
              <div className="flex items-center gap-2 text-xs text-mute">
                <ProjectChip code={m.project} /> {pname}
              </div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-xl font-semibold">{m.title}</h2>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => download(`${m.date.slice(2, 10).replace(/-/g, "")} ${pname} ${m.title} 회의록.md`, minutesMarkdown(m, pname))}>
                    <Download size={13} /> Markdown
                  </Button>
                  <Button size="sm" onClick={() => toast("Word·PDF는 회의록 스킬의 양식으로 서버에서 만든다 — NAS 구축 후")}>
                    <FileText size={13} /> Word
                  </Button>
                  <Button size="sm" onClick={() => toast(`${m.project} / 00 ADMIN / 03 MEETING 에 저장 (데모)`)}>
                    <FolderInput size={13} /> 프로젝트 폴더
                  </Button>
                </div>
              </div>
            </header>
            <MinutesDoc m={m} />
          </article>
        </Card>
      </div>
      <NewMinutes
        open={showNew}
        onClose={() => (setShowNew(false), params.get("new") && router.replace("/minutes"))}
        onSaved={(id) => setOpenId(id)}
      />
    </div>
  );
}
