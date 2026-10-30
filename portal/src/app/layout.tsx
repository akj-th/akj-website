import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
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
        <aside className="sticky top-0 h-screen w-56 shrink-0 overflow-y-auto bg-ink">
          <Sidebar />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 px-8 py-8">{children}</main>
          <footer className="border-t border-rule px-8 py-4 text-xs text-mute">
            회사 NAS에서 운영 · VPN 안에서만 접속 · 틀 v0.1
          </footer>
        </div>
      </body>
    </html>
  );
}
