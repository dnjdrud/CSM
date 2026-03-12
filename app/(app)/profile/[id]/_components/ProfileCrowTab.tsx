import Link from "next/link";
import Image from "next/image";
import type { Subscription } from "@/lib/data/subscriptionRepository";
import { SubscribeButton } from "@/components/ui/SubscribeButton";

/* ─── 공통 타입 ──────────────────────────────────────────────── */

type OwnCrowProps = {
  isOwnProfile: true;
  subscriptions: Subscription[];
};

type OtherCrowProps = {
  isOwnProfile: false;
  subscriberCount: number;
  isSubscribed: boolean;
  isLoggedIn: boolean;
  creatorId: string;
  creatorName: string;
};

type Props = (OwnCrowProps | OtherCrowProps) & { profileId: string };

/* ─── 구독 크리에이터 카드 ───────────────────────────────────── */

function CreatorCard({ sub }: { sub: Subscription }) {
  const c = sub.creator;
  const name = c?.name ?? "알 수 없음";
  const affiliation = c?.affiliation ?? c?.bio ?? null;
  const initials = name.slice(0, 2);

  const sinceLabel = new Date(sub.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <li>
      <Link
        href={`/profile/${sub.creatorId}`}
        className="flex items-center gap-3 py-3 hover:bg-theme-surface/60 rounded-lg px-2 -mx-2 transition-colors"
      >
        {/* 아바타 */}
        {c?.avatarUrl ? (
          <Image
            src={c.avatarUrl}
            alt={name}
            width={44}
            height={44}
            className="rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="w-11 h-11 rounded-full bg-theme-primary/10 text-theme-primary text-[14px] font-semibold flex items-center justify-center shrink-0">
            {initials}
          </span>
        )}

        {/* 정보 */}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-theme-text truncate">
            {name}
          </p>
          {affiliation && (
            <p className="text-[12px] text-theme-muted truncate">{affiliation}</p>
          )}
        </div>

        {/* 구독일 */}
        <span className="text-[11px] text-theme-muted shrink-0">
          {sinceLabel}부터
        </span>
      </Link>
    </li>
  );
}

/* ─── 내 Crow 탭 (구독한 채널 목록) ─────────────────────────── */

function OwnCrowTab({ subscriptions }: { subscriptions: Subscription[] }) {
  return (
    <div className="px-4 py-4 space-y-8">
      {/* 구독 채널 */}
      <section aria-labelledby="channels-heading">
        <div className="flex items-center justify-between mb-3">
          <h2
            id="channels-heading"
            className="text-[13px] font-semibold text-theme-text flex items-center gap-1.5"
          >
            <span aria-hidden>📡</span> 내가 구독한 채널
            {subscriptions.length > 0 && (
              <span className="text-[11px] font-normal text-theme-muted ml-1">
                ({subscriptions.length})
              </span>
            )}
          </h2>
          <Link
            href="/contents"
            className="text-[12px] text-theme-primary hover:opacity-80"
          >
            탐색하기 →
          </Link>
        </div>

        {subscriptions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-theme-border px-5 py-10 text-center space-y-2">
            <span className="text-4xl" aria-hidden>
              🐦
            </span>
            <p className="text-[14px] font-medium text-theme-text">
              아직 까마귀가 된 채널이 없습니다
            </p>
            <p className="text-[13px] text-theme-muted leading-relaxed">
              선교사, 목회자, 콘텐츠 크리에이터를
              <br />
              구독하면 정기 소식을 받아볼 수 있어요.
            </p>
            <Link
              href="/contents"
              className="inline-block mt-2 text-[13px] text-theme-primary hover:opacity-80"
            >
              콘텐츠 탐색하기 →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-theme-border/50">
            {subscriptions.map((sub) => (
              <CreatorCard key={sub.id} sub={sub} />
            ))}
          </ul>
        )}
      </section>

      {/* 까마귀 활동 — 다음 단계 placeholder */}
      <section aria-labelledby="crow-activity-heading">
        <h2
          id="crow-activity-heading"
          className="text-[13px] font-semibold text-theme-text flex items-center gap-1.5 mb-3"
        >
          <span aria-hidden>🐦</span> 까마귀 활동
        </h2>
        <div className="rounded-xl border border-dashed border-theme-border px-5 py-8 text-center space-y-1.5">
          <p className="text-[13px] font-medium text-theme-text">
            까마귀 활동 기록 준비 중
          </p>
          <p className="text-[12px] text-theme-muted leading-relaxed">
            기도 응원, 격려 메시지, 후원 활동 등
            <br />
            까마귀로서의 섬김이 여기 기록됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ─── 타인 Crow 탭 (구독하기 뷰) ─────────────────────────────── */

function OtherCrowTab({
  creatorId,
  creatorName,
  subscriberCount,
  isSubscribed,
  isLoggedIn,
}: {
  creatorId: string;
  creatorName: string;
  subscriberCount: number;
  isSubscribed: boolean;
  isLoggedIn: boolean;
}) {
  return (
    <div className="px-4 py-10 flex flex-col items-center gap-6 text-center">
      {/* 까마귀 아이콘 */}
      <span className="text-5xl" aria-hidden>
        🐦
      </span>

      {/* 설명 */}
      <div className="space-y-1.5">
        <p className="text-[16px] font-semibold text-theme-text">
          {creatorName}님의 까마귀가 되어보세요
        </p>
        <p className="text-[13px] text-theme-muted leading-relaxed max-w-xs">
          구독하면 이 분이 올리는 콘텐츠와 선교 소식을
          <br />
          놓치지 않고 받아볼 수 있습니다.
        </p>
      </div>

      {/* 구독 버튼 */}
      <SubscribeButton
        creatorId={creatorId}
        initialIsSubscribed={isSubscribed}
        initialCount={subscriberCount}
        isLoggedIn={isLoggedIn}
      />

      {/* 구독자 없을 때 첫 까마귀 독려 */}
      {subscriberCount === 0 && !isSubscribed && (
        <p className="text-[12px] text-theme-muted">
          첫 번째 까마귀가 되어주세요 🙏
        </p>
      )}
    </div>
  );
}

/* ─── 메인 내보내기 ──────────────────────────────────────────── */

export function ProfileCrowTab(props: Props) {
  if (props.isOwnProfile) {
    return <OwnCrowTab subscriptions={props.subscriptions} />;
  }

  return (
    <OtherCrowTab
      creatorId={props.creatorId}
      creatorName={props.creatorName}
      subscriberCount={props.subscriberCount}
      isSubscribed={props.isSubscribed}
      isLoggedIn={props.isLoggedIn}
    />
  );
}
