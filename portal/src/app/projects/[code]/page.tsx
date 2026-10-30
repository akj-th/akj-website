import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetail from "@/components/views/ProjectDetail";
import { PROJECTS, project } from "@/data/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ code: p.code }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[code]">): Promise<Metadata> {
  const { code } = await params;
  const p = project(code);
  return { title: p ? `${p.code} ${p.name}` : "프로젝트" };
}

export default async function Page({ params }: PageProps<"/projects/[code]">) {
  const { code } = await params;
  const p = project(code);
  if (!p) notFound();
  return <ProjectDetail p={p} />;
}
