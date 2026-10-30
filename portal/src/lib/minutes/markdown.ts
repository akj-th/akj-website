// 회의록 → Markdown (akj-minutes 스킬의 md 형식: 담당자별 체크박스 → 논의 → 미결 → 내부 메모)
import type { Minutes } from "@/data/minutes";
import { person } from "@/data/people";

const nameOf = (o: string) => person(o)?.name ?? o;

export function minutesMarkdown(m: Minutes, projectName: string): string {
  const L: string[] = [];
  const date = m.date.slice(0, 10);
  L.push(`# ${date.slice(2).replace(/-/g, "")} ${projectName} ${m.title} 회의록`, "");
  L.push("| 항목 | 내용 |", "|---|---|");
  L.push(`| 프로젝트 | ${m.project} ${projectName} |`);
  L.push(`| 일시 | ${m.date.replace("T", " ")} |`);
  L.push(`| 장소 | ${m.place} |`);
  L.push(`| 참석 | ${[...m.internal.map(nameOf), ...m.external].join(", ")} |`);
  if (m.distribute !== undefined) L.push(`| 구분 | ${m.distribute ? "배포용" : "내부용"} |`);
  L.push("", `> ${m.summary}`, "");

  L.push("## 담당별 할 일", "");
  const owners = [...new Set(m.actions.map((a) => a.owner))];
  for (const o of owners) {
    L.push(`### ${nameOf(o)}`);
    for (const a of m.actions.filter((x) => x.owner === o)) {
      L.push(`- [${a.done ? "x" : " "}] ${a.task} — ${a.due}${a.output ? ` · ${a.output}` : ""}`);
    }
    L.push("");
  }

  if (m.items?.length) {
    L.push("## 논의 사항", "");
    for (const it of m.items) {
      L.push(`### ${it.title}`);
      for (const r of it.rows) L.push(`- **${r.label}**: ${r.text}`);
      if (it.decision) L.push(`- **결정**: ${it.decision}`);
      if (it.open) L.push(`- **미결**: ${it.open}`);
      L.push("");
    }
  } else if (m.decisions.length) {
    L.push("## 결정 사항", "", ...m.decisions.map((d) => `- ${d}`), "");
  }

  if (m.openItems?.length) {
    L.push("## 미결 사항", "", "| 항목 | 담당 | 기한 |", "|---|---|---|", ...m.openItems.map((o) => `| ${o.item} | ${o.owner} | ${o.due} |`), "");
  }
  if (m.next) L.push(`**다음 회의**: ${m.next}`, "");
  if (m.checks?.length) L.push("## 확인 필요", "", ...m.checks.map((c) => `- [확인 필요] ${c}`), "");
  if (m.internalNotes?.length) L.push("## 내부 메모 (배포본 제외)", "", ...m.internalNotes.map((c) => `- ${c}`), "");
  L.push(`---`, `원본: ${m.source}`);
  return L.join("\n");
}
