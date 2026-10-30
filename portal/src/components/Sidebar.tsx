"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GROUPS, modulesInGroup } from "@/lib/modules";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const on = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`block px-3 py-1.5 text-sm ${on ? "bg-paper text-ink" : "text-paper hover:bg-white/10"}`}
    >
      {children}
    </Link>
  );
}

export default function Sidebar() {
  return (
    <nav aria-label="포털 메뉴" className="flex flex-col gap-6 py-5">
      <div className="px-3">
        <Link href="/" className="block text-lg font-semibold tracking-tight text-paper">
          ATELIER KJ
        </Link>
        <span className="text-xs text-stone">사내 포털</span>
      </div>

      <div className="flex flex-col">
        <NavLink href="/">대시보드</NavLink>
        <NavLink href="/roadmap">로드맵</NavLink>
      </div>

      {GROUPS.map((g) => (
        <div key={g.id} className="flex flex-col">
          <span className="px-3 pb-1 text-xs text-stone">{g.name}</span>
          {modulesInGroup(g.id).map((m) => (
            <NavLink key={m.slug} href={`/${m.slug}`}>
              {m.name}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
