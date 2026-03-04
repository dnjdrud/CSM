import type { Metadata } from "next";
import "./globals.css";
import { HeaderWrapper } from "@/common";
import { RightContextPanel } from "@/components/RightContextPanel";
import { ToastProvider } from "@/components/ui/Toast";
import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Cellah — Haven for Digital Exodus",
  description:
    "A minimal space for contemplation and connection. No noise, no algorithms. Selah's rest in the digital age.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-theme-bg text-theme-text">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-theme-primary focus:text-white focus:rounded-md"
        >
          Skip to main content
        </a>
        <ToastProvider>
          <HeaderWrapper />
          <div className="flex flex-1 min-h-0 md:flex-row">
            <main className="flex flex-1 min-w-0 flex justify-center" id="main-content">
              {children}
            </main>
            <RightContextPanel />
          </div>
          <BottomNav />
          <footer className="shrink-0 border-t border-theme-border py-4 px-4 text-center text-sm text-theme-muted">
            <Link href="/privacy" className="hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">Privacy</Link>
            {" · "}
            <Link href="/terms" className="hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">Terms</Link>
            {" · "}
            <Link href="/contact" className="hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">Contact</Link>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
