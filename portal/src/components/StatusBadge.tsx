import { STATUS_LABEL, type ModuleStatus } from "@/lib/modules";

const STYLE: Record<ModuleStatus, string> = {
  planned: "border border-ink text-ink",
  building: "bg-rule text-ink",
  live: "bg-ink text-paper",
};

export default function StatusBadge({ status }: { status: ModuleStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs whitespace-nowrap ${STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
