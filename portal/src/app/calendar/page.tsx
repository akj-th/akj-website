import type { Metadata } from "next";
import { Suspense } from "react";
import CalendarView from "@/components/views/CalendarView";

export const metadata: Metadata = { title: "캘린더" };

export default function Page() {
  return (
    <Suspense>
      <CalendarView />
    </Suspense>
  );
}
