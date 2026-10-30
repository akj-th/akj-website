import { ExternalLink, Shapes, Terminal } from "lucide-react";
import type { Metadata } from "next";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "AAD System" };

// AAD System 저장소(akj-th/aad_system) README 기준, 2026-08~10
const MODULES = [
  ["대지", "주소 검색, 연속지적도 필지 선택·합필, 공부면적"],
  ["법규", "용도지역 조회, 건폐율·용적률, 주차 대수, 정북일조 — 결정론 계산"],
  ["사업성", "공시지가 기반 토지비, 비용·수입, ROI·NPV·IRR"],
  ["매스·조닝", "규칙 기반 대안 3종, 층별 용도 배분, 지하 주차층"],
  ["3D 뷰·렌더", "브이월드 3D 위에 매스·glb 배치, 2패스 캡처, AI 리터칭"],
  ["도면·리포트", "필요 도서 목록, 면적표·주차계획표, IFC 넘기기, HTML 리포트"],
];

export default function Page() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="AAD System" sub="대지·법규·사업성·매스를 하나의 프로젝트 상태로 잇는 사내 설계 앱" actions={<Badge tone="info">개발 중 · 별도 앱</Badge>} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="모듈" sub="노드 캔버스로 연결" />
          <ul className="grid grid-cols-1 divide-y divide-line md:grid-cols-2 md:divide-y-0">
            {MODULES.map(([name, desc], i) => (
              <li key={name} className={`flex gap-3 px-4 py-3.5 ${i >= 2 ? "md:border-t md:border-line" : ""}`}>
                <span className="w-6 text-sm text-stone tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-sm text-mute">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="열기" />
            <div className="flex flex-col gap-3 px-4 py-4 text-sm">
              <span className="flex h-10 cursor-not-allowed items-center justify-center gap-2 bg-ink/40 text-paper">
                <ExternalLink size={15} /> AAD 열기 — NAS 이전 후
              </span>
              <p className="text-mute">지금은 개발 PC에서만 돈다. 서버를 NAS로 옮기면 이 버튼이 포털 로그인 그대로 AAD를 연다.</p>
            </div>
          </Card>
          <Card>
            <CardHeader title="라이노에서" />
            <div className="flex flex-col gap-2 px-4 py-4 text-sm">
              <span className="flex items-center gap-2 bg-surface px-3 py-2 font-mono text-xs">
                <Terminal size={13} /> AAD
              </span>
              <p className="text-mute">명령행에 AAD → 주소 입력 → 지형·항공사진·필지·주변 건물을 3dm으로 가져온다. NAS 이전 후에는 모든 PC가 같은 서버를 쓴다.</p>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="원칙" />
        <ul className="grid grid-cols-1 gap-px bg-line md:grid-cols-3">
          {[
            ["계산은 코드, 판단은 AI", "법규·면적·사업성 숫자는 결정론 코드가 내고 AI를 부르지 않는다"],
            ["근거 없는 숫자 없음", "조회·계산 값마다 조문·출처를 남기고 리포트에 같이 적는다"],
            ["최종 확인은 건축사", "모든 결과는 참고용 검토다"],
          ].map(([t, d]) => (
            <li key={t} className="flex flex-col gap-1 bg-paper px-4 py-4">
              <Shapes size={16} className="text-mute" />
              <span className="text-sm font-medium">{t}</span>
              <span className="text-sm text-mute">{d}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
