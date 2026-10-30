// 경사로 계산 결과 → DXF (R12, mm). 도면 안 글자는 영문·숫자만 — 한글 인코딩 문제를 피한다.
import { SEGMENT_LABEL, type RampResult } from "./calc";

const LAYERS: [string, number][] = [
  ["A-RAMP-SECT", 7],
  ["A-RAMP-FLOR", 8],
  ["A-RAMP", 7],
  ["A-RAMP-CURB", 3],
  ["A-RAMP-CENT", 1],
  ["A-RAMP-TEXT", 2],
];

const SEG_EN: Record<string, string> = { concave: "TRANS(CONCAVE)", main: "RAMP", convex: "TRANS(CONVEX)", road: "ROAD 3M" };

class Dxf {
  private out: string[] = [];
  private g(code: number, v: string | number) {
    this.out.push(String(code), typeof v === "number" ? String(Math.round(v * 1000) / 1000) : v);
  }
  line(layer: string, x1: number, y1: number, x2: number, y2: number) {
    this.g(0, "LINE");
    this.g(8, layer);
    this.g(10, x1);
    this.g(20, y1);
    this.g(30, 0);
    this.g(11, x2);
    this.g(21, y2);
    this.g(31, 0);
  }
  arc(layer: string, cx: number, cy: number, r: number, a0: number, a1: number) {
    this.g(0, "ARC");
    this.g(8, layer);
    this.g(10, cx);
    this.g(20, cy);
    this.g(30, 0);
    this.g(40, r);
    this.g(50, a0);
    this.g(51, a1);
  }
  circle(layer: string, cx: number, cy: number, r: number) {
    this.g(0, "CIRCLE");
    this.g(8, layer);
    this.g(10, cx);
    this.g(20, cy);
    this.g(30, 0);
    this.g(40, r);
  }
  text(x: number, y: number, h: number, s: string, rot = 0) {
    this.g(0, "TEXT");
    this.g(8, "A-RAMP-TEXT");
    this.g(10, x);
    this.g(20, y);
    this.g(30, 0);
    this.g(40, h);
    this.g(1, s);
    if (rot) this.g(50, rot);
  }
  toString() {
    const head: string[] = [];
    const h = (c: number, v: string | number) => head.push(String(c), String(v));
    h(0, "SECTION");
    h(2, "HEADER");
    h(9, "$ACADVER");
    h(1, "AC1009");
    h(0, "ENDSEC");
    h(0, "SECTION");
    h(2, "TABLES");
    h(0, "TABLE");
    h(2, "LTYPE");
    h(70, 1);
    h(0, "LTYPE");
    h(2, "CONTINUOUS");
    h(70, 0);
    h(3, "Solid line");
    h(72, 65);
    h(73, 0);
    h(40, 0);
    h(0, "ENDTAB");
    h(0, "TABLE");
    h(2, "LAYER");
    h(70, LAYERS.length);
    for (const [name, color] of LAYERS) {
      h(0, "LAYER");
      h(2, name);
      h(70, 0);
      h(62, color);
      h(6, "CONTINUOUS");
    }
    h(0, "ENDTAB");
    h(0, "ENDSEC");
    h(0, "SECTION");
    h(2, "ENTITIES");
    return [...head, ...this.out, "0", "ENDSEC", "0", "EOF", ""].join("\r\n");
  }
}

const mm = (m: number) => m * 1000;
const fmt = (v: number) => Math.round(v).toLocaleString("en-US");

export function rampDxf(r: RampResult): string {
  const d = new Dxf();
  const H = mm(r.input.rise);
  const L = mm(r.length);
  const TH = 250; // 글자 높이 (1:100 출력에서 2.5mm)

  // ── 단면 (원점 = 경사로 아래 시작점) ──
  d.line("A-RAMP-FLOR", -3000, 0, 0, 0);
  d.line("A-RAMP-FLOR", L, H, L + 3000, H);
  let x = 0;
  let y = 0;
  r.segments.forEach((s) => {
    const dx = mm(s.length);
    const dy = mm(s.rise);
    if (dx <= 0) return;
    d.line("A-RAMP-SECT", x, y, x + dx, y + dy);
    // 구간 경계 표시
    d.line("A-RAMP-CENT", x + dx, y + dy - 300, x + dx, y + dy + 300);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    d.text(x + dx * 0.15, y + dy * 0.15 + 350, TH * 0.8, `${SEG_EN[s.kind]} S=${s.slope.toFixed(2)}% L=${fmt(dx)}`, ang);
    x += dx;
    y += dy;
  });
  d.line("A-RAMP-CENT", -300, 0, -300, H);
  d.text(-1700, H / 2, TH, `H=${fmt(H)}`);
  d.text(0, -900, TH, `TOTAL L=${fmt(L)}  (${r.input.shape === "curved" ? "ALONG REF LINE" : "HORIZONTAL"})`);
  d.text(0, -1400, TH * 1.4, "RAMP SECTION");

  // ── 평면 (단면 아래) ──
  const W = mm(r.width);
  const curb = 300;
  if (r.input.shape === "straight") {
    const oy = -8000 - W;
    d.line("A-RAMP", 0, oy, L, oy);
    d.line("A-RAMP", 0, oy + W, L, oy + W);
    d.line("A-RAMP", 0, oy, 0, oy + W);
    d.line("A-RAMP", L, oy, L, oy + W);
    d.line("A-RAMP-CURB", 0, oy + curb, L, oy + curb);
    d.line("A-RAMP-CURB", 0, oy + W - curb, L, oy + W - curb);
    let px = 0;
    r.segments.forEach((s) => {
      px += mm(s.length);
      if (px < L) d.line("A-RAMP-CENT", px, oy, px, oy + W);
    });
    // 오르막 방향 화살표
    d.line("A-RAMP-CENT", L * 0.2, oy + W / 2, L * 0.8, oy + W / 2);
    d.line("A-RAMP-CENT", L * 0.8, oy + W / 2, L * 0.8 - 600, oy + W / 2 + 300);
    d.line("A-RAMP-CENT", L * 0.8, oy + W / 2, L * 0.8 - 600, oy + W / 2 - 300);
    d.text(L * 0.2, oy + W / 2 + 250, TH, "UP");
    d.text(0, oy - 600, TH, `W=${fmt(W)} (CURB INCL.)  CURB 300 FROM WALL, H=100~150`);
    d.text(0, oy - 1100, TH * 1.4, "RAMP PLAN");
  } else if (r.curve) {
    const c = r.curve;
    const cx = 0;
    const cy = -8000 - mm(c.rOut);
    const ang = c.angle;
    const draw = (layer: string, rad: number) => {
      if (ang >= 360) d.circle(layer, cx, cy, rad);
      else d.arc(layer, cx, cy, rad, 0, ang);
    };
    draw("A-RAMP", mm(c.rIn));
    draw("A-RAMP", mm(c.rOut));
    draw("A-RAMP-CURB", mm(c.rIn) + curb);
    draw("A-RAMP-CURB", mm(c.rOut) - curb);
    draw("A-RAMP-CENT", mm(c.rRef));
    const ray = (deg: number) => {
      const t = (deg * Math.PI) / 180;
      d.line("A-RAMP", cx + Math.cos(t) * mm(c.rIn), cy + Math.sin(t) * mm(c.rIn), cx + Math.cos(t) * mm(c.rOut), cy + Math.sin(t) * mm(c.rOut));
    };
    ray(0);
    if (ang < 360) ray(ang);
    d.text(cx - mm(c.rIn) * 0.5, cy, TH, `R_IN=${fmt(mm(c.rIn))}`);
    d.text(cx + mm(c.rOut) + 400, cy, TH, `R_OUT=${fmt(mm(c.rOut))}`);
    d.text(cx - mm(c.rOut), cy - mm(c.rOut) - 700, TH, `ANGLE=${c.angle} DEG (${c.turns} TURNS)  W=${fmt(W)}  REF=${r.input.reference === "inner" ? "INNER" : "CENTER"} R=${fmt(mm(c.rRef))}`);
    d.text(cx - mm(c.rOut), cy - mm(c.rOut) - 1300, TH * 1.4, "RAMP PLAN (START AT 0 DEG, UP COUNTER-CLOCKWISE)");
  }

  d.text(0, -3000, TH * 0.7, "AKJ PORTAL RAMP CALC - REFERENCE ONLY. PARKING ACT ENF. RULE ART.6(1)5, APPX 1");
  return d.toString();
}

export function rampSummary(r: RampResult): string {
  const lines = [
    `주차장 경사로 검토 — ${r.input.shape === "straight" ? "직선형" : "곡선형"} ${r.input.lanes === 2 ? "2차로" : "1차로"}`,
    `오를 높이 ${r.input.rise}m · 주차대수 ${r.input.spaces}대${r.input.roadside ? " · 도로 접속" : ""}`,
    `총 길이 ${r.length.toFixed(2)}m (본 경사만: ${r.simpleLength.toFixed(2)}m)`,
    ...r.segments.map((s) => `  ${SEGMENT_LABEL[s.kind]} ${s.slope.toFixed(2)}% × ${s.length.toFixed(2)}m (↑${s.rise.toFixed(3)}m)`),
    `차로 너비 ${r.width}m${r.curve ? ` · 내변반경 ${r.curve.rIn}m · 회전각 ${r.curve.angle}°` : ""}`,
    ...r.checks.map((c) => `- ${c.item}: ${c.value} / ${c.rule} [${c.basis}]${c.ok === false ? " ✗" : ""}`),
    "참고용 검토 — 최종 확인은 담당 건축사",
  ];
  return lines.join("\n");
}
