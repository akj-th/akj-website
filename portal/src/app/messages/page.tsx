import type { Metadata } from "next";
import { Suspense } from "react";
import Messenger from "@/components/views/Messenger";

export const metadata: Metadata = { title: "메신저" };

export default function Page() {
  return (
    <Suspense>
      <Messenger />
    </Suspense>
  );
}
