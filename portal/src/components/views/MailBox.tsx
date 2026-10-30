"use client";

import { FolderInput, Inbox, Paperclip, Reply, Send, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DEMO_TODAY } from "@/data/demo";
import { MAILS, type Mail } from "@/data/mail";
import { project } from "@/data/projects";
import { fmtDay, fmtTime, fmtWhen } from "@/lib/format";
import { useDemo, useToast } from "@/lib/store";
import { Avatar, Badge, Button, Empty, PageHeader, ProjectChip } from "@/components/ui";

type Box = { kind: "folder"; id: "inbox" | "sent" } | { kind: "project"; code: string };

export default function MailBox() {
  const params = useSearchParams();
  const mailRead = useDemo((s) => s.mailRead);
  const readMail = useDemo((s) => s.readMail);
  const toast = useToast((s) => s.push);
  const [box, setBox] = useState<Box>({ kind: "folder", id: "inbox" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);

  // 다른 화면에서 ?id= 로 들어오면 그 메일을 연다
  useEffect(() => {
    const id = params.get("id");
    const m = MAILS.find((x) => x.id === id);
    if (m) {
      setBox({ kind: "folder", id: m.folder });
      setOpenId(m.id);
    }
  }, [params]);

  useEffect(() => {
    if (openId) readMail(openId);
    setDraft(null);
  }, [openId, readMail]);

  const projects = useMemo(() => [...new Set(MAILS.map((m) => m.project).filter(Boolean))] as string[], []);
  const list = MAILS.filter((m) => (box.kind === "folder" ? m.folder === box.id : m.project === box.code)).sort((a, b) => b.date.localeCompare(a.date));
  const open = MAILS.find((m) => m.id === openId) ?? null;
  const unread = (f: (m: Mail) => boolean) => MAILS.filter((m) => f(m) && !mailRead[m.id]).length;

  const BoxBtn = ({ b, label, icon, n }: { b: Box; label: string; icon?: React.ReactNode; n?: number }) => {
    const on = JSON.stringify(b) === JSON.stringify(box);
    return (
      <button
        type="button"
        onClick={() => {
          setBox(b);
          setOpenId(null);
        }}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${on ? "bg-ink text-paper" : "hover:bg-surface"}`}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {!!n && <span className={`text-xs font-semibold tabular-nums ${on ? "" : "text-info"}`}>{n}</span>}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="메일" sub="데모 메일 — 메일 서비스 연결(IMAP)은 2단계. 모든 메일 사본은 NAS에 보관한다." />
      <div className="grid h-[calc(100vh-13rem)] min-h-[520px] grid-cols-[200px_340px_1fr] border border-line bg-paper">
        <nav className="flex flex-col gap-4 overflow-y-auto border-r border-line py-2" aria-label="메일함">
          <div>
            <BoxBtn b={{ kind: "folder", id: "inbox" }} label="받은 메일함" icon={<Inbox size={15} />} n={unread((m) => m.folder === "inbox")} />
            <BoxBtn b={{ kind: "folder", id: "sent" }} label="보낸 메일함" icon={<Send size={15} />} />
          </div>
          <div>
            <span className="px-3 text-[11px] text-stone">프로젝트별</span>
            {projects.map((c) => (
              <BoxBtn key={c} b={{ kind: "project", code: c }} label={`${c} ${project(c)?.name ?? ""}`} n={unread((m) => m.project === c)} />
            ))}
          </div>
        </nav>

        <ul className="divide-y divide-line overflow-y-auto border-r border-line">
          {list.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setOpenId(m.id)}
                className={`flex w-full flex-col gap-1 px-4 py-3 text-left ${openId === m.id ? "bg-surface" : "hover:bg-surface"}`}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${mailRead[m.id] ? "bg-transparent" : "bg-info"}`} />
                  <span className={`min-w-0 flex-1 truncate text-sm ${mailRead[m.id] ? "" : "font-semibold"}`}>
                    {m.folder === "sent" ? `받는 사람: ${m.to}` : m.from.name}
                  </span>
                  <span className="text-xs text-mute tabular-nums">{fmtWhen(m.date, DEMO_TODAY)}</span>
                </span>
                <span className={`truncate pl-3.5 text-sm ${mailRead[m.id] ? "text-mute" : ""}`}>{m.subject}</span>
                <span className="flex items-center gap-1.5 pl-3.5">
                  {m.project && <ProjectChip code={m.project} />}
                  {m.attachments.length > 0 && <Paperclip size={12} className="text-stone" />}
                </span>
              </button>
            </li>
          ))}
          {!list.length && <Empty>메일이 없습니다</Empty>}
        </ul>

        <div className="min-w-0 overflow-y-auto">
          {open ? (
            <article className="flex flex-col gap-5 px-6 py-5">
              <header className="flex flex-col gap-3 border-b border-line pb-4">
                <h2 className="text-lg font-semibold">{open.subject}</h2>
                <div className="flex items-center gap-3">
                  <Avatar name={open.from.name} size={32} />
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="font-medium">{open.from.name}</div>
                    <div className="text-xs text-mute">
                      {open.from.email} → {open.to}
                    </div>
                  </div>
                  <span className="text-xs text-mute tabular-nums">
                    {fmtDay(open.date)} {fmtTime(open.date)}
                  </span>
                </div>
                {open.project && (
                  <div className="flex items-center gap-2 text-xs text-mute">
                    프로젝트 <ProjectChip code={open.project} /> {project(open.project)?.name}
                    <span className="text-stone">— 제목의 [코드]로 자동 분류</span>
                  </div>
                )}
              </header>

              {open.summary && (
                <section className="border border-line bg-surface px-4 py-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                    <Sparkles size={13} /> AI 요약 <Badge>시안 — 미리 쓴 예시</Badge>
                  </div>
                  <ul className="list-disc pl-5 text-sm">
                    {open.summary.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="flex flex-col gap-3 text-sm leading-relaxed">
                {open.body.map((b, i) => (
                  <p key={i}>{b}</p>
                ))}
              </div>

              {open.attachments.length > 0 && (
                <section className="flex flex-col gap-2">
                  <span className="text-xs text-mute">첨부 {open.attachments.length}</span>
                  {open.attachments.map((a) => (
                    <div key={a.name} className="flex items-center gap-3 border border-line px-3 py-2 text-sm">
                      <Paperclip size={14} className="text-mute" />
                      <span className="min-w-0 flex-1 truncate">{a.name}</span>
                      <span className="text-xs text-stone">{a.size}</span>
                      {open.project && (
                        <Button size="sm" onClick={() => toast(`${open.project} / 00 ADMIN / 01 INCOMING 에 저장 (데모)`)}>
                          <FolderInput size={13} /> 프로젝트 폴더에 저장
                        </Button>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {open.folder === "inbox" && (
                <section className="flex flex-col gap-2 border-t border-line pt-4">
                  {draft === null ? (
                    <div className="flex gap-2">
                      <Button onClick={() => setDraft("")}>
                        <Reply size={14} /> 답장
                      </Button>
                      {open.draft && (
                        <Button variant="primary" onClick={() => setDraft(open.draft!)}>
                          <Sparkles size={14} /> AKJ 말투로 답장 초안
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={8}
                        className="w-full border border-line p-3 text-sm leading-relaxed outline-none focus:border-ink"
                        placeholder="답장 내용"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setDraft(null)}>
                          취소
                        </Button>
                        <Button variant="primary" onClick={() => (toast("데모 — 실제로 보내지 않았습니다"), setDraft(null))}>
                          <Send size={14} /> 보내기
                        </Button>
                      </div>
                    </>
                  )}
                </section>
              )}
            </article>
          ) : (
            <div className="grid h-full place-items-center text-sm text-mute">메일을 고르세요</div>
          )}
        </div>
      </div>
    </div>
  );
}
