import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { TEXT_SIZE_COOKIE, parseTextSize } from "@/lib/text-size";
import { TextSizeControl } from "./TextSizeControl";

type Props = {
  children: ReactNode;
  /** 이전 button target. Always shown when provided. */
  backHref?: string;
  backLabel?: string;
  /** 방 목록 button (parents only). */
  roomsLink?: boolean;
  /** Show the logout button in the footer. */
  logout?: boolean;
};

/**
 * Page frame: top navigation (이전 / 방 목록), one-column content,
 * bottom utilities (글씨 크기 / 나가기). Server component.
 */
export async function AppShell({ children, backHref, backLabel = "이전", roomsLink = false, logout = false }: Props) {
  const textSize = parseTextSize((await cookies()).get(TEXT_SIZE_COOKIE)?.value);
  const hasNav = Boolean(backHref) || roomsLink;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-8 pt-4">
      {hasNav && (
        <nav aria-label="화면 이동" className="mb-6 grid grid-cols-2 gap-3">
          {backHref ? (
            <Link href={backHref} className="btn btn-secondary">
              <span aria-hidden="true">←</span> {backLabel}
            </Link>
          ) : (
            <span />
          )}
          {roomsLink ? (
            <Link href="/rooms" className="btn btn-secondary">
              방 목록
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}

      <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>

      <footer className="mt-10 grid gap-3 border-t border-line/40 pt-6">
        <TextSizeControl initial={textSize} />
        {logout && (
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="btn btn-secondary">
              나가기 (로그아웃)
            </button>
          </form>
        )}
      </footer>
    </div>
  );
}
