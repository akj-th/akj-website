"use client";

import {
  Box,
  Calculator,
  Clock,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Map,
  NotebookPen,
  Shapes,
  Signature,
  Stamp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { currentApprover } from "@/data/approvals";
import { ME } from "@/data/people";
import { GROUPS, modulesInGroup } from "@/lib/modules";
import { useDemo } from "@/lib/store";
import Logo from "./Logo";

const ICON: Record<string, LucideIcon> = {
  projects: FolderKanban,
  viewer: Box,
  minutes: NotebookPen,
  mail: Mail,
  aad: Shapes,
  tools: Calculator,
  approvals: Stamp,
  attendance: Clock,
  contracts: Signature,
  people: Users,
};

function Item({ href, icon: Icon, label, count }: { href: string; icon: LucideIcon; label: string; count?: number }) {
  const pathname = usePathname();
  const on = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`flex items-center gap-2.5 px-3 py-[7px] text-[13px] transition-colors ${
        on ? "bg-paper font-medium text-ink" : "text-[#d6d6d3] hover:bg-white/10 hover:text-paper"
      }`}
    >
      <Icon size={16} strokeWidth={1.75} />
      <span className="flex-1">{label}</span>
      {!!count && (
        <span className={`min-w-5 px-1 text-center text-[11px] leading-[18px] tabular-nums ${on ? "bg-ink text-paper" : "bg-paper text-ink"}`}>
          {count}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const approvals = useDemo((s) => s.approvals);
  const mailRead = useDemo((s) => s.mailRead);
  const counts: Record<string, number> = {
    approvals: approvals.filter((a) => a.status === "진행" && currentApprover(a) === ME).length,
    mail: Object.values(mailRead).filter((r) => !r).length,
  };

  return (
    <nav aria-label="포털 메뉴" className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2.5 px-4 pt-5 pb-6">
        <Logo className="h-7 w-7 fill-paper" />
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-paper">ATELIER KJ</span>
          <span className="text-[11px] text-stone">사내 포털</span>
        </span>
      </Link>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-4">
        <div className="flex flex-col">
          <Item href="/" icon={LayoutDashboard} label="대시보드" />
        </div>
        {GROUPS.map((g) => (
          <div key={g.id} className="flex flex-col">
            <span className="px-4 pb-1.5 text-[11px] text-stone">{g.name}</span>
            {modulesInGroup(g.id).map((m) => (
              <Item key={m.slug} href={`/${m.slug}`} icon={ICON[m.slug] ?? Box} label={m.name} count={counts[m.slug]} />
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-white/15 py-2">
        <Item href="/roadmap" icon={Map} label="로드맵" />
      </div>
    </nav>
  );
}
