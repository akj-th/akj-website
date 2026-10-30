"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useDemo, useToast } from "@/lib/store";

function useEsc(onClose: () => void) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
}

/** 오른쪽에서 나오는 상세 패널 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  useEsc(onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="닫기" className="anim-fade absolute inset-0 bg-ink/25" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className="anim-drawer relative flex h-full flex-col border-l border-ink bg-paper"
        style={{ width: `min(${width}px, 100vw)` }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 text-base font-semibold">{title}</div>
          <button type="button" onClick={onClose} aria-label="닫기" className="p-1 hover:bg-surface">
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
      </aside>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  useEsc(onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6 pt-[10vh]">
      <button type="button" aria-label="닫기" className="anim-fade fixed inset-0 bg-ink/30" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="anim-toast relative w-full border border-ink bg-paper" style={{ maxWidth: width }}>
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="p-1 hover:bg-surface">
            <X size={18} />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

export function Toaster() {
  const items = useToast((s) => s.items);
  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-[60] flex flex-col items-end gap-2" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="anim-toast bg-ink px-4 py-2.5 text-sm text-paper shadow-lg">
          {t.text}
        </div>
      ))}
    </div>
  );
}

/** 저장된 데모 상태를 마운트 뒤에 불러온다 — 서버 렌더 결과와 첫 화면을 맞추기 위해 */
export function DemoHydrator() {
  useEffect(() => {
    useDemo.persist.rehydrate();
  }, []);
  return null;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-medium text-mute">{label}</span>
      {children}
      {hint && <span className="text-xs text-stone">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "h-9 w-full border border-line bg-paper px-2.5 text-sm outline-none placeholder:text-stone focus:border-ink";
