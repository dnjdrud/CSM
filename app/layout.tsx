import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { HeaderWrapper } from "@/common";
import { ToastProvider } from "@/components/ui/Toast";
import { LanguageProvider } from "@/lib/i18n";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/translations";
import { BottomNavWrapper } from "@/components/layout/BottomNavWrapper";
import { FooterLinks } from "@/components/layout/FooterLinks";
import { PwaRegister } from "./_components/PwaRegister";

export const metadata: Metadata = {
  title: "Cellah — Haven for Digital Exodus",
  description:
    "A minimal space for contemplation and connection. No noise, no algorithms. Selah's rest in the digital age.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cellah",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#D4A84B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale: Locale = rawLocale === "en" || rawLocale === "ko" ? rawLocale : "ko";

  return (
    <html lang={initialLocale}>
      <body className="min-h-screen flex flex-col bg-theme-bg text-theme-text">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-theme-primary focus:text-white focus:rounded-md"
        >
          Skip to main content
        </a>
        <ToastProvider>
          <LanguageProvider initialLocale={initialLocale}>
            <HeaderWrapper />
            <div className="flex flex-1 min-h-0 md:flex-row">
              <main className="flex flex-1 min-w-0 flex justify-center pb-16" id="main-content">
                {children}
              </main>
            </div>
            <BottomNavWrapper />
            <FooterLinks />
          </LanguageProvider>
        </ToastProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
