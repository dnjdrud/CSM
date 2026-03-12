import Link from "next/link";

type Props = {
  profileId: string;
  currentUserId: string | null;
};

export function ProfileCrowTab({ profileId, currentUserId }: Props) {
  const isOwnProfile = currentUserId === profileId;

  return (
    <div className="px-4 py-10 space-y-8">

      {/* 구독 채널 섹션 */}
      <section aria-labelledby="channels-heading">
        <h2
          id="channels-heading"
          className="text-[13px] font-semibold text-theme-text flex items-center gap-1.5 mb-3"
        >
          <span aria-hidden>📡</span> 구독 채널
        </h2>
        <div className="rounded-xl border border-dashed border-theme-border px-5 py-8 text-center space-y-2">
          <p className="text-[14px] font-medium text-theme-text">채널 구독 기능 준비 중</p>
          <p className="text-[13px] text-theme-muted leading-relaxed">
            까마귀 채널을 구독하면 선교사, 목회자의
            <br />
            정기 소식을 받아볼 수 있습니다.
          </p>
          {isOwnProfile && (
            <Link
              href="/contents"
              className="inline-block mt-2 text-[13px] text-theme-primary hover:opacity-80"
            >
              콘텐츠 탐색하기 →
            </Link>
          )}
        </div>
      </section>

      {/* 까마귀 활동 섹션 */}
      <section aria-labelledby="crow-activity-heading">
        <h2
          id="crow-activity-heading"
          className="text-[13px] font-semibold text-theme-text flex items-center gap-1.5 mb-3"
        >
          <span aria-hidden>🐦</span> 까마귀 활동
        </h2>
        <div className="rounded-xl border border-dashed border-theme-border px-5 py-8 text-center space-y-2">
          <p className="text-[14px] font-medium text-theme-text">까마귀 활동 기록 준비 중</p>
          <p className="text-[13px] text-theme-muted leading-relaxed">
            기도 응원, 격려 메시지, 후원 활동 등
            <br />
            까마귀로서의 섬김이 여기 기록됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
