import type { Metadata } from "next";
import { Suspense } from "react";
import ApprovalsView from "@/components/views/ApprovalsView";

export const metadata: Metadata = { title: "결재" };

export default function Page() {
  return (
    <Suspense>
      <ApprovalsView />
    </Suspense>
  );
}
