"use client";

import { Lock, Mail, Phone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PEOPLE, PRESENCE_LABEL, person, type PresenceStatus, type Role } from "@/data/people";
import { PROJECTS } from "@/data/projects";
import { fmtDate } from "@/lib/format";
import { MODULES } from "@/lib/modules";
import { useToast } from "@/lib/store";
import { Drawer } from "@/components/overlay";
import { Avatar, Badge, Card, Dot, PageHeader, ProjectChip, Progress, type Tone } from "@/components/ui";

const PRESENCE_TONE: Record<PresenceStatus, Tone> = { office: "ok", remote: "info", field: "warn", leave: "neutral" };
const ROLE_LABEL: Record<Role, string> = { admin: "관리자", manager: "팀장", member: "구성원" };
const OFFICE = new Set(["approvals", "attendance", "contracts", "people"]);

/** 역할별 기본 권한 — 데모. 실제 권한은 NAS 계정 그룹과 맞춘다 */
function defaultPerm(role: Role, slug: string): { view: boolean; edit: boolean } {
  if (role === "admin") return { view: true, edit: true };
  if (slug === "people" || slug === "contracts") return { view: role === "manager", edit: false };
  if (OFFICE.has(slug)) return { view: true, edit: role === "manager" };
  return { view: true, edit: true };
}

export default function PeopleView() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast((s) => s.push);
  const [team, setTeam] = useState("전체");
  const [openId, setOpenId] = useState<string | null>(null);
  const [perm, setPerm] = useState<Record<string, { view: boolean; edit: boolean }>>({});

  useEffect(() => {
    const id = params.get("id");
    if (id) setOpenId(id);
  }, [params]);

  const open = openId ? person(openId) : undefined;
  useEffect(() => {
    if (open) setPerm(Object.fromEntries(MODULES.map((m) => [m.slug, defaultPerm(open.role, m.slug)])));
  }, [open]);

  const teams = ["전체", ...new Set(PEOPLE.map((p) => p.team))];
  const list = PEOPLE.filter((p) => team === "전체" || p.team === team);
  const close = () => {
    setOpenId(null);
    if (params.get("id")) router.replace("/people");
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="인사" sub={`${PEOPLE.length}명 · 데모 직원 (실제 인물 아님)`} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex border border-line bg-paper" role="group" aria-label="팀">
          {teams.map((t) => (
            <button key={t} type="button" aria-pressed={team === t} onClick={() => setTeam(t)} className={`h-9 px-3 text-sm ${team === t ? "bg-ink text-paper" : "hover:bg-surface"}`}>
              {t}
            </button>
          ))}
        </div>
        <span className="ml-auto flex flex-wrap gap-3 text-xs text-mute">
          {(Object.keys(PRESENCE_LABEL) as PresenceStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <Dot tone={PRESENCE_TONE[s]} /> {PRESENCE_LABEL[s]} {PEOPLE.filter((p) => p.status === s).length}
            </span>
          ))}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((p) => (
          <button key={p.id} type="button" onClick={() => setOpenId(p.id)} className="flex flex-col gap-3 border border-line bg-paper p-4 text-left hover:border-ink">
            <div className="flex items-center gap-3">
              <Avatar id={p.id} size={44} />
              <div className="min-w-0">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-mute">
                  {p.team} · {p.title}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Dot tone={PRESENCE_TONE[p.status]} /> {PRESENCE_LABEL[p.status]}
              </span>
              <span className="text-mute">{p.email}</span>
            </div>
          </button>
        ))}
      </div>

      <Drawer open={!!open} onClose={close} title={open && `${open.name} ${open.title}`} width={560}>
        {open && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar id={open.id} size={56} />
              <div className="flex flex-col gap-1 text-sm">
                <span className="flex items-center gap-2">
                  {open.team} <Badge>{ROLE_LABEL[open.role]}</Badge>
                </span>
                <span className="flex items-center gap-1.5 text-mute">
                  <Mail size={13} /> {open.email}
                </span>
                <span className="flex items-center gap-1.5 text-mute">
                  <Phone size={13} /> {open.phone}
                </span>
                <span className="text-xs text-stone">입사 {fmtDate(open.joined)}</span>
              </div>
            </div>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-mute">연차</h3>
              <Progress value={(open.leaveUsed / open.leaveTotal) * 100} />
              <span className="text-sm tabular-nums">
                {open.leaveTotal}일 중 {open.leaveUsed}일 사용 · <b>{open.leaveTotal - open.leaveUsed}일</b> 남음
              </span>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-mute">참여 프로젝트</h3>
              <div className="flex flex-wrap gap-1.5">
                {PROJECTS.filter((p) => p.pm === open.id || p.team.includes(open.id)).map((p) => (
                  <span key={p.code} className="flex items-center gap-1.5 text-sm">
                    <ProjectChip code={p.code} />
                    {p.pm === open.id && <Badge tone="dark">PM</Badge>}
                  </span>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-mute">메뉴 권한 (데모)</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-mute">
                    <th className="py-1.5 text-left font-medium">메뉴</th>
                    <th className="w-16 py-1.5 font-medium">보기</th>
                    <th className="w-16 py-1.5 font-medium">편집</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {MODULES.map((m) => (
                    <tr key={m.slug}>
                      <td className="py-1.5">{m.name}</td>
                      {(["view", "edit"] as const).map((k) => (
                        <td key={k} className="py-1.5 text-center">
                          <input
                            type="checkbox"
                            aria-label={`${m.name} ${k === "view" ? "보기" : "편집"}`}
                            checked={perm[m.slug]?.[k] ?? false}
                            onChange={(e) => {
                              const v = e.target.checked;
                              setPerm((p) => ({ ...p, [m.slug]: { view: k === "view" ? v : v || p[m.slug].view, edit: k === "edit" ? v : v && p[m.slug].edit } }));
                              toast("데모 — 권한은 저장되지 않습니다");
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="flex flex-col gap-2 border border-dashed border-stone p-3">
              <h3 className="flex items-center gap-1.5 text-xs font-medium text-mute">
                <Lock size={13} /> 민감정보
              </h3>
              <dl className="grid grid-cols-[6rem_1fr] gap-y-1.5 text-sm">
                <dt className="text-mute">주민등록번호</dt>
                <dd className="tabular-nums">●●●●●●-●●●●●●●</dd>
                <dt className="text-mute">급여 계좌</dt>
                <dd>●●● ●●●●●●●●●●</dd>
              </dl>
              <p className="text-xs text-stone">3단계에서 암호화 보관·열람 기록과 함께 붙인다. 지금은 저장하지 않는다.</p>
            </section>
          </div>
        )}
      </Drawer>
    </div>
  );
}
