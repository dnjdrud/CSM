"use client";

import Link from "next/link";

// Never display error details: they could contain private data.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 py-8">
      <h1 className="mb-6 text-title font-bold">잠시 문제가 생겼어요</h1>
      <p>화면을 불러오지 못했어요. 다시 시도해 주세요.</p>
      <div className="mt-auto grid gap-3 pt-10">
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          다시 시도하기
        </button>
        <Link href="/" className="btn btn-secondary">
          처음 화면으로
        </Link>
      </div>
    </main>
  );
}
