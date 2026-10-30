// 아직 만들지 않은 모듈의 자리 페이지.
// 모듈을 실제로 만들면 src/app/<slug>/page.tsx 가 이 페이지보다 우선한다.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { GROUPS, MODULES, getModule } from "@/lib/modules";

export const dynamicParams = false;

// 자기 페이지가 생긴 모듈은 자리 페이지를 만들지 않는다
const HAS_PAGE = new Set(["viewer"]);

export function generateStaticParams() {
  return MODULES.filter((m) => !HAS_PAGE.has(m.slug)).map((m) => ({ module: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[module]">): Promise<Metadata> {
  const { module } = await params;
  return { title: getModule(module)?.name };
}

export default async function ModulePage({ params }: PageProps<"/[module]">) {
  const { module } = await params;
  const m = getModule(module);
  if (!m) notFound();
  const group = GROUPS.find((g) => g.id === m.group)?.name;

  return (
    <article className="flex max-w-3xl flex-col gap-10">
      <header className="flex flex-col gap-3 border-b-2 border-ink pb-4">
        <span className="text-sm text-mute">
          {group} · {m.stage}단계
        </span>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{m.name}</h1>
          <StatusBadge status={m.status} />
        </div>
        <p className="text-lg">{m.summary}</p>
      </header>

      <section aria-labelledby="scope-h" className="flex flex-col gap-3">
        <h2 id="scope-h" className="text-sm text-mute">
          들어갈 기능
        </h2>
        <ul className="divide-y divide-rule border-y border-ink">
          {m.scope.map((s) => (
            <li key={s} className="py-2">
              {s}
            </li>
          ))}
        </ul>
      </section>

      {m.notes && m.notes.length > 0 && (
        <section aria-labelledby="notes-h" className="flex flex-col gap-3">
          <h2 id="notes-h" className="text-sm text-mute">
            정해 둔 원칙
          </h2>
          <ul className="list-disc pl-5">
            {m.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="border-t border-rule pt-4 text-sm text-mute">
        아직 틀만 있는 화면이다. 기능은 <Link href="/roadmap" className="underline underline-offset-4">로드맵</Link>{" "}
        순서대로 채운다.
      </p>
    </article>
  );
}
