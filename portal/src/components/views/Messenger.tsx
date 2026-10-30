"use client";

import { Bot, Box, File, Hash, Lock, Paperclip, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { DEMO_TODAY } from "@/data/demo";
import { MAILS } from "@/data/mail";
import { CHANNELS, type Channel, type ChatMessage } from "@/data/messages";
import { useChannelMessages, useUnread } from "@/lib/chat";
import { MINUTES } from "@/data/minutes";
import { ME, person } from "@/data/people";
import { project } from "@/data/projects";
import { fmtTime } from "@/lib/format";
import { Dday, StageBar } from "@/lib/project-ui";
import { useDemo, useToast } from "@/lib/store";
import { Avatar, AvatarStack, Button } from "@/components/ui";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const dayLabel = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return iso.slice(0, 10) === DEMO_TODAY ? "오늘" : `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`;
};

const me = person(ME)!;

/** @이름 강조 — 내 이름이면 노란 바탕 */
function Text({ text }: { text: string }) {
  const parts = text.split(/(@[가-힣A-Za-z]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <span key={i} className={`px-0.5 font-medium ${p.slice(1) === me.name ? "bg-warn-bg text-warn" : "text-info"}`}>
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

function ChannelIcon({ c, size = 15 }: { c: Channel; size?: number }) {
  if (c.kind === "dm") return <Avatar id={c.members.find((m) => m !== ME)} size={size + 5} />;
  return c.kind === "project" ? <Box size={size} /> : <Hash size={size} />;
}

function MessageRow({ m, compact }: { m: ChatMessage; compact: boolean }) {
  const toast = useToast((s) => s.push);
  const reacted = useDemo((s) => s.reacted);
  const toggle = useDemo((s) => s.toggleReaction);

  if (m.author === "bot") {
    return (
      <div className="my-1 flex items-center gap-3 border-l-2 border-stone bg-surface px-3 py-2 text-sm">
        <Bot size={15} className="shrink-0 text-mute" />
        <span className="min-w-0 flex-1">{m.text}</span>
        {m.link && (
          <Link href={m.link.href} className="shrink-0 text-xs underline underline-offset-2 hover:text-mute">
            {m.link.label}
          </Link>
        )}
        <span className="shrink-0 text-xs text-stone tabular-nums">{fmtTime(m.at)}</span>
      </div>
    );
  }
  const p = person(m.author);
  return (
    <div className={`group flex gap-3 px-1 hover:bg-surface/60 ${compact ? "pt-0.5" : "pt-3"}`}>
      <div className="w-9 shrink-0">{!compact && <Avatar id={m.author} size={36} />}</div>
      <div className="min-w-0 flex-1">
        {!compact && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{p?.name}</span>
            <span className="text-xs text-mute">{p?.title}</span>
            <span className="text-xs text-stone tabular-nums">{fmtTime(m.at)}</span>
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          <Text text={m.text} />
        </p>
        {m.files?.map((f) => (
          <div key={f.name} className="mt-1.5 flex max-w-md items-center gap-3 border border-line bg-paper px-3 py-2 text-sm">
            {f.name.endsWith(".3dm") ? <Box size={16} className="text-mute" /> : <File size={16} className="text-mute" />}
            <span className="min-w-0 flex-1 truncate">{f.name}</span>
            <span className="text-xs text-stone">{f.size}</span>
            {f.sample ? (
              <Link href={`/viewer?src=${encodeURIComponent(f.sample)}`} className="text-xs underline underline-offset-2">
                뷰어로 열기
              </Link>
            ) : (
              <button type="button" className="text-xs underline underline-offset-2" onClick={() => toast("NAS 연결 후 열 수 있습니다")}>
                열기
              </button>
            )}
          </div>
        ))}
        {!!m.reactions?.length && (
          <div className="mt-1.5 flex gap-1.5">
            {m.reactions.map((r) => {
              const key = `${m.id}:${r.label}`;
              const mine = r.by.includes(ME) !== !!reacted[key];
              const n = r.by.filter((x) => x !== ME).length + (mine ? 1 : 0);
              return (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => toggle(key)}
                  title={r.by.map((x) => person(x)?.name).join(", ")}
                  className={`border px-2 py-0.5 text-xs ${mine ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink"}`}
                >
                  {r.label} {n}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Messenger() {
  const params = useSearchParams();
  const router = useRouter();
  const all = useChannelMessages();
  const unread = useUnread();
  const send = useDemo((s) => s.sendMessage);
  const markRead = useDemo((s) => s.markRead);
  const approvals = useDemo((s) => s.approvals);
  const savedMinutes = useDemo((s) => s.minutes);
  const toast = useToast((s) => s.push);
  const [cid, setCid] = useState("c-12611");
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = params.get("c");
    if (c && CHANNELS.some((x) => x.id === c)) setCid(c);
  }, [params]);

  const ch = CHANNELS.find((c) => c.id === cid)!;
  const msgs = all.filter((m) => m.channel === cid);
  const last = msgs.at(-1)?.at;

  useEffect(() => {
    if (last) markRead(cid, last);
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [cid, last, markRead]);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    send({ channel: cid, author: ME, at: `${DEMO_TODAY}T${new Date().toTimeString().slice(0, 5)}`, text: t });
    setText("");
  };

  const p = ch.project ? project(ch.project) : undefined;
  const files = msgs.flatMap((m) => m.files ?? []);
  const projMinutes = p ? [...savedMinutes, ...MINUTES].filter((m) => m.project === p.code) : [];
  const projApprovals = p ? approvals.filter((a) => a.project === p.code) : [];
  const projMails = p ? MAILS.filter((m) => m.project === p.code) : [];

  const Group = ({ title, kind }: { title: string; kind: Channel["kind"] }) => (
    <div className="flex flex-col">
      <span className="px-3 pb-1 text-[11px] text-stone">{title}</span>
      {CHANNELS.filter((c) => c.kind === kind).map((c) => {
        const n = unread[c.id] ?? 0;
        const on = c.id === cid;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setCid(c.id);
              if (params.get("c")) router.replace("/messages");
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-left text-sm ${on ? "bg-ink text-paper" : "hover:bg-surface"}`}
          >
            <ChannelIcon c={c} size={14} />
            <span className={`min-w-0 flex-1 truncate ${n && !on ? "font-semibold" : ""}`}>{c.name}</span>
            {n > 0 && !on && <span className="min-w-5 bg-ink px-1 text-center text-[11px] leading-[18px] text-paper tabular-nums">{n}</span>}
          </button>
        );
      })}
    </div>
  );

  // 같은 사람이 5분 안에 이어 쓰면 머리줄 생략
  const rows: { m: ChatMessage; compact: boolean; day?: string }[] = [];
  msgs.forEach((m, i) => {
    const prev = msgs[i - 1];
    const day = !prev || prev.at.slice(0, 10) !== m.at.slice(0, 10) ? dayLabel(m.at) : undefined;
    const compact = !!prev && !day && prev.author === m.author && m.author !== "bot" && new Date(m.at).getTime() - new Date(prev.at).getTime() < 5 * 60_000;
    rows.push({ m, compact, day });
  });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">메신저</h1>
          <p className="text-sm text-mute">프로젝트마다 채널 하나 — 결재·회의록·메일·일정 알림이 같은 채널에 모인다 · 데모 대화</p>
        </div>
      </header>

      {/* 행 높이를 고정(minmax(0,1fr))해야 긴 대화가 틀을 밀어내지 않고 안에서 스크롤된다 */}
      <div className="grid h-[calc(100vh-12.5rem)] min-h-[520px] grid-cols-[230px_1fr] grid-rows-[minmax(0,1fr)] border border-line bg-paper xl:grid-cols-[230px_1fr_280px]">
        <nav className="flex flex-col gap-4 overflow-y-auto border-r border-line py-3" aria-label="채널">
          <Group title="프로젝트" kind="project" />
          <Group title="팀" kind="team" />
          <Group title="개인 메시지" kind="dm" />
        </nav>

        <section className="flex min-h-0 min-w-0 flex-col">
          <header className="flex items-center gap-3 border-b border-line px-5 py-3">
            <ChannelIcon c={ch} size={18} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{ch.name}</div>
              {ch.topic && <div className="truncate text-xs text-mute">{ch.topic}</div>}
            </div>
            {ch.kind !== "dm" && <AvatarStack ids={ch.members} size={24} />}
          </header>

          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {rows.map(({ m, compact, day }) => (
              <Fragment key={m.id}>
                {day && (
                  <div className="sticky top-0 z-[1] my-3 flex items-center gap-3 bg-paper py-1 text-xs text-mute">
                    <span className="h-px flex-1 bg-line" />
                    {day}
                    <span className="h-px flex-1 bg-line" />
                  </div>
                )}
                <MessageRow m={m} compact={compact} />
              </Fragment>
            ))}
            {!rows.length && <p className="py-10 text-center text-sm text-mute">아직 대화가 없습니다</p>}
          </div>

          <div className="border-t border-line p-3">
            <div className="flex items-end gap-2 border border-line px-2 py-1.5 focus-within:border-ink">
              <button type="button" aria-label="파일 첨부" className="p-1.5 text-mute hover:text-ink" onClick={() => toast("파일 첨부는 NAS 구축 후 — 첨부는 프로젝트 폴더에 같이 저장된다")}>
                <Paperclip size={16} />
              </button>
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={`${ch.kind === "dm" ? ch.name + "님에게" : "#" + ch.name + "에"} 메시지 보내기 — Enter 보내기, Shift+Enter 줄바꿈`}
                className="max-h-40 min-h-8 flex-1 resize-none py-1.5 text-sm outline-none placeholder:text-stone focus-visible:outline-none"
              />
              <Button size="sm" variant="primary" disabled={!text.trim()} onClick={submit} aria-label="보내기">
                <SendHorizontal size={14} />
              </Button>
            </div>
          </div>
        </section>

        <aside className="hidden flex-col gap-5 overflow-y-auto border-l border-line p-4 xl:flex">
          {p ? (
            <>
              <section className="flex flex-col gap-2">
                <span className="text-xs text-mute">프로젝트</span>
                <Link href={`/projects/${p.code}`} className="font-semibold hover:underline">
                  {p.code} {p.name}
                </Link>
                <span className="flex items-center justify-between text-xs">
                  <span>
                    {p.stage} <span className="text-mute">{p.progress}%</span>
                  </span>
                  <Dday date={p.due} today={DEMO_TODAY} />
                </span>
                <StageBar p={p} />
              </section>
              <section className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs text-mute">연결된 것</span>
                <Link href={`/minutes?id=${projMinutes[0]?.id ?? ""}`} className="flex justify-between hover:underline">
                  회의록 <span className="text-mute tabular-nums">{projMinutes.length}</span>
                </Link>
                <Link href="/approvals" className="flex justify-between hover:underline">
                  결재 <span className="text-mute tabular-nums">{projApprovals.length}</span>
                </Link>
                <Link href="/mail" className="flex justify-between hover:underline">
                  메일 <span className="text-mute tabular-nums">{projMails.length}</span>
                </Link>
                <Link href={`/projects/${p.code}`} className="flex justify-between hover:underline">
                  프로젝트 폴더 <span className="text-mute">열기</span>
                </Link>
              </section>
            </>
          ) : (
            <section className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-mute">{ch.kind === "dm" ? "개인 메시지" : "팀 채널"}</span>
              <span className="flex items-center gap-1.5 text-mute">
                <Lock size={13} /> 참여한 사람만 봅니다
              </span>
            </section>
          )}
          <section className="flex flex-col gap-2">
            <span className="text-xs text-mute">멤버 {ch.members.length}</span>
            {ch.members.map((id) => (
              <span key={id} className="flex items-center gap-2 text-sm">
                <Avatar id={id} size={24} /> {person(id)?.name} <span className="text-xs text-mute">{person(id)?.title}</span>
              </span>
            ))}
          </section>
          {files.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <span className="text-xs text-mute">공유된 파일 {files.length}</span>
              {files.map((f) => (
                <span key={f.name} className="flex items-center gap-2 text-xs">
                  <File size={13} className="shrink-0 text-mute" /> <span className="truncate">{f.name}</span>
                </span>
              ))}
            </section>
          )}
          <p className="mt-auto text-[11px] text-stone">대화 기록은 NAS 구축 후 서버에 보관한다. 지금은 이 브라우저에만 저장된다.</p>
        </aside>
      </div>
    </div>
  );
}
