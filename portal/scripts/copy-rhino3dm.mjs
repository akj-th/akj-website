// rhino3dm(wasm)은 번들하지 않고 public/ 에 두어 3DMLoader 가 직접 받아 가게 한다.
// (emscripten 빌드라 번들러를 거치면 깨지기 쉽다 — AAD System 과 같은 이유)
// predev / prebuild 에서 자동 실행된다.
import fs from "node:fs";
import path from "node:path";

const src = path.resolve("node_modules/rhino3dm");
const dst = path.resolve("public/rhino3dm");
fs.mkdirSync(dst, { recursive: true });
for (const f of ["rhino3dm.js", "rhino3dm.wasm"]) {
  fs.copyFileSync(path.join(src, f), path.join(dst, f));
}
console.log("rhino3dm → public/rhino3dm");
