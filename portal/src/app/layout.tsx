import type { Metadata } from "next";
import { DemoHydrator, Toaster } from "@/components/overlay";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ATELIER KJ 사내 포털", template: "%s — ATELIER KJ 포털" },
  description: "ATELIER KJ 사내 포털",
  // 사내 전용 — 검색엔진 수집 금지
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <body className="flex min-h-full">
        <aside className="sticky top-0 h-screen w-56 shrink-0 bg-ink">
          <Sidebar />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-6">{children}</main>
        </div>
        <DemoHydrator />
        <Toaster />
      </body>
    </html>
  );
}
