import Link from "next/link";
import type { SpiritualNote } from "@/lib/data/spiritualRepository";
import { SpiritualNoteComposer } from "./SpiritualNoteComposer";
import { SpiritualNoteCard } from "./SpiritualNoteCard";

type SpiritualSection = "prayer" | "life";

type Props = {
  profileId: string;
  isOwnProfile: boolean;
  prayerNotes: SpiritualNote[];
  lifeNotes: SpiritualNote[];
  section: SpiritualSection;
};

export function ProfileSpiritualTab({
  profileId,
  isOwnProfile,
  prayerNotes,
  lifeNotes,
  section,
}: Props) {
  if (!isOwnProfile) {
    return (
      <div className="px-4 py-16 text-center space-y-2">
        <span className="text-4xl" aria-hidden>
          🔒
        </span>
        <p className="text-[15px] font-medium text-theme-text">
          비공개 영역입니다
        </p>
        <p className="text-[13px] text-theme-muted">
          개인 영성관리는 본인만 볼 수 있습니다.
        </p>
      </div>
    );
  }

  const activeNotes = section === "prayer" ? prayerNotes : lifeNotes;

  return (
    <div>
      {/* Sub-tab nav */}
      <nav className="flex border-b border-theme-border" aria-label="영성관리 섹션">
        <Link
          href={`/profile/${profileId}?tab=spiritual`}
          className={`flex-1 py-2.5 text-center text-[13px] font-medium border-b-2 -mb-px transition-colors ${
            section === "prayer"
              ? "border-theme-primary text-theme-primary"
              : "border-transparent text-theme-muted hover:text-theme-text"
          }`}
        >
          🙏 기도제목
        </Link>
        <Link
          href={`/profile/${profileId}?tab=spiritual&section=life`}
          className={`flex-1 py-2.5 text-center text-[13px] font-medium border-b-2 -mb-px transition-colors ${
            section === "life"
              ? "border-theme-primary text-theme-primary"
              : "border-transparent text-theme-muted hover:text-theme-text"
          }`}
        >
          📔 삶 기록
        </Link>
      </nav>

      {/* Composer (create form) */}
      <div className="px-4 pt-4 pb-2">
        <SpiritualNoteComposer type={section === "life" ? "life" : "prayer"} />
      </div>

      {/* Notes list */}
      {activeNotes.length === 0 ? (
        <div className="px-4 py-14 text-center space-y-2">
          <span className="text-4xl" aria-hidden>
            {section === "prayer" ? "🙏" : "📔"}
          </span>
          <p className="text-[15px] font-medium text-theme-text">
            {section === "prayer"
              ? "아직 기도제목이 없습니다"
              : "아직 삶 기록이 없습니다"}
          </p>
          <p className="text-[13px] text-theme-muted leading-relaxed">
            {section === "prayer"
              ? "기도제목을 기록하고 응답을 추적해보세요."
              : "오늘의 묵상, 감사, 고민을 자유롭게 기록해보세요."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-theme-border/50 px-4 pb-8">
          {activeNotes.map((note) => (
            <li key={note.id}>
              <SpiritualNoteCard note={note} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
