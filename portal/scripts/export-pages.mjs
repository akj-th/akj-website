// GitHub Pages 용 정적 웹 데모를 만들어 저장소 루트 app/ 에 넣는다.
// https://akj-th.github.io/akj-website/app/ 로 열린다. 서버가 없어 AI 회의록은 예시로만 동작한다.
// 실행: npm run export:pages  →  app/ 를 커밋·푸시하면 1~2분 뒤 반영된다.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BASE = "/akj-website/app";
execSync("npm run build", {
  stdio: "inherit",
  env: { ...process.env, PAGES_EXPORT: "1", NEXT_PUBLIC_BASE_PATH: BASE, NEXT_PUBLIC_STATIC_DEMO: "1" },
});

const out = path.resolve("out");
const dst = path.resolve("..", "app");
if (path.basename(dst) !== "app" || !fs.existsSync(path.join(out, "index.html"))) {
  throw new Error("빌드 결과(out/index.html)가 없습니다");
}
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(out, dst, { recursive: true });

// 미리 받기 파일 이름 맞추기 — 내보내기는 "__next.projects/$d$code/__PAGE__.txt" 처럼 폴더로 쓰는데
// 브라우저는 "__next.projects.$d$code.__PAGE__.txt" 를 요청한다. 정적 호스팅에는 이 변환이 없어 사본을 둔다.
let flattened = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const full = path.join(dir, e.name);
    if (e.name.startsWith("__next.")) {
      for (const f of fs.readdirSync(full, { recursive: true, withFileTypes: true })) {
        if (!f.isFile()) continue;
        const abs = path.join(f.parentPath ?? f.path, f.name);
        const flat = [e.name, ...path.relative(full, abs).split(path.sep)].join(".");
        fs.copyFileSync(abs, path.join(dir, flat));
        flattened++;
      }
    } else {
      walk(full);
    }
  }
}
walk(dst);
console.log(`웹 데모 → ${dst} (미리 받기 파일 사본 ${flattened}개)`);
