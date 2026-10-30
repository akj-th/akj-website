import type { Metadata } from "next";
import Projects from "@/components/views/Projects";

export const metadata: Metadata = { title: "프로젝트" };

export default function Page() {
  return <Projects />;
}
