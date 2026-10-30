import type { Metadata } from "next";
import ModelViewer from "@/components/viewer/ModelViewer";

export const metadata: Metadata = { title: "도면·모델 뷰어" };

export default function ViewerPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">도면·모델 뷰어</h1>
        <span className="text-xs text-mute">3DM 열기 · 레이어 · 시점 · 치수 재기 — DWG는 다음 단계</span>
      </header>
      <ModelViewer />
    </div>
  );
}
