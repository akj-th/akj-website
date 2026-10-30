import type { Metadata } from "next";
import RampCalculator from "@/components/views/RampCalculator";

export const metadata: Metadata = { title: "주차장 램프 계산기" };

export default function Page() {
  return <RampCalculator />;
}
