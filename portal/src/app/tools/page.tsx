import { ArrowRight, Calculator, Ruler, Route, Table2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "건축 계산기" };

const TOOLS = [
  {
    href: "/tools/ramp",
    icon: Route,
    name: "주차장 램프 계산기",
    desc: "층고와 경사로 형식으로 법정 최소 길이·폭·곡선 반경·완화구간을 구하고, 단면·평면을 DXF로 내보낸다.",
    ready: true,
    basis: "주차장법 시행규칙 제6조, 별표 1",
  },
  {
    href: "",
    icon: Table2,
    name: "면적표 정리",
    desc: "층별·용도별 면적을 붙여 넣으면 건축개요 면적표 양식으로 정리한다.",
    ready: false,
    basis: "건축법 시행령 제119조",
  },
  {
    href: "/aad",
    icon: Ruler,
    name: "건폐율·용적률 개략 검토",
    desc: "주소로 용도지역을 찾고 법정 상한과 비교한다 — AAD System의 법규 모듈을 쓴다.",
    ready: true,
    basis: "국토계획법 시행령 제84·85조, 지자체 조례",
  },
];

export default function Page() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="건축 계산기" sub="법규 수치는 데이터 파일로 두고, 결과마다 근거 조문을 같이 적는다" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map((t) => {
          const body = (
            <>
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center bg-ink text-paper">
                  <t.icon size={20} />
                </span>
                {t.ready ? <Badge tone="ok">사용 가능</Badge> : <Badge>준비 중</Badge>}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium">{t.name}</span>
                <span className="text-sm text-mute">{t.desc}</span>
              </div>
              <span className="mt-auto flex items-center justify-between text-xs text-stone">
                {t.basis}
                {t.href && <ArrowRight size={14} className="text-ink" />}
              </span>
            </>
          );
          return t.href ? (
            <Link key={t.name} href={t.href} className="flex min-h-48 flex-col gap-4 border border-line bg-paper p-5 hover:border-ink">
              {body}
            </Link>
          ) : (
            <div key={t.name} className="flex min-h-48 flex-col gap-4 border border-line bg-paper p-5 opacity-70">
              {body}
            </div>
          );
        })}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-mute">
        <Calculator size={13} /> 계산 결과는 참고용 검토다. 최종 확인은 담당 건축사가 한다.
      </p>
    </div>
  );
}
