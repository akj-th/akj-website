import type { Metadata } from "next";
import { Suspense } from "react";
import ContractsView from "@/components/views/ContractsView";

export const metadata: Metadata = { title: "계약서" };

export default function Page() {
  return (
    <Suspense>
      <ContractsView />
    </Suspense>
  );
}
