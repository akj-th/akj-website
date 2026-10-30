"use client";

// 프로젝트 관련 작은 표시 부품 — 여러 화면에서 같이 쓴다
import { STAGES, type Project, type ProjectStatus } from "@/data/projects";
import { daysBetween } from "@/lib/format";
import { Badge, type Tone } from "@/components/ui";

export const STATUS_TONE: Record<ProjectStatus, Tone> = { 진행: "info", 대기: "warn", 보류: "neutral", 완료: "ok" };

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status}</Badge>;
}

/** 7단계 막대 — 지난 단계는 검게, 현재 단계는 진행률만큼 */
export function StageBar({ p, labels = false }: { p: Project; labels?: boolean }) {
  const cur = STAGES.indexOf(p.stage);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-0.5" aria-label={`${p.stage} ${p.progress}%`}>
        {STAGES.map((s, i) => (
          <span key={s} className="relative h-1.5 flex-1 overflow-hidden bg-line" title={s}>
            <span
              className="absolute inset-y-0 left-0 bg-ink"
              style={{ width: i < cur ? "100%" : i === cur ? `${p.progress}%` : "0%" }}
            />
          </span>
        ))}
      </div>
      {labels && (
        <div className="flex gap-0.5">
          {STAGES.map((s, i) => (
            <span key={s} className={`flex-1 text-[11px] ${i === cur ? "font-semibold text-ink" : i < cur ? "text-mute" : "text-stone"}`}>
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Dday({ date, today }: { date: string; today: string }) {
  const d = daysBetween(today, date);
  if (d < 0) return <span className="text-xs text-stone tabular-nums">지남</span>;
  const tone = d <= 3 ? "text-bad font-semibold" : d <= 14 ? "text-warn" : "text-mute";
  return <span className={`text-xs tabular-nums ${tone}`}>{d === 0 ? "D-day" : `D-${d}`}</span>;
}
