import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import { getServerLocale } from "@/lib/i18n/server";

export const metadata = { title: "이용방법 – Cellah" };

export default async function GuidePage() {
  const locale = await getServerLocale();
  const isKo = locale !== "en";
  return isKo ? <GuideKo /> : <GuideEn />;
}

/* ─────────────────────────────────── Korean ── */

function GuideKo() {
  return (
    <TimelineContainer>
      <div className="px-4 pt-6 pb-10 space-y-10">

        {/* Back + Title */}
        <div>
          <Link href="/home" className="text-[13px] text-theme-muted hover:text-theme-text">← 홈</Link>
          <h1 className="text-[22px] font-bold text-theme-text mt-3 leading-tight">이용방법</h1>
          <p className="text-[13px] text-theme-muted mt-1">Cellah를 처음 사용하신다면 여기서 시작하세요.</p>
        </div>

        {/* 1. 플랫폼 핵심 구조 */}
        <Section title="1. 플랫폼 핵심 구조">
          <p className="text-[14px] text-theme-text leading-relaxed">
            Cellah는 크리스천 공동체와 콘텐츠 사역을 연결하는 플랫폼입니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <PillarCard emoji="🤝" title="Community" desc="삶과 신앙을 나누는 공동체" />
            <PillarCard emoji="🙏" title="Prayer" desc="서로를 위해 기도하는 네트워크" />
            <PillarCard emoji="🎬" title="Contents" desc="사역 콘텐츠를 소비하고 확산하는 공간" />
          </div>
          <p className="text-[13px] text-theme-muted mt-3">
            이 세 가지 축은 서로 연결되어 자연스러운 영적 생태계를 만듭니다.
          </p>
        </Section>

        {/* 2. 탭 구조 */}
        <Section title="2. 탭 구조">
          <div className="space-y-5">
            <TabBlock emoji="🏠" name="Home (피드)" ko>
              <p>팔로우한 사람들의 글이 나타납니다. 두 개의 탭으로 구성됩니다.</p>
              <ul className="mt-2 space-y-2">
                <li><strong>Feed</strong> — 팔로잉한 사람들의 셀 게시글 · 구독한 크리에이터 영상</li>
                <li>
                  <strong>Prayer</strong> — 기도 요청 · "기도했습니다" 버튼
                  <p className="text-[12px] text-theme-muted mt-0.5">
                    Prayer 탭은 토론이 아니라 기도 참여를 위한 공간입니다. (댓글 기능 없음)
                  </p>
                </li>
              </ul>
            </TabBlock>

            <TabBlock emoji="🎬" name="Contents" ko>
              <p>Cellah의 콘텐츠 사역 플랫폼입니다.</p>
              <ul className="mt-2 space-y-1 list-disc pl-4">
                <li>유튜브 영상 (사역 영상, 브이로그, 설교 등)</li>
                <li>사진 · 글 · 교육 콘텐츠 · 사역 이야기</li>
              </ul>
              <p className="text-[13px] text-theme-muted mt-2">
                유튜브 링크를 업로드하면 플랫폼 안에서 바로 재생됩니다.
              </p>
            </TabBlock>

            <TabBlock emoji="👥" name="Cell" ko>
              <p>관심사 기반 공동체입니다.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["연애", "결혼", "찬양", "성경 통독", "기독교 독서", "직장인 크리스천", "청년 공동체"].map((tag) => (
                  <span key={tag} className="text-[12px] bg-theme-surface-2 border border-theme-border rounded-full px-2.5 py-0.5 text-theme-text">{tag}</span>
                ))}
              </div>
              <p className="text-[13px] text-theme-muted mt-2">채팅과 대화를 통해 깊은 교제를 나눌 수 있습니다.</p>
            </TabBlock>

            <TabBlock emoji="👤" name="Profile" ko>
              <ul className="mt-1 space-y-1 list-disc pl-4">
                <li>내가 올린 글 · 콘텐츠</li>
                <li>팔로워 · 팔로잉</li>
                <li>내가 구독한 채널 (까마귀 활동)</li>
                <li>개인 영성관리 — 개인 기도제목 · 삶 기록 · DM 기도요청</li>
              </ul>
            </TabBlock>
          </div>
        </Section>

        {/* 3. 까마귀 구독 시스템 */}
        <Section title="3. 까마귀(Crow) 구독 시스템">
          <div className="rounded-2xl bg-theme-surface-2 border border-theme-border px-5 py-4 space-y-3">
            <p className="text-[14px] text-theme-text leading-relaxed">
              Cellah의 구독자는 <strong>까마귀(Crow)</strong>라고 불립니다.
              까마귀는 단순한 구독자가 아니라 콘텐츠 사역에 동참하는 사람입니다.
            </p>
            <p className="text-[13px] text-theme-muted italic leading-relaxed">
              성경에서 하나님은 광야의 엘리야에게 까마귀를 통해 음식을 보내셨습니다.
              그 공급은 조용했고 드러나지 않았지만, 분명히 하나님께서 이루신 일이었습니다.
            </p>
          </div>
          <ul className="mt-4 space-y-1.5 list-disc pl-4 text-[14px] text-theme-text">
            <li>콘텐츠 구독</li>
            <li>프리미엄 콘텐츠 시청</li>
            <li>사역 콘텐츠 지원</li>
          </ul>
        </Section>

        {/* 4. 콘텐츠 생태계 */}
        <Section title="4. 콘텐츠 생태계">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <RoleCard emoji="🌍" title="선교사 / 사역자" items={["사역 콘텐츠 제작", "사역 이야기 공유"]} />
            <RoleCard emoji="🎥" title="콘텐츠 크리에이터" items={["영상 제작 · 편집", "콘텐츠 교육"]} />
            <RoleCard emoji="👁️" title="시청자" items={["콘텐츠 시청", "구독 (까마귀)", "커뮤니티 참여"]} />
          </div>
          <p className="text-[13px] text-theme-muted mt-3 text-center">
            선교사 → 크리에이터 → 시청자로 이어지는 건강한 콘텐츠 생태계
          </p>
        </Section>

        {/* 5. 핵심 루프 */}
        <Section title="5. Cellah 핵심 루프">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-2">
            {[
              { n: "1️⃣", label: "콘텐츠 발견" },
              { n: "2️⃣", label: "콘텐츠 소비" },
              { n: "3️⃣", label: "커뮤니티 참여" },
              { n: "4️⃣", label: "기도 연결" },
              { n: "5️⃣", label: "까마귀 구독" },
            ].map(({ n, label }, i, arr) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex flex-col items-center text-center">
                  <span className="text-xl">{n}</span>
                  <span className="text-[12px] font-medium text-theme-text mt-0.5">{label}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-theme-muted text-lg hidden sm:inline">→</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[13px] text-theme-muted mt-3 text-center">
            이 루프가 반복되면서 플랫폼이 성장합니다.
          </p>
        </Section>

        {/* 6. 핵심 철학 */}
        <Section title="6. Cellah의 핵심 철학">
          <p className="text-[14px] text-theme-text leading-relaxed">
            Cellah는 단순한 소셜미디어가 아닙니다.
          </p>
          <ul className="mt-3 space-y-1.5 list-disc pl-4 text-[14px] text-theme-text">
            <li>삶을 나누고</li>
            <li>서로를 위해 기도하며</li>
            <li>콘텐츠를 통해 사역을 확산합니다</li>
          </ul>
          <p className="text-[14px] text-theme-text mt-3 font-medium">
            그리고 그 사역을 까마귀들이 조용히 지지합니다. 🐦
          </p>
        </Section>

        {/* CTA */}
        <div className="pt-2 border-t border-theme-border/60">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 rounded-xl bg-theme-primary px-5 py-3 text-[14px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            시작하기 →
          </Link>
        </div>

      </div>
    </TimelineContainer>
  );
}

/* ─────────────────────────────────── English ── */

function GuideEn() {
  return (
    <TimelineContainer>
      <div className="px-4 pt-6 pb-10 space-y-10">

        <div>
          <Link href="/home" className="text-[13px] text-theme-muted hover:text-theme-text">← Home</Link>
          <h1 className="text-[22px] font-bold text-theme-text mt-3 leading-tight">How to Use Cellah</h1>
          <p className="text-[13px] text-theme-muted mt-1">New to Cellah? Start here.</p>
        </div>

        <Section title="1. Platform Structure">
          <p className="text-[14px] text-theme-text leading-relaxed">
            Cellah is a platform connecting the Christian community with content ministry.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <PillarCard emoji="🤝" title="Community" desc="Share life and faith together" />
            <PillarCard emoji="🙏" title="Prayer" desc="A network of praying for one another" />
            <PillarCard emoji="🎬" title="Contents" desc="Consume and spread ministry content" />
          </div>
          <p className="text-[13px] text-theme-muted mt-3">
            These three pillars connect to create a natural spiritual ecosystem.
          </p>
        </Section>

        <Section title="2. Tab Structure">
          <div className="space-y-5">
            <TabBlock emoji="🏠" name="Home (Feed)">
              <p>Shows posts from people you follow. Two tabs inside:</p>
              <ul className="mt-2 space-y-2">
                <li><strong>Feed</strong> — Posts from followed users · Videos from subscribed creators</li>
                <li>
                  <strong>Prayer</strong> — Prayer requests · "I prayed" button
                  <p className="text-[12px] text-theme-muted mt-0.5">
                    The Prayer tab is for joining in prayer, not discussion. (No comments by design)
                  </p>
                </li>
              </ul>
            </TabBlock>

            <TabBlock emoji="🎬" name="Contents">
              <p>Cellah&apos;s content ministry platform.</p>
              <ul className="mt-2 space-y-1 list-disc pl-4">
                <li>YouTube videos (ministry, vlogs, sermons, etc.)</li>
                <li>Photos · Text · Educational content · Ministry stories</li>
              </ul>
              <p className="text-[13px] text-theme-muted mt-2">
                Upload a YouTube link and it plays directly inside the platform.
              </p>
            </TabBlock>

            <TabBlock emoji="👥" name="Cell">
              <p>Interest-based community groups.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Dating", "Marriage", "Worship", "Bible Reading", "Christian Books", "Working Christians", "Youth"].map((tag) => (
                  <span key={tag} className="text-[12px] bg-theme-surface-2 border border-theme-border rounded-full px-2.5 py-0.5 text-theme-text">{tag}</span>
                ))}
              </div>
              <p className="text-[13px] text-theme-muted mt-2">Deep fellowship through chat and conversation.</p>
            </TabBlock>

            <TabBlock emoji="👤" name="Profile">
              <ul className="mt-1 space-y-1 list-disc pl-4">
                <li>Your posts and content</li>
                <li>Followers · Following</li>
                <li>Subscribed channels (Crow activity)</li>
                <li>Personal spiritual life — Prayer notes · Life journal · DM prayer requests</li>
              </ul>
            </TabBlock>
          </div>
        </Section>

        <Section title="3. The Crow Subscription System">
          <div className="rounded-2xl bg-theme-surface-2 border border-theme-border px-5 py-4 space-y-3">
            <p className="text-[14px] text-theme-text leading-relaxed">
              Subscribers on Cellah are called <strong>Crows</strong>.
              A Crow is not just a subscriber — they participate in content ministry.
            </p>
            <p className="text-[13px] text-theme-muted italic leading-relaxed">
              In Scripture, God sent food to Elijah in the wilderness through ravens (crows).
              That provision was quiet, unannounced — yet unmistakably God&apos;s work.
            </p>
          </div>
          <ul className="mt-4 space-y-1.5 list-disc pl-4 text-[14px] text-theme-text">
            <li>Subscribe to content channels</li>
            <li>Access premium content</li>
            <li>Support ministry creators</li>
          </ul>
        </Section>

        <Section title="4. Content Ecosystem">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <RoleCard emoji="🌍" title="Missionary / Minister" items={["Create ministry content", "Share ministry stories"]} />
            <RoleCard emoji="🎥" title="Content Creator" items={["Video production & editing", "Content education"]} />
            <RoleCard emoji="👁️" title="Viewer" items={["Watch content", "Subscribe (Crow)", "Community participation"]} />
          </div>
          <p className="text-[13px] text-theme-muted mt-3 text-center">
            Missionary → Creator → Viewer: a healthy content ecosystem
          </p>
        </Section>

        <Section title="5. Cellah Core Loop">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-2">
            {[
              { n: "1️⃣", label: "Discover" },
              { n: "2️⃣", label: "Consume" },
              { n: "3️⃣", label: "Participate" },
              { n: "4️⃣", label: "Pray" },
              { n: "5️⃣", label: "Subscribe" },
            ].map(({ n, label }, i, arr) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex flex-col items-center text-center">
                  <span className="text-xl">{n}</span>
                  <span className="text-[12px] font-medium text-theme-text mt-0.5">{label}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-theme-muted text-lg hidden sm:inline">→</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[13px] text-theme-muted mt-3 text-center">
            This loop repeats — and the platform grows.
          </p>
        </Section>

        <Section title="6. Cellah's Core Philosophy">
          <p className="text-[14px] text-theme-text leading-relaxed">
            Cellah is not just another social media platform.
          </p>
          <ul className="mt-3 space-y-1.5 list-disc pl-4 text-[14px] text-theme-text">
            <li>Share life together</li>
            <li>Pray for one another</li>
            <li>Spread ministry through content</li>
          </ul>
          <p className="text-[14px] text-theme-text mt-3 font-medium">
            And that ministry is quietly supported by the Crows. 🐦
          </p>
        </Section>

        <div className="pt-2 border-t border-theme-border/60">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 rounded-xl bg-theme-primary px-5 py-3 text-[14px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            Get started →
          </Link>
        </div>

      </div>
    </TimelineContainer>
  );
}

/* ─────────────── Shared sub-components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[16px] font-bold text-theme-text border-b border-theme-border/60 pb-2">{title}</h2>
      <div className="text-[14px] text-theme-text leading-relaxed">{children}</div>
    </section>
  );
}

function PillarCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-theme-border bg-theme-surface-2 px-4 py-3 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <span className="text-[14px] font-semibold text-theme-text">{title}</span>
      </div>
      <p className="text-[12px] text-theme-muted">{desc}</p>
    </div>
  );
}

function RoleCard({ emoji, title, items }: { emoji: string; title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-theme-border bg-theme-surface-2 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <span className="text-[13px] font-semibold text-theme-text">{title}</span>
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item} className="text-[12px] text-theme-muted">· {item}</li>
        ))}
      </ul>
    </div>
  );
}

function TabBlock({ emoji, name, children, ko }: { emoji: string; name: string; children: React.ReactNode; ko?: boolean }) {
  void ko;
  return (
    <div className="rounded-xl border border-theme-border bg-theme-surface-2 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <span className="text-[14px] font-semibold text-theme-text">{name}</span>
      </div>
      <div className="text-[13px] text-theme-text/80 leading-relaxed pl-1">{children}</div>
    </div>
  );
}
