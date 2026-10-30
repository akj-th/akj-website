import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { GROUPS, modulesInGroup } from "@/lib/modules";
import { INFRA_STEPS } from "@/lib/roadmap";

export default function Dashboard() {
  const next = INFRA_STEPS[0];
  return (
    <div className="flex max-w-6xl flex-col gap-12">
      <header className="flex flex-col gap-2 border-b-2 border-ink pb-4">
        <h1 className="text-3xl font-semibold tracking-tight">사내 포털</h1>
        <p className="max-w-2xl text-mute">
          프로젝트 일이 이 안에서 굴러가게 만드는 사내 웹. 파일은 회사 NAS에 두고, 메일·회의록·결재를
          프로젝트 코드로 묶는다.
        </p>
      </header>

      {GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`g-${g.id}`} className="flex flex-col gap-3">
          <h2 id={`g-${g.id}`} className="text-sm text-mute">
            {g.name}
          </h2>
          {/* 칸마다 테두리를 두르고 1px씩 겹친다 — 줄이 덜 찬 자리에는 선이 생기지 않는다 */}
          <ul className="grid grid-cols-1 pt-px pl-px sm:grid-cols-2 lg:grid-cols-3">
            {modulesInGroup(g.id).map((m) => (
              <li key={m.slug} className="-mt-px -ml-px border border-ink">
                <Link href={`/${m.slug}`} className="flex h-full flex-col gap-3 p-4 hover:bg-[#f2f2f0]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-lg font-semibold">{m.name}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="text-sm text-mute">{m.summary}</p>
                  <span className="mt-auto text-xs text-stone">{m.stage}단계</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section aria-labelledby="next-h" className="flex flex-col gap-3 border-t border-ink pt-4">
        <div className="flex items-baseline justify-between">
          <h2 id="next-h" className="text-sm text-mute">
            지금 할 일 — {next.title}
          </h2>
          <Link href="/roadmap" className="text-sm underline underline-offset-4">
            전체 로드맵
          </Link>
        </div>
        <ul className="list-disc pl-5 text-sm">
          {next.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
