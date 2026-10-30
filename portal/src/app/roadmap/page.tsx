import type { Metadata } from "next";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { MODULES, type Stage } from "@/lib/modules";
import { INFRA_STEPS, STAGE_TITLE } from "@/lib/roadmap";

export const metadata: Metadata = { title: "로드맵" };

const STAGES: Stage[] = [1, 2, 3];

export default function Roadmap() {
  return (
    <div className="flex max-w-5xl flex-col gap-12">
      <header className="border-b-2 border-ink pb-4">
        <h1 className="text-3xl font-semibold tracking-tight">로드맵</h1>
        <p className="mt-2 text-mute">구글 → NAS 전환과 포털 기능을 어떤 순서로 만들지.</p>
      </header>

      <section aria-labelledby="infra-h" className="flex flex-col gap-4">
        <h2 id="infra-h" className="text-xl font-semibold">
          전환 단계
        </h2>
        <ol className="grid grid-cols-1 pt-px pl-px md:grid-cols-2">
          {INFRA_STEPS.map((s, i) => (
            <li key={s.title} className="-mt-px -ml-px flex flex-col gap-2 border border-ink p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">
                  {String(i).padStart(2, "0")} {s.title}
                </span>
                <span className="text-xs text-mute tabular-nums">{s.when}</span>
              </div>
              <ul className="list-disc pl-5 text-sm">
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="portal-h" className="flex flex-col gap-6">
        <h2 id="portal-h" className="text-xl font-semibold">
          포털 기능 단계
        </h2>
        {STAGES.map((st) => (
          <div key={st} className="flex flex-col gap-2">
            <h3 className="text-sm text-mute">{STAGE_TITLE[st]}</h3>
            <ul className="divide-y divide-rule border-y border-ink">
              {MODULES.filter((m) => m.stage === st).map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/${m.slug}`}
                    className="grid grid-cols-[10rem_1fr_auto] items-center gap-4 py-2 hover:bg-[#f2f2f0]"
                  >
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-sm text-mute">{m.summary}</span>
                    <StatusBadge status={m.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
