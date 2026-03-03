import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { HeaderWrapper } from "@/common";
import { RightContextPanel } from "@/components/RightContextPanel";
import { ToastProvider } from "@/components/ui/Toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CSM — A digital sanctuary for Christian community",
  description:
    "A closed community for prayer, scripture, testimony, and mission. No algorithms, no ads. Dignified support for ministry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-gray-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-gray-800 focus:text-gray-50 focus:rounded-md"
        >
          Skip to main content
        </a>
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-1 min-h-0 md:flex-row">
            <ToastProvider>
            <HeaderWrapper />
            <main className="flex-1 min-w-0 flex justify-center" id="main-content">
              {children}
            </main>
            <RightContextPanel />
            </ToastProvider>
          </div>
          <footer className="shrink-0 border-t border-gray-200 py-4 px-4 text-center text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Privacy</Link>
            {" · "}
            <Link href="/terms" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Terms</Link>
            {" · "}
            <Link href="/contact" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Contact</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
