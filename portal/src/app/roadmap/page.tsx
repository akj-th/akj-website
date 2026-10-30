import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardHeader, PageHeader, type Tone } from "@/components/ui";
import { MODULES, STATUS_LABEL, type ModuleStatus, type Stage } from "@/lib/modules";
import { INFRA_STEPS, STAGE_TITLE } from "@/lib/roadmap";

export const metadata: Metadata = { title: "로드맵" };

const STAGES: Stage[] = [1, 2, 3];
const TONE: Record<ModuleStatus, Tone> = { planned: "neutral", demo: "warn", building: "info", live: "ok" };

export default function Roadmap() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="로드맵"
        sub="구글 → NAS 전환과 포털 기능을 어떤 순서로 만들지"
        actions={
          <span className="flex gap-1.5">
            {(Object.keys(STATUS_LABEL) as ModuleStatus[]).map((s) => (
              <Badge key={s} tone={TONE[s]}>
                {STATUS_LABEL[s]}
              </Badge>
            ))}
          </span>
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">전환 단계</h2>
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {INFRA_STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 border border-line bg-paper p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-semibold text-stone tabular-nums">{String(i).padStart(2, "0")}</span>
                <span className="text-xs text-mute tabular-nums">{s.when}</span>
              </div>
              <span className="font-medium">{s.title}</span>
              <ul className="flex flex-col gap-1.5 text-sm text-mute">
                {s.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 bg-ink" />
                    {it}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">포털 기능</h2>
        {STAGES.map((st) => (
          <Card key={st}>
            <CardHeader title={STAGE_TITLE[st]} />
            <ul className="divide-y divide-line">
              {MODULES.filter((m) => m.stage === st).map((m) => (
                <li key={m.slug}>
                  <Link href={`/${m.slug}`} className="grid grid-cols-1 gap-2 px-4 py-3 hover:bg-surface md:grid-cols-[10rem_1fr_16rem_auto] md:items-center md:gap-4">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-sm text-mute">{m.summary}</span>
                    <span className="text-xs text-stone">다음: {m.next.join(" · ")}</span>
                    <Badge tone={TONE[m.status]}>{STATUS_LABEL[m.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </section>
    </div>
  );
}
