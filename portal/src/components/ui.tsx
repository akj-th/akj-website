"use client";

// 포털 공통 UI 부품 — 상태 없는 것만. 서랍·모달·알림은 overlay.tsx
import Link from "next/link";
import { person } from "@/data/people";

export type Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "dark";

const TONE: Record<Tone, string> = {
  neutral: "bg-surface text-mute border-line",
  ok: "bg-ok-bg text-ok border-transparent",
  warn: "bg-warn-bg text-warn border-transparent",
  bad: "bg-bad-bg text-bad border-transparent",
  info: "bg-info-bg text-info border-transparent",
  dark: "bg-ink text-paper border-ink",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-[11px] leading-none font-medium whitespace-nowrap ${TONE[tone]}`}>
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  const c = { neutral: "bg-stone", ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", info: "bg-info", dark: "bg-ink" }[tone];
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${c}`} />;
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" };

export function Button({ variant = "secondary", size = "md", className = "", ...p }: BtnProps) {
  const v = {
    primary: "bg-ink text-paper border-ink hover:bg-[#262626]",
    secondary: "bg-paper text-ink border-line hover:border-ink",
    ghost: "bg-transparent text-ink border-transparent hover:bg-surface",
    danger: "bg-paper text-bad border-line hover:border-bad",
  }[variant];
  const s = size === "sm" ? "h-7 px-2.5 text-xs gap-1" : "h-9 px-3.5 text-sm gap-1.5";
  return (
    <button
      type="button"
      {...p}
      className={`inline-flex shrink-0 items-center justify-center border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${v} ${s} ${className}`}
    />
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`border border-line bg-paper ${className}`}>{children}</section>;
}

export function CardHeader({ title, action, sub }: { title: React.ReactNode; action?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div className="flex min-w-0 items-baseline gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {sub && <span className="text-xs text-mute">{sub}</span>}
      </div>
      {action}
    </header>
  );
}

const AVATAR_BG = ["#1f1f1f", "#4a4a46", "#6b5b4b", "#3f5a4f", "#4b5568", "#7a4b3a", "#5a4b6b", "#2f4b5a"];

export function Avatar({ id, name, size = 28 }: { id?: string; name?: string; size?: number }) {
  const p = id ? person(id) : undefined;
  const label = p?.name ?? name ?? "?";
  const key = id ?? label;
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const bg = p ? AVATAR_BG[h % AVATAR_BG.length] : "#b9b9b4";
  const text = /[가-힣]/.test(label) ? label.replace(/\s.*/, "").slice(-2) : label.slice(0, 2).toUpperCase();
  return (
    <span
      title={p ? `${p.name} ${p.title}` : label}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-medium text-paper"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
    >
      {text}
    </span>
  );
}

export function AvatarStack({ ids, size = 24 }: { ids: string[]; size?: number }) {
  return (
    <span className="flex -space-x-1.5">
      {ids.map((id) => (
        <span key={id} className="rounded-full ring-2 ring-paper">
          <Avatar id={id} size={size} />
        </span>
      ))}
    </span>
  );
}

export function Progress({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`block h-1.5 w-full overflow-hidden bg-line ${className}`}>
      <span className="block h-full bg-ink" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </span>
  );
}

export function PageHeader({
  title,
  sub,
  actions,
  crumbs,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  crumbs?: { href: string; label: string }[];
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        {crumbs && (
          <nav className="flex items-center gap-1 text-xs text-mute" aria-label="위치">
            {crumbs.map((c) => (
              <span key={c.href} className="flex items-center gap-1">
                <Link href={c.href} className="hover:text-ink hover:underline">
                  {c.label}
                </Link>
                <span aria-hidden>/</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="text-sm text-mute">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Stat({ label, value, sub, href }: { label: string; value: React.ReactNode; sub?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <span className="text-xs text-mute">{label}</span>
      <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
      {sub && <span className="text-xs text-mute">{sub}</span>}
    </>
  );
  const cls = "flex flex-col gap-1 border border-line bg-paper px-4 py-3";
  return href ? (
    <Link href={href} className={`${cls} hover:border-ink`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-mute">{children}</p>;
}

export function ProjectChip({ code }: { code: string }) {
  return (
    <Link
      href={`/projects/${code}`}
      className="inline-flex items-center border border-line bg-paper px-1.5 py-0.5 text-[11px] leading-none font-medium tabular-nums hover:border-ink"
      onClick={(e) => e.stopPropagation()}
    >
      {code}
    </Link>
  );
}
