"use client";

import { Check, Copy, Download, Info, TriangleAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import RULES from "@/data/regulations/parking-ramp.json";
import { calcRamp, defaultInput, ramp, SEGMENT_LABEL, type RampInput, type RampResult } from "@/lib/ramp/calc";
import { rampDxf, rampSummary } from "@/lib/ramp/dxf";
import { useToast } from "@/lib/store";
import { Field, inputCls } from "@/components/overlay";
import { Badge, Button, Card, CardHeader, PageHeader } from "@/components/ui";

const n2 = (v: number) => v.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Num({ value, onChange, step = 0.1, min = 0, suffix }: { value: number; onChange: (v: number) => void; step?: number; min?: number; suffix?: string }) {
  return (
    <div className="flex items-center">
      <input
        type="number"
        inputMode="decimal"
        className={`${inputCls} text-right tabular-nums`}
        value={Number.isFinite(value) ? value : ""}
        step={step}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {suffix && <span className="w-10 shrink-0 pl-2 text-sm text-mute">{suffix}</span>}
    </div>
  );
}

function Seg<T extends string | number>({ items, value, onChange }: { items: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex border border-line" role="group">
      {items.map(([v, label]) => (
        <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={`h-9 flex-1 text-sm ${value === v ? "bg-ink text-paper" : "bg-paper hover:bg-surface"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

const SEG_STROKE: Record<string, string> = { main: "#000", concave: "#2f55c4", convex: "#2f55c4", road: "#a2650f" };

/** 단면 — 실제 비례 */
function Section({ r }: { r: RampResult }) {
  const L = r.length || 1;
  const H = r.input.rise;
  const pad = 3;
  const W = L + pad * 2;
  // 글자·여백은 도면 폭에 비례 — 화면에서 늘 비슷한 크기로 보인다
  const k = W / 55;
  const vb = `${-pad} ${-H - 2.4 * k} ${W} ${H + 6 * k}`;
  let x = 0;
  let y = 0;
  return (
    <svg viewBox={vb} className="h-auto w-full" role="img" aria-label="경사로 단면">
      <g strokeLinecap="square">
        <line x1={-pad} y1={0} x2={0} y2={0} stroke="#9a9a96" strokeWidth={0.12 * k} />
        <line x1={L} y1={-H} x2={L + pad} y2={-H} stroke="#9a9a96" strokeWidth={0.12 * k} />
        <line x1={-0.6} y1={0} x2={-0.6} y2={-H} stroke="#9a9a96" strokeWidth={0.05 * k} />
        <text x={-0.9} y={-H / 2} fontSize={k} textAnchor="end" dominantBaseline="middle" fill="#6b6b67">
          {H}m
        </text>
        {r.segments.map((s, i) => {
          const x0 = x;
          const y0 = y;
          x += s.length;
          y += s.rise;
          if (s.length <= 0) return null;
          const mx = (x0 + x) / 2;
          const my = -(y0 + y) / 2;
          return (
            <g key={i}>
              <line x1={x0} y1={-y0} x2={x} y2={-y} stroke={SEG_STROKE[s.kind]} strokeWidth={0.2 * k} />
              <line x1={x} y1={-y - 0.5 * k} x2={x} y2={-y + 0.5 * k} stroke="#9a9a96" strokeWidth={0.05 * k} />
              <text x={mx} y={my - 0.6 * k} fontSize={k} textAnchor="middle" fill={SEG_STROKE[s.kind]}>
                {s.slope.toFixed(1)}%
              </text>
              <text x={mx} y={my + 1.4 * k} fontSize={0.85 * k} textAnchor="middle" fill="#6b6b67">
                {s.length.toFixed(2)}m
              </text>
            </g>
          );
        })}
        <line x1={0} y1={1.6 * k} x2={L} y2={1.6 * k} stroke="#000" strokeWidth={0.05 * k} />
        <text x={L / 2} y={2.9 * k} fontSize={k} textAnchor="middle">
          {r.input.shape === "curved" ? "측정선 길이" : "수평 길이"} {n2(L)}m
        </text>
      </g>
    </svg>
  );
}

function Plan({ r }: { r: RampResult }) {
  const W = r.width;
  if (r.input.shape === "straight" || !r.curve) {
    const L = r.length || 1;
    const k = (L + 2) / 55;
    let x = 0;
    return (
      <svg viewBox={`-1 -1.2 ${L + 2} ${W + 1.4 + 2.4 * k}`} className="h-auto w-full" role="img" aria-label="경사로 평면">
        <rect x={0} y={0} width={L} height={W} fill="#f6f6f4" stroke="#000" strokeWidth={0.06} />
        <line x1={0} y1={0.3} x2={L} y2={0.3} stroke="#1f7a4d" strokeWidth={0.03} />
        <line x1={0} y1={W - 0.3} x2={L} y2={W - 0.3} stroke="#1f7a4d" strokeWidth={0.03} />
        {r.segments.map((s, i) => {
          x += s.length;
          return x < L ? <line key={i} x1={x} y1={0} x2={x} y2={W} stroke="#9a9a96" strokeWidth={0.03} strokeDasharray="0.15 0.1" /> : null;
        })}
        <path d={`M ${L * 0.25} ${W / 2} H ${L * 0.75} m -0.6 -0.35 l 0.6 0.35 l -0.6 0.35`} fill="none" stroke="#000" strokeWidth={0.05} />
        <text x={L * 0.25} y={W / 2 - 0.35} fontSize={k}>
          오르막
        </text>
        <text x={0} y={W + 0.4 + 1.4 * k} fontSize={k} fill="#6b6b67">
          폭 {W}m (연석 포함) · 연석 벽면에서 30cm
        </text>
      </svg>
    );
  }
  const c = r.curve;
  const ro = c.rOut;
  const full = c.angle >= 360;
  const pt = (rad: number, deg: number) => {
    const t = (-deg * Math.PI) / 180;
    return [Math.cos(t) * rad, Math.sin(t) * rad];
  };
  const arc = (rad: number) => {
    if (full) return <circle cx={0} cy={0} r={rad} />;
    const [x0, y0] = pt(rad, 0);
    const [x1, y1] = pt(rad, c.angle);
    return <path d={`M ${x0} ${y0} A ${rad} ${rad} 0 ${c.angle > 180 ? 1 : 0} 0 ${x1} ${y1}`} />;
  };
  return (
    <svg viewBox={`${-ro - 1} ${-ro - 1} ${ro * 2 + 2} ${ro * 2 + 2 + 2.6 * ((ro * 2) / 26)}`} className="mx-auto h-auto w-full max-w-md" role="img" aria-label="곡선 경사로 평면">
      <g fill="none" stroke="#000" strokeWidth={0.07}>
        {arc(c.rIn)}
        {arc(c.rOut)}
      </g>
      <g fill="none" stroke="#1f7a4d" strokeWidth={0.03}>
        {arc(c.rIn + 0.3)}
        {arc(c.rOut - 0.3)}
      </g>
      <g fill="none" stroke="#b4322a" strokeWidth={0.03} strokeDasharray="0.2 0.12">
        {arc(c.rRef)}
      </g>
      {[0, full ? null : c.angle].map((a, i) =>
        a === null ? null : (
          <line key={i} x1={pt(c.rIn, a)[0]} y1={pt(c.rIn, a)[1]} x2={pt(c.rOut, a)[0]} y2={pt(c.rOut, a)[1]} stroke="#000" strokeWidth={0.07} />
        ),
      )}
      <circle cx={0} cy={0} r={0.12} fill="#000" />
      <text x={0} y={ro + 1 + 1.6 * ((ro * 2) / 26)} fontSize={(ro * 2) / 26} textAnchor="middle" fill="#6b6b67">
        {c.angle}° ({c.turns}바퀴) · 내변 {c.rIn}m · 외변 {n2(c.rOut)}m
      </text>
    </svg>
  );
}

export default function RampCalculator() {
  const [inp, setInp] = useState<RampInput>(defaultInput());
  const toast = useToast((s) => s.push);
  const r = useMemo(() => calcRamp(inp), [inp]);
  const set = <K extends keyof RampInput>(k: K, v: RampInput[K]) => setInp((p) => ({ ...p, [k]: v }));

  const changeShape = (shape: RampInput["shape"]) =>
    setInp((p) => ({ ...p, shape, slope: Math.min(p.slope === ramp.maxSlope(p.shape) ? ramp.maxSlope(shape) : p.slope, ramp.maxSlope(shape)), innerRadius: Math.max(p.innerRadius, ramp.minInnerRadius(p.spaces)) }));

  const download = () => {
    const blob = new Blob([rampDxf(r)], { type: "application/dxf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `RAMP_${inp.shape === "straight" ? "STRAIGHT" : "CURVED"}_H${Math.round(inp.rise * 1000)}_S${String(inp.slope).replace(".", "p")}.dxf`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("DXF를 내려받았습니다 (mm 단위)");
  };

  const bad = r.checks.filter((c) => c.ok === false);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[{ href: "/tools", label: "건축 계산기" }]}
        title="주차장 램프 계산기"
        sub={`${RULES.source} · ${RULES.version} · ${RULES.checkedAt} 확인`}
        actions={
          <>
            <Button onClick={() => navigator.clipboard.writeText(rampSummary(r)).then(() => toast("결과를 복사했습니다"))}>
              <Copy size={15} /> 결과 복사
            </Button>
            <Button variant="primary" onClick={download}>
              <Download size={15} /> DXF 내려받기
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardHeader title="조건" />
          <div className="flex flex-col gap-4 px-4 py-4">
            <Field label="경사로 형식">
              <Seg
                items={[
                  ["straight", "직선형"],
                  ["curved", "곡선형"],
                ]}
                value={inp.shape}
                onChange={changeShape}
              />
            </Field>
            <Field label="오를 높이 (층고차)" hint="아래층 바닥 → 위층 바닥(또는 도로면)">
              <Num value={inp.rise} onChange={(v) => set("rise", v)} step={0.05} suffix="m" />
            </Field>
            <Field label={`본 구간 경사 — 상한 ${ramp.maxSlope(inp.shape)}%`}>
              <Num value={inp.slope} onChange={(v) => set("slope", v)} step={0.5} suffix="%" />
            </Field>
            <Field label="같은 경사로를 쓰는 주차대수" hint="50대 이상: 2차로·완화구간 / 100대 이상: 오목 완화 추가 / 50대 이하: 내변반경 5m">
              <Num value={inp.spaces} onChange={(v) => setInp((p) => ({ ...p, spaces: Math.round(v), innerRadius: Math.max(p.innerRadius, ramp.minInnerRadius(Math.round(v))) }))} step={1} suffix="대" />
            </Field>
            <Field label="차로">
              <Seg
                items={[
                  [1, `1차로 ${ramp.laneWidth(inp.shape, 1)}m`],
                  [2, `2차로 ${ramp.laneWidth(inp.shape, 2)}m`],
                ]}
                value={inp.lanes}
                onChange={(v) => set("lanes", v)}
              />
            </Field>
            {inp.lanes === 1 && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={inp.split} onChange={(e) => set("split", e.target.checked)} /> 진입·진출 경사로를 따로 둔다
              </label>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={inp.roadside} onChange={(e) => set("roadside", e.target.checked)} /> 위쪽 끝이 도로와 바로 접한다
            </label>
            {inp.shape === "curved" && (
              <>
                <Field label={`내변반경 — 최소 ${ramp.minInnerRadius(inp.spaces)}m`}>
                  <Num value={inp.innerRadius} onChange={(v) => set("innerRadius", v)} step={0.5} suffix="m" />
                </Field>
                <Field label="경사 측정선" hint="법에 정해져 있지 않다 — 심의·지자체 요구를 확인">
                  <Seg
                    items={[
                      ["center", "차로 중심"],
                      ["inner", "내측 (보수적)"],
                    ]}
                    value={inp.reference}
                    onChange={(v) => set("reference", v)}
                  />
                </Field>
              </>
            )}
            <Field label="경사로 위 유효높이 (선택)" hint="보·설비 하단까지">
              <Num value={inp.clearHeight ?? NaN} onChange={(v) => set("clearHeight", v || undefined)} step={0.05} suffix="m" />
            </Field>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="flex flex-col gap-1 border border-ink bg-ink px-4 py-3 text-paper">
              <span className="text-xs text-paper/70">총 길이</span>
              <span className="text-3xl font-semibold tabular-nums">{n2(r.length)}m</span>
              <span className="text-xs text-paper/70 tabular-nums">본 경사만이면 {n2(r.simpleLength)}m</span>
            </div>
            <div className="flex flex-col gap-1 border border-line bg-paper px-4 py-3">
              <span className="text-xs text-mute">본 구간 경사</span>
              <span className="text-3xl font-semibold tabular-nums">{inp.slope}%</span>
              <span className="text-xs text-mute">상한 {r.maxSlope}%</span>
            </div>
            <div className="flex flex-col gap-1 border border-line bg-paper px-4 py-3">
              <span className="text-xs text-mute">차로 너비</span>
              <span className="text-3xl font-semibold tabular-nums">{r.width}m</span>
              <span className="text-xs text-mute">연석 포함</span>
            </div>
            <div className="flex flex-col gap-1 border border-line bg-paper px-4 py-3">
              <span className="text-xs text-mute">{r.curve ? "회전각" : "구간 수"}</span>
              <span className="text-3xl font-semibold tabular-nums">{r.curve ? `${r.curve.angle}°` : r.segments.filter((s) => s.length > 0).length}</span>
              <span className="text-xs text-mute">{r.curve ? `${r.curve.turns}바퀴 · 측정 반경 ${n2(r.curve.rRef)}m` : r.segments.map((s) => SEGMENT_LABEL[s.kind]).join(" → ")}</span>
            </div>
          </div>

          {r.warnings.length > 0 && (
            <div className="flex flex-col gap-1 border border-bad bg-bad-bg px-4 py-3 text-sm text-bad">
              {r.warnings.map((w) => (
                <span key={w} className="flex items-start gap-2">
                  <TriangleAlert size={15} className="mt-0.5 shrink-0" /> {w}
                </span>
              ))}
            </div>
          )}

          <Card>
            <CardHeader title="단면" sub="아래(왼쪽) → 위(오른쪽) · 실제 비례" action={<span className="flex gap-1.5"><Badge>본 경사</Badge><Badge tone="info">완화구간</Badge><Badge tone="warn">도로 접속</Badge></span>} />
            <div className="px-4 py-4">
              <Section r={r} />
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-mute">
                    <th className="py-1.5 font-medium">구간</th>
                    <th className="py-1.5 text-right font-medium">경사</th>
                    <th className="py-1.5 text-right font-medium">길이</th>
                    <th className="py-1.5 text-right font-medium">오르는 높이</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line tabular-nums">
                  {r.segments.map((s, i) => (
                    <tr key={i}>
                      <td className="py-1.5">{SEGMENT_LABEL[s.kind]}</td>
                      <td className="py-1.5 text-right">{s.slope.toFixed(2)}%</td>
                      <td className="py-1.5 text-right">{n2(s.length)}m</td>
                      <td className="py-1.5 text-right">{s.rise.toFixed(3)}m</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-1.5">합계</td>
                    <td />
                    <td className="py-1.5 text-right">{n2(r.length)}m</td>
                    <td className="py-1.5 text-right">{r.segments.reduce((t, s) => t + s.rise, 0).toFixed(3)}m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
            <Card>
              <CardHeader title="평면" sub={r.curve ? "회전 방향은 DXF에서 맞춘다" : undefined} />
              <div className="px-4 py-4">
                <Plan r={r} />
              </div>
            </Card>

            <Card>
              <CardHeader title="법규 검토" sub={bad.length ? `부적합 ${bad.length}` : "부적합 없음"} />
              <ul className="divide-y divide-line">
                {r.checks.map((c) => (
                  <li key={c.item} className="flex gap-3 px-4 py-2.5 text-sm">
                    <span className="mt-0.5 shrink-0">
                      {c.ok === true ? <Check size={15} className="text-ok" /> : c.ok === false ? <X size={15} className="text-bad" /> : <Info size={15} className="text-stone" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">{c.item}</span>
                        <span className="tabular-nums">{c.value}</span>
                      </span>
                      <span className="text-xs text-mute">{c.rule}</span>
                      <span className="text-[11px] text-stone">{c.basis}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <CardHeader title="해석과 한계" />
            <ul className="flex flex-col gap-1.5 px-4 py-3 text-sm text-mute">
              {RULES.interpretations.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 bg-stone" />
                  {t}
                </li>
              ))}
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 bg-stone" />
                적용 대상: {RULES.appliesTo}. 결과는 참고용 검토이며 최종 확인은 담당 건축사가 한다.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
