// 주차장 경사로 계산 — 결정론 코드. 수치는 data/regulations/parking-ramp.json 에서만 읽는다.
import RULES from "@/data/regulations/parking-ramp.json";

export type RampShape = "straight" | "curved";

export interface RampInput {
  /** 오를 높이 (m) — 아래층 바닥에서 위층(또는 도로) 바닥까지 */
  rise: number;
  shape: RampShape;
  /** 2 = 한 경사로에 2차로 */
  lanes: 1 | 2;
  /** 1차로 경사로를 진입·진출로 따로 둔다 */
  split: boolean;
  /** 같은 경사로를 쓰는 주차장 전체 주차대수 */
  spaces: number;
  /** 도로와 바로 접하는 오르막 경사로 */
  roadside: boolean;
  /** 본 구간 설계 경사 (%) */
  slope: number;
  /** 곡선형 내변반경 (m) */
  innerRadius: number;
  /** 곡선 경사를 재는 선 */
  reference: "center" | "inner";
  /** 경사로 위 유효높이 (m) — 비우면 검토만 안내 */
  clearHeight?: number;
}

export type SegmentKind = "concave" | "main" | "convex" | "road";

export interface Segment {
  kind: SegmentKind;
  /** 수평 길이 (m) — 곡선형은 측정선을 따라 잰 길이 */
  length: number;
  /** % */
  slope: number;
  rise: number;
}

export interface Check {
  item: string;
  value: string;
  rule: string;
  basis: string;
  /** true 적합 · false 부적합 · null 안내 */
  ok: boolean | null;
}

export interface RampResult {
  input: RampInput;
  maxSlope: number;
  segments: Segment[];
  length: number;
  /** 완화구간·도로 접속 구간 없이 본 경사만으로 오를 때 */
  simpleLength: number;
  width: number;
  minInnerRadius: number;
  curve?: {
    rIn: number;
    rCenter: number;
    rOut: number;
    rRef: number;
    /** 측정선 기준 회전각 (도) */
    angle: number;
    turns: number;
    /** 본 구간의 내측·중심·외측 경사 (%) */
    slopeAt: { inner: number; center: number; outer: number };
  };
  checks: Check[];
  warnings: string[];
}

const R = RULES;
const round = (v: number, d = 3) => Math.round(v * 10 ** d) / 10 ** d;

export const ramp = {
  maxSlope: (s: RampShape) => R.slopeMax[s],
  laneWidth: (s: RampShape, lanes: 1 | 2) => R.laneWidth[s][String(lanes) as "1" | "2"],
  minInnerRadius: (spaces: number) => (spaces <= R.innerRadius.smallMaxSpaces ? R.innerRadius.small : R.innerRadius.normal),
};

export function defaultInput(shape: RampShape = "straight"): RampInput {
  return {
    rise: 4.5,
    shape,
    lanes: 1,
    split: false,
    spaces: 60,
    roadside: true,
    slope: R.slopeMax[shape],
    innerRadius: R.innerRadius.normal,
    reference: "center",
  };
}

export function calcRamp(input: RampInput): RampResult {
  const { shape, spaces, roadside } = input;
  const maxSlope = R.slopeMax[shape];
  const half = maxSlope * R.transition.slopeRatio;
  const s = Math.min(Math.max(input.slope, 0.1), 100);
  const warnings: string[] = [];

  // 경사 변화가 기준(직선 8.5% / 곡선 7%) 이상이면 볼록·오목 부분이 생긴다
  const breaks = s >= R.transition.changeThreshold[shape];
  const needConvex = spaces >= R.transition.convex.fromSpaces && breaks;
  const needConcave = spaces >= R.transition.concave.fromSpaces && breaks;
  const tSlope = Math.min(s * R.transition.slopeRatio, half);

  const segs: Segment[] = [];
  if (needConcave) segs.push({ kind: "concave", length: R.transition.concave.length, slope: tSlope, rise: 0 });
  segs.push({ kind: "main", length: 0, slope: s, rise: 0 });
  if (roadside) {
    // 도로 접속 3m 구간이 위쪽 볼록 완화구간도 겸한다 (1.7m 이상, 1/2 이하 경사)
    const rs = Math.min(s, R.roadside[shape], needConvex ? tSlope : R.roadside[shape]);
    segs.push({ kind: "road", length: R.roadside.within, slope: rs, rise: 0 });
  } else if (needConvex) {
    segs.push({ kind: "convex", length: R.transition.convex.length, slope: tSlope, rise: 0 });
  }

  // 본 구간 길이는 남은 높이로 정한다
  const fixedRise = segs.filter((g) => g.kind !== "main").reduce((t, g) => t + (g.length * g.slope) / 100, 0);
  const restRise = input.rise - fixedRise;
  const main = segs.find((g) => g.kind === "main")!;
  if (restRise <= 0) {
    warnings.push("오를 높이가 낮아 완화·도로 접속 구간만으로 다 오른다. 구간 길이를 따로 조정해 검토한다.");
    main.length = 0;
  } else {
    main.length = (restRise / s) * 100;
  }
  segs.forEach((g) => {
    g.rise = (g.length * g.slope) / 100;
    g.length = round(g.length);
    g.rise = round(g.rise);
  });
  const length = round(segs.reduce((t, g) => t + g.length, 0));
  const simpleLength = round((input.rise / s) * 100);

  const width = ramp.laneWidth(shape, input.lanes);
  const minInnerRadius = ramp.minInnerRadius(spaces);

  let curve: RampResult["curve"];
  if (shape === "curved") {
    const rIn = input.innerRadius;
    const rCenter = rIn + width / 2;
    const rOut = rIn + width;
    const rRef = input.reference === "inner" ? rIn : rCenter;
    const angle = (length / rRef) * (180 / Math.PI);
    // 같은 높이를 같은 각도에서 오르므로 경사는 반경에 반비례한다
    const at = (r: number) => round((s * rRef) / r, 2);
    curve = { rIn, rCenter, rOut, rRef, angle: round(angle, 1), turns: round(angle / 360, 2), slopeAt: { inner: at(rIn), center: at(rCenter), outer: at(rOut) } };
  }

  const pct = (v: number) => `${round(v, 2)}%`;
  const checks: Check[] = [
    {
      item: "종단경사 (본 구간)",
      value: pct(s),
      rule: `${shape === "straight" ? "직선" : "곡선"} ${maxSlope}% 이하`,
      basis: R.slopeMax.basis,
      ok: s <= maxSlope,
    },
  ];
  if (curve) {
    checks.push({
      item: "종단경사 (내측)",
      value: pct(curve.slopeAt.inner),
      rule: `측정선이 정해져 있지 않음 — 내측 기준이면 ${maxSlope}% 이하`,
      basis: "해석 — 확인 필요",
      ok: curve.slopeAt.inner <= maxSlope ? true : input.reference === "inner" ? false : null,
    });
    checks.push({
      item: "내변반경",
      value: `${input.innerRadius}m`,
      rule: `${minInnerRadius}m 이상 (주차대수 ${spaces <= R.innerRadius.smallMaxSpaces ? "50대 이하" : "50대 초과"})`,
      basis: R.innerRadius.basis,
      ok: input.innerRadius >= minInnerRadius,
    });
  }
  checks.push({
    item: "차로 너비",
    value: `${width}m${input.lanes === 2 ? " (2차로)" : ""}`,
    rule: `${shape === "straight" ? "직선" : "곡선"} ${input.lanes === 2 ? "2차로" : "1차로"} ${width}m 이상 — 연석 포함`,
    basis: R.laneWidth.basis,
    ok: true,
  });
  checks.push({
    item: "연석",
    value: "양쪽",
    rule: `벽면에서 ${R.curb.offsetFromWall * 100}cm 이상 지점, 높이 ${R.curb.heightMin * 100}~${R.curb.heightMax * 100}cm`,
    basis: R.curb.basis,
    ok: null,
  });
  if (roadside) {
    const road = segs.find((g) => g.kind === "road")!;
    checks.push({
      item: "도로 접속부 경사",
      value: `${pct(road.slope)} × ${R.roadside.within}m`,
      rule: `도로에서 ${R.roadside.within}m 이내 오르막 ${R.roadside[shape]}% 이하`,
      basis: R.roadside.basis,
      ok: road.slope <= R.roadside[shape],
    });
  }
  if (spaces >= R.largeLot.minSpaces) {
    const ok = input.lanes === 2 || input.split;
    checks.push({
      item: "2차로 또는 진입·진출 분리",
      value: input.lanes === 2 ? "2차로" : input.split ? "분리" : "1차로 하나",
      rule: `주차대수 ${R.largeLot.minSpaces}대 이상 — 너비 ${R.largeLot.twoLaneWidth}m 이상 2차로 또는 분리`,
      basis: R.largeLot.basis,
      ok,
    });
    if (!ok) warnings.push(`주차대수 ${R.largeLot.minSpaces}대 이상이면 2차로(6m 이상)로 하거나 진입·진출 경사로를 나눠야 한다.`);
  }
  if (needConvex || needConcave) {
    checks.push({
      item: "완화구간",
      value: [needConcave && `오목 ${R.transition.concave.length}m`, needConvex && `볼록 ${R.transition.convex.length}m${roadside ? " (도로 접속 3m가 겸함)" : ""}`].filter(Boolean).join(" · "),
      rule: `${spaces >= R.transition.concave.fromSpaces ? "100대 이상: 볼록 1.7m + 오목 2m" : "50~99대: 볼록 1.7m"}, 경사 ${half}% 이하`,
      basis: R.transition.basis,
      ok: true,
    });
  } else if (spaces >= R.transition.convex.fromSpaces) {
    checks.push({ item: "완화구간", value: "불필요", rule: `경사 변화가 ${R.transition.changeThreshold[shape]}% 미만`, basis: R.transition.basis, ok: true });
  }
  checks.push({
    item: "차로 유효높이",
    value: input.clearHeight ? `${input.clearHeight}m` : "입력 안 함",
    rule: `주차바닥면에서 ${R.clearHeight.lane}m 이상`,
    basis: R.clearHeight.basis,
    ok: input.clearHeight ? input.clearHeight >= R.clearHeight.lane : null,
  });
  checks.push({ item: "노면", value: "—", rule: "거친 면으로 마감", basis: "제6조제1항제5호마목", ok: null });

  if (s > maxSlope) warnings.push(`본 구간 경사 ${s}%가 법정 상한 ${maxSlope}%를 넘는다.`);
  if (curve && input.innerRadius < minInnerRadius) warnings.push(`내변반경이 ${minInnerRadius}m보다 작다.`);

  return { input, maxSlope, segments: segs, length, simpleLength, width, minInnerRadius, curve, checks, warnings };
}

export const SEGMENT_LABEL: Record<SegmentKind, string> = {
  concave: "오목 완화",
  main: "본 경사",
  convex: "볼록 완화",
  road: "도로 접속",
};
