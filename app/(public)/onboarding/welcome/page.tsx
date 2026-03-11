import Link from "next/link";

/**
 * Post-signup welcome page.
 * Shown after CompleteSignupForm creates the account.
 * User is not yet logged in — static, no auth required.
 */
export default function OnboardingWelcomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
          환영합니다
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          계정이 성공적으로 생성되었습니다.<br />
          이제 로그인하여 커뮤니티에 참여하실 수 있습니다.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-lg bg-gray-800 px-5 py-3 text-sm font-medium text-gray-50 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 transition-colors"
          >
            로그인하기
          </Link>
        </div>

        <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-5 text-left space-y-3">
          <p className="text-sm font-medium text-gray-800">시작하기 전에</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gray-400">•</span>
              <span>피드에서 기도 요청, 묵상, 사역 소식을 나눌 수 있습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gray-400">•</span>
              <span>셀(소그룹)에 참여하거나 직접 개설할 수 있습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gray-400">•</span>
              <span>My Life에서 개인 기도 노트와 감사 일기를 기록하세요.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
