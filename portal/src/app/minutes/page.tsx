import type { Metadata } from "next";
import { Suspense } from "react";
import MinutesView from "@/components/views/MinutesView";

export const metadata: Metadata = { title: "회의록" };

export default function Page() {
  return (
    <Suspense>
      <MinutesView />
    </Suspense>
  );
}
