import type { NextConfig } from "next";

// PAGES_EXPORT=1 이면 GitHub Pages 용 정적 웹 데모(서버 없음), 아니면 NAS 용 서버 묶음.
// 웹 데모는 scripts/export-pages.mjs 로 만든다.
const pages = process.env.PAGES_EXPORT === "1";

const nextConfig: NextConfig = pages
  ? {
      output: "export",
      basePath: process.env.NEXT_PUBLIC_BASE_PATH,
      trailingSlash: true,
      // 서버가 있어야 하는 파일(*.server.ts — 회의록 AI API)은 빼고 만든다
      pageExtensions: ["tsx", "ts"],
    }
  : {
      // NAS(Container Manager)에 Docker로 올릴 때 node_modules 없이 돌아가는 최소 묶음을 만든다.
      output: "standalone",
      pageExtensions: ["tsx", "ts", "server.ts"],
    };

export default nextConfig;
