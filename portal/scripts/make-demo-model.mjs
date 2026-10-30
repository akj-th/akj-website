// 데모 매스 모델 — 실제 프로젝트와 무관한 상자 몇 개. 뷰어 시연용.
// node scripts/make-demo-model.mjs → public/samples/demo-massing.3dm
import fs from "node:fs";
import rhino3dm from "rhino3dm";

const rhino = await rhino3dm();
const doc = new rhino.File3dm();
doc.settings().modelUnitSystem = rhino.UnitSystem.Meters;

function layer(name, color, parent) {
  const l = new rhino.Layer();
  l.name = name;
  l.color = { r: color[0], g: color[1], b: color[2], a: 255 };
  if (parent !== undefined) l.parentLayerId = doc.layers().get(parent).id;
  return doc.layers().add(l);
}

function box(x, y, z, w, d, h) {
  const m = new rhino.Mesh();
  const v = m.vertices();
  const pts = [
    [x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z],
    [x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h],
  ];
  // 면마다 꼭짓점을 따로 두어 모서리가 각지게 보이게 한다 (법선 공유 안 함)
  const f = m.faces();
  [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]].forEach((q, i) => {
    q.forEach((k) => v.add(...pts[k]));
    f.addQuadFace(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3);
  });
  m.normals().computeNormals();
  m.compact();
  return m;
}

function add(geo, layerIndex) {
  const a = new rhino.ObjectAttributes();
  a.layerIndex = layerIndex;
  doc.objects().add(geo, a);
}

const site = layer("대지", [200, 80, 40]);
const ground = layer("지반", [190, 190, 184]);
const mass = layer("매스", [40, 40, 40]);
const podium = layer("저층부", [120, 120, 116], mass);
const tower = layer("상층부", [235, 235, 230], mass);
const ctx = layer("주변건물", [170, 170, 165]);

// 대지 경계 32 × 24m
const b = [[0, 0, 0], [32, 0, 0], [32, 24, 0], [0, 24, 0], [0, 0, 0]];
for (let i = 0; i < 4; i++) add(new rhino.LineCurve(b[i], b[i + 1]), site);
add(box(-30, -25, -0.3, 92, 74, 0.3), ground);

// 저층부 2개 층 + 상층부 4개 층 (층고 4.2 / 3.6m)
add(box(2, 2, 0, 28, 20, 8.4), podium);
for (let i = 0; i < 4; i++) add(box(6 + (i % 2) * 0.8, 4, 8.4 + i * 3.6, 18, 14, 3.4), tower);
// 옥상 코어
add(box(12, 9, 22.8, 6, 5, 3), tower);

// 주변 건물
[[-24, -18, 10, 12, 15], [38, -16, 14, 10, 24], [40, 30, 12, 14, 12], [-22, 30, 16, 12, 9], [8, 34, 18, 10, 18]].forEach(
  ([x, y, w, d, h]) => add(box(x, y, 0, w, d, h), ctx),
);

fs.mkdirSync("public/samples", { recursive: true });
fs.writeFileSync("public/samples/demo-massing.3dm", doc.toByteArray());
console.log("public/samples/demo-massing.3dm", doc.objects().count, "objects");
