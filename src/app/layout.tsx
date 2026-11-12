import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { VaultGuard } from "@/components/VaultGuard";
import { TEXT_SIZE_COOKIE, parseTextSize } from "@/lib/text-size";
import { getSession, vaultScopeFor } from "@/server/session";
import "./globals.css";

// Deliberately generic: no names or personal details in titles/previews.
export const metadata: Metadata = {
  title: "가족 공간",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "same-origin",
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3B261F",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const textSize = parseTextSize((await cookies()).get(TEXT_SIZE_COOKIE)?.value);
  const vaultScope = vaultScopeFor(await getSession());
  return (
    <html lang="ko" data-text={textSize}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-btn focus:px-4 focus:py-3 focus:text-btn-text"
        >
          본문으로 건너뛰기
        </a>
        <VaultGuard scope={vaultScope} />
        {children}
      </body>
    </html>
  );
}
