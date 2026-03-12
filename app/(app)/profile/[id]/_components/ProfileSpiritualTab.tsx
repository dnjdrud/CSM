import Link from "next/link";

type Props = {
  profileId: string;
  isOwnProfile: boolean;
};

export function ProfileSpiritualTab({ isOwnProfile }: Props) {
  if (!isOwnProfile) {
    return (
      <div className="px-4 py-16 text-center space-y-2">
        <span className="text-4xl" aria-hidden>🔒</span>
        <p className="text-[15px] font-medium text-theme-text">비공개 영역입니다</p>
        <p className="text-[13px] text-theme-muted">
          개인 영성관리는 본인만 볼 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-10 space-y-6">

      {/* 개인 기도제목 */}
      <section aria-labelledby="prayer-heading">
        <div className="flex items-center justify-between mb-3">
          <h2
            id="prayer-heading"
            className="text-[13px] font-semibold text-theme-text flex items-center gap-1.5"
          >
            <span aria-hidden>🙏</span> 개인 기도제목
          </h2>
          <Link
            href="/prayer"
            className="text-[12px] text-theme-primary hover:opacity-80"
          >
            기도 탭 →
          </Link>
        </div>
        <div className="rounded-xl border border-dashed border-theme-border px-5 py-7 text-center space-y-2">
          <p className="text-[14px] font-medium text-theme-text">개인 기도제목 관리 준비 중</p>
          <p className="text-[13px] text-theme-muted leading-relaxed">
            나만 보이는 기도제목을 기록하고
            <br />
            응답된 기도를 추적할 수 있습니다.
          </p>
        </div>
      </section>

      {/* 개인 삶 기록 */}
      <section aria-labelledby="life-journal-heading">
        <h2
          id="life-journal-heading"
          className="text-[13px] font-semibold text-theme-text flex items-center gap-1.5 mb-3"
        >
          <span aria-hidden>📔</span> 삶 기록
        </h2>
        <div className="rounded-xl border border-dashed border-theme-border px-5 py-7 text-center space-y-2">
          <p className="text-[14px] font-medium text-theme-text">개인 묵상 / 삶 기록 준비 중</p>
          <p className="text-[13px] text-theme-muted leading-relaxed">
            QT 기록, 일기, 신앙 성장 메모를
            <br />
            나만의 공간에 저장합니다.
          </p>
        </div>
      </section>

      {/* DM 기도 요청 */}
      <section aria-labelledby="dm-prayer-heading">
        <h2
          id="dm-prayer-heading"
          className="text-[13px] font-semibold text-theme-text flex items-center gap-1.5 mb-3"
        >
          <span aria-hidden>💌</span> DM 기도 요청
        </h2>
        <div className="rounded-xl border border-dashed border-theme-border px-5 py-7 text-center space-y-2">
          <p className="text-[14px] font-medium text-theme-text">DM 기도 요청 준비 중</p>
          <p className="text-[13px] text-theme-muted leading-relaxed">
            신뢰할 수 있는 지체에게
            <br />
            DM으로 기도를 부탁할 수 있습니다.
          </p>
        </div>
      </section>
    </div>
  );
}
