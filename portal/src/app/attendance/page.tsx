import type { Metadata } from "next";
import AttendanceView from "@/components/views/AttendanceView";

export const metadata: Metadata = { title: "근태" };

export default function Page() {
  return <AttendanceView />;
}
