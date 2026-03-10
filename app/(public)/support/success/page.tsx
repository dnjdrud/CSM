import Link from "next/link";
import { getSupportIntent, getMinistryById } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function SupportSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ intentId?: string }>;
}) {
  const { intentId } = await searchParams;
  const intent = intentId ? await getSupportIntent(intentId) : null;
  const ministry = intent ? await getMinistryById(intent.ministryId) : null;

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="space-y-3">
          <div className="text-5xl">🙏</div>
          <h1 className="text-2xl font-semibold text-theme-text">후원 감사합니다</h1>
          {intent && (
            <p className="text-sm text-theme-muted leading-relaxed">
              <span className="font-medium text-theme-text">
                ₩{intent.amountKrw.toLocaleString()}
              </span>
              이 {ministry?.name ?? "사역"}에 전달됩니다.
              <br />
              이 헌신이 하나님 나라에 쓰임받기를 기도합니다.
            </p>
          )}
          {!intent && (
            <p className="text-sm text-theme-muted leading-relaxed">
              후원이 접수되었습니다. 이 헌신이 하나님 나라에 쓰임받기를 기도합니다.
            </p>
          )}
        </div>

        <div className="border-t border-theme-border pt-6 space-y-3">
          <Link
            href="/feed"
            className="block w-full py-3 rounded-xl bg-theme-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            피드로 돌아가기
          </Link>
          <Link
            href="/support"
            className="block text-sm text-theme-muted hover:text-theme-text transition-colors"
          >
            다른 사역 후원하기
          </Link>
        </div>
      </div>
    </div>
  );
}
