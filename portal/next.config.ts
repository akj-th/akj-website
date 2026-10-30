import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NAS(Container Manager)에 Docker로 올릴 때 node_modules 없이 돌아가는 최소 묶음을 만든다.
  output: "standalone",
};

export default nextConfig;
