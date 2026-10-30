import type { Metadata } from "next";
import { Suspense } from "react";
import MailBox from "@/components/views/MailBox";

export const metadata: Metadata = { title: "메일" };

export default function Page() {
  return (
    <Suspense>
      <MailBox />
    </Suspense>
  );
}
