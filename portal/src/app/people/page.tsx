import type { Metadata } from "next";
import { Suspense } from "react";
import PeopleView from "@/components/views/PeopleView";

export const metadata: Metadata = { title: "인사" };

export default function Page() {
  return (
    <Suspense>
      <PeopleView />
    </Suspense>
  );
}
