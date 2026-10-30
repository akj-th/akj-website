import type { Metadata } from "next";
import ModelViewer from "@/components/viewer/ModelViewer";
import { Badge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "도면·모델 뷰어" };

export default function ViewerPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="도면·모델 뷰어"
        sub="3DM 열기 · 레이어 · 시점 · 치수 재기 — 파일은 이 브라우저 안에서만 열린다"
        actions={<Badge tone="info">DWG는 다음 단계</Badge>}
      />
      <ModelViewer />
    </div>
  );
}
