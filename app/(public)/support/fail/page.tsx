import Link from "next/link";

const REASON_MESSAGES: Record<string, string> = {
  missing_params: "결제 정보가 올바르지 않습니다.",
  invalid_amount: "결제 금액이 올바르지 않습니다.",
  intent_not_found: "결제 정보를 찾을 수 없습니다.",
  amount_mismatch: "결제 금액이 일치하지 않습니다.",
  server_error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  PAY_PROCESS_CANCELED: "결제가 취소되었습니다.",
  REJECT_CARD_COMPANY: "카드사에서 결제가 거절되었습니다.",
};

export default async function SupportFailPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; message?: string }>;
}) {
  const { reason, message } = await searchParams;

  const displayMsg =
    (reason && REASON_MESSAGES[reason]) ??
    message ??
    "결제 중 문제가 발생했습니다.";

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="space-y-3">
          <div className="text-5xl">😔</div>
          <h1 className="text-2xl font-semibold text-theme-text">결제가 완료되지 않았습니다</h1>
          <p className="text-sm text-theme-muted leading-relaxed">{displayMsg}</p>
        </div>

        <div className="border-t border-theme-border pt-6 space-y-3">
          <Link
            href="/support"
            className="block w-full py-3 rounded-xl bg-theme-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            다시 시도하기
          </Link>
          <Link
            href="/feed"
            className="block text-sm text-theme-muted hover:text-theme-text transition-colors"
          >
            피드로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
