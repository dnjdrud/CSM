import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getServerLocale();
  const isKo = locale !== "en";

  if (!isKo) return <LandingEn />;
  return <LandingKo />;
}

/* ─────────────────────────────────── Korean ── */

function LandingKo() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <section
        className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:pt-32 sm:pb-28"
        aria-labelledby="hero-heading"
      >
        <h1
          id="hero-heading"
          className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-gray-800 tracking-tight leading-[1.12]"
        >
          Cellah&apos; — 디지털 엑소더스의 시작
        </h1>
        <p className="mt-8 text-xl sm:text-2xl text-gray-600 font-sans max-w-xl leading-relaxed">
          세상의 소음으로 가득한 디지털 공간에서 하나님 나라의 공동체로.
        </p>
        <div className="mt-14 flex flex-col sm:flex-row gap-3">
          <Link
            href="/feed"
            className="inline-flex items-center justify-center rounded-lg bg-gray-800 px-6 py-3 text-base font-medium text-gray-50 transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
          >
            조용히 들어가기
          </Link>
          <Link
            href="#why"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-transparent px-6 py-3 text-base font-medium text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
          >
            비전 읽기
          </Link>
        </div>
      </section>

      {/* 1. 비전 (Why) */}
      <section
        id="why"
        className="mx-auto max-w-3xl px-4 py-16 sm:py-24 border-t border-gray-200"
        aria-labelledby="why-heading"
      >
        <h2
          id="why-heading"
          className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight"
        >
          1. 비전과 존재 이유 (Why)
        </h2>
        <div className="mt-8 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-6">
          <p>
            우리가 무엇에 주의를 기울이느냐가 우리의 영성을 형성한다. 깨어 있는 시간의 대부분이 온라인에서 이뤄지는 지금,
            우리가 머무는 디지털 공간은 세상의 소음과 주의를 분산시키는 콘텐츠로 가득 차 있다.
          </p>
          <p>
            Cellah는 디지털 엑소더스를 이끌기 위해 존재한다 — 세상이 만든 정보의 바다에서 하나님 나라가 빚은 온라인 공동체로.
            예수의 제자들이 영적으로 숨쉬고, 순간순간 하나님과 동행하며, 진정으로 중요한 것을 지키는 거룩한 생태계 안에서
            함께 삶을 나눌 수 있는 공간 — 이것이 우리가 존재하는 이유다.
          </p>
        </div>
      </section>

      {/* 2. 문제와 응답 (How) */}
      <section
        id="how"
        className="mx-auto max-w-3xl px-4 py-16 sm:py-24 border-t border-gray-200"
        aria-labelledby="how-heading"
      >
        <h2
          id="how-heading"
          className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight"
        >
          2. 문제와 응답 (How)
        </h2>

        <h3 className="mt-10 text-xl font-semibold text-gray-800">
          [문제] 연출된 자아, 콘텐츠 빈곤, 진정한 연결의 부재
        </h3>
        <ul className="mt-4 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-4 list-none">
          <li>
            <strong className="text-gray-900">영적 피로와 본질의 침식:</strong>{" "}
            거대 소셜 플랫폼과 여과 없는 트렌드는 크리스천을 끊임없이 하나님에서 멀어지게 하는 가치들에 노출시킨다.
            동시에 눈에 띄기 위해 연출되고 완벽한 디지털 자아를 만들어야 한다는 압박 속에서,
            우리는 예수를 따르는 단순함을 잃어가고 있다.
          </li>
          <li>
            <strong className="text-gray-900">크리스천 콘텐츠의 빈곤:</strong> 콘텐츠가 넘쳐나는 시대지만,
            기독교적 세계관에 뿌리를 둔 콘텐츠는 여전히 드물다.
            복음 중심의 콘텐츠가 집중적으로 만들어지고, 발견되고, 나눠질 수 있는 공간이 없다.
          </li>
          <li>
            <strong className="text-gray-900">진정한 온라인 교회의 부재:</strong> 코로나 이후 온라인 존재가
            일상의 중심이 됐음에도, 크리스천이 질문과 고민과 기도를 안전하게 나눌 수 있는 공간은 여전히 없다.
            꾸밈없이 그리스도 중심으로 함께 살아갈 수 있는 공동의 공간이 없다.
          </li>
          <li>
            <strong className="text-gray-900">정보 단절과 후원 피로:</strong> 많은 선교사, 개척 교회, 사역자들이
            하나님이 행하시는 일을 나누고 후원을 요청할 채널이 없다.
            돕고 싶은 성도들은 누구를, 어떻게 후원해야 할지 몰라 지쳐간다.
          </li>
        </ul>

        <h3 className="mt-12 text-xl font-semibold text-gray-800">
          [응답] 진정한 교제와 투명한 후원을 위한 수직적 생태계
        </h3>
        <p className="mt-4 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl">
          우리는 기독교적 삶의 방식 — 말씀, 기도, 예배, 선교, 팟캐스트, 책, 웹툰, 그리고 모든 영역에서의
          평범한 신앙 — 을 중심으로 설계된 공동체 플랫폼을 만들고 있다.
          세상의 소음과 연출에서 걸러진 공간에서 투명하고 진실한 영적 연결을 위한 자리를 마련하고 싶다.
          그 안에서 온라인 "셀"들이 글로벌 하나님 나라 공동체로 자라고,
          전 세계 선교사와 사역자들을 향한 맑은 후원의 흐름으로 이어질 수 있도록.
        </p>
      </section>

      {/* 3. 플랫폼 핵심 기능 (What) */}
      <section
        id="what"
        className="mx-auto max-w-3xl px-4 py-16 sm:py-24 border-t border-gray-200"
        aria-labelledby="what-heading"
      >
        <h2
          id="what-heading"
          className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight"
        >
          3. 핵심 플랫폼 기능 (What)
        </h2>

        <div className="mt-10">
          <h3 className="text-xl font-semibold text-gray-800">
            A. 영적 네트워킹 &amp; 크리스천 콘텐츠 허브 (Community &amp; Contents)
          </h3>
          <ul className="mt-4 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-3 list-disc pl-5">
            <li><strong className="text-gray-900">평신도 중심 영적 네트워킹:</strong> 누구나 기도와 묵상과 일상의 예배를
              안전한 공간에서 나누고, 같은 길을 걷는 이들을 만날 수 있다.</li>
            <li><strong className="text-gray-900">크리에이터 생태계:</strong> 기독교 팟캐스트, 웹툰, 설교, 에세이, 찬양 커버 —
              사람들이 실제로 듣고 보는 방식에 맞게 설계된 미디어 플레이어와 함께.</li>
            <li><strong className="text-gray-900">교회와 목회자가 큐레이션한 신뢰할 수 있는 콘텐츠:</strong>{" "}
              흩어져 있던 신뢰할 수 있는 리더들의 가르침, 묵상, 자료들이 한 곳에 모인다.</li>
            <li><strong className="text-gray-900">글로벌 디아스포라 연결:</strong> 지리적 거리를 넘어
              전 세계의 성도와 선교사들이 서로를 발견하고 격려할 수 있다.</li>
          </ul>
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-800">
            B. 오픈 셀 &amp; 다이렉트 메시지 (Connection: 유기적 공동체)
          </h3>
          <ul className="mt-4 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-3 list-disc pl-5">
            <li><strong className="text-gray-900">오픈 셀 (온라인 셀 그룹):</strong> 말씀, 기도, 직업, 삶의 계절 등
              관심사 중심의 온라인 셀방 — 더 깊고 집중된 교제의 공간.</li>
            <li><strong className="text-gray-900">다이렉트 메시지 &amp; 그룹 채팅:</strong> 1:1 또는 소그룹이
              기도를 나누고 함께 걸어갈 수 있는 사적인 공간.</li>
            <li><strong className="text-gray-900">크리스천 이모지 &amp; 표현:</strong> 트렌드가 아닌
              축복, 기도, 교회 절기로 빚어진 시각 언어.</li>
          </ul>
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-800">
            C. 직접 후원 &amp; 핀테크
          </h3>
          <ul className="mt-4 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-3 list-disc pl-5">
            <li><strong className="text-gray-900">모두가 크리에이터 (직접 후원):</strong>{" "}
              선교사, 개척 교회, 크리에이터가 현장의 이야기를 나누고
              플랫폼 안에서 투명하게 후원을 받을 수 있는 간단한 방법.</li>
            <li className="text-gray-600">(예정) 1:1 크리에이터 코칭 — 디지털 도구가 낯선 분들을 위한 돌봄.</li>
            <li className="text-gray-600">(예정) 타임-투-도네이트: 짧은 후원 영상을 시청해 크레딧을 적립하는
              소액 기부 지원 기능.</li>
            <li className="text-gray-600">(예정) 임팩트 프로 멤버십: 긴급 선교와 구호에 직접 흘러가는 월정 구독,
              조용한 &apos;임팩트 서포터&apos; 뱃지와 정기 선한 영향력 리포트 제공.</li>
          </ul>
        </div>
      </section>

      {/* 까마귀 구독 */}
      <section
        id="crow"
        className="mx-auto max-w-3xl px-4 py-16 sm:py-24 border-t border-gray-200"
        aria-labelledby="crow-heading"
      >
        <h2
          id="crow-heading"
          className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight"
        >
          4. 까마귀 구독 시스템
        </h2>
        <div className="mt-8 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-6">
          <p>
            Cellah의 구독자는 <strong className="text-gray-900">까마귀(Crow)</strong>라고 불린다.
            까마귀는 단순한 구독자가 아니라 콘텐츠 사역에 동참하는 사람이다.
          </p>
          <p className="text-gray-600 italic">
            성경에서 하나님은 광야에 있던 엘리야에게 까마귀를 통해 음식을 보내셨다.
            그 공급은 조용했고, 누가 보낸 것인지 드러나지 않았다.
            하지만 그 공급은 분명히 하나님께서 이루신 일이었다.
          </p>
          <p>
            Cellah에서 <strong className="text-gray-900">까마귀</strong>는 콘텐츠 사역을 조용히 지지하는
            구독자를 의미한다. 까마귀가 되면 콘텐츠 구독, 프리미엄 콘텐츠 시청, 사역 콘텐츠 지원이 가능하다.
          </p>
        </div>
      </section>

      {/* In-page nav & Footer */}
      <section className="mx-auto max-w-3xl px-4 py-12 border-t border-gray-200">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500" aria-label="페이지 내 탐색">
          <a href="#why" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">비전</a>
          <a href="#how" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">문제와 응답</a>
          <a href="#what" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">플랫폼</a>
          <a href="#crow" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">까마귀</a>
        </nav>
        <p className="mt-6 text-sm text-gray-500">
          <Link href="/principles" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">원칙</Link>
          {" · "}
          <Link href="/contact" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">문의</Link>
        </p>
      </section>
    </div>
  );
}

/* ─────────────────────────────────── English ── */

function LandingEn() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <section
        className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:pt-32 sm:pb-28"
        aria-labelledby="hero-heading"
      >
        <h1
          id="hero-heading"
          className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-gray-800 tracking-tight leading-[1.12]"
        >
          Cellah&apos; — the beginning of a digital exodus
        </h1>
        <p className="mt-8 text-xl sm:text-2xl text-gray-600 font-sans max-w-xl leading-relaxed">
          From secular noise online to a gathered community of the Kingdom.
        </p>
        <div className="mt-14 flex flex-col sm:flex-row gap-3">
          <Link
            href="/feed"
            className="inline-flex items-center justify-center rounded-lg bg-gray-800 px-6 py-3 text-base font-medium text-gray-50 transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
          >
            Enter quietly
          </Link>
          <Link
            href="#why"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-transparent px-6 py-3 text-base font-medium text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
          >
            Read the vision
          </Link>
        </div>
      </section>

      {/* 1. Vision (Why) */}
      <section
        id="why"
        className="mx-auto max-w-3xl px-4 py-16 sm:py-24 border-t border-gray-200"
        aria-labelledby="why-heading"
      >
        <h2
          id="why-heading"
          className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight"
        >
          1. Vision and core reason (The &apos;Why&apos;)
        </h2>
        <div className="mt-8 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-6">
          <p>
            We live in an age where wherever our attention rests, our spirituality is formed. Most of
            our waking hours are now spent online. Yet the digital spaces we inhabit are saturated
            with secular noise and distraction designed to fragment our focus.
          </p>
          <p>
            Cellah exists to lead a digital exodus—from the sea of information shaped by the world
            into an online community shaped by the Kingdom. We want followers of Jesus to have a
            place where they can breathe spiritually, walk with God moment by moment, and share
            life together in a holy ecosystem that protects what truly matters. This is why we
            exist.
          </p>
        </div>
      </section>

      {/* 2. Problem & Response (How) */}
      <section
        id="how"
        className="mx-auto max-w-3xl px-4 py-16 sm:py-24 border-t border-gray-200"
        aria-labelledby="how-heading"
      >
        <h2
          id="how-heading"
          className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight"
        >
          2. Problem &amp; response (The &apos;How&apos;)
        </h2>

        <h3 className="mt-10 text-xl font-semibold text-gray-800">
          [Problem] Performed selves, content poverty, and the absence of true connection
        </h3>
        <ul className="mt-4 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-4 list-none">
          <li>
            <strong className="text-gray-900">Spiritual fatigue and erosion of the core:</strong>{" "}
            mega social platforms and unfiltered trends expose Christians to a constant stream of
            values that pull the heart away from God. At the same time we are pushed to construct a
            polished, performative digital self just to be seen—slowly losing the simplicity of
            following Jesus.
          </li>
          <li>
            <strong className="text-gray-900">A poverty of Christian content:</strong> we live in an
            age of endless content, yet material rooted in a Christian worldview is scarce. There
            are few places where gospel-shaped content can be created, discovered, and shared in a
            concentrated way.
          </li>
          <li>
            <strong className="text-gray-900">No true online ecclesia:</strong> even after COVID
            made online presence central to life, there are still few places for Christians to share
            their questions, struggles, and prayers safely. There is no common space for honest,
            unpolished, Christ-centered life together.
          </li>
          <li>
            <strong className="text-gray-900">Information gaps and giving fatigue:</strong> many
            missionaries, church plants, and ministries have few channels to share what God is
            doing and invite support. Believers who want to help often do not know who to support
            or how, and grow tired of sorting through requests.
          </li>
        </ul>

        <h3 className="mt-12 text-xl font-semibold text-gray-800">
          [Solution] A vertical ecosystem for honest fellowship and transparent support
        </h3>
        <p className="mt-4 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl">
          We are building a community platform shaped around the Christian way of life—Scripture,
          prayer, worship, mission, podcasts, books, webtoons, and the ordinary faithfulness of
          believers in every sphere. In a space filtered from secular noise and performance, we want
          to make room for transparent, sincere spiritual connection. From there, online &quot;cells&quot;
          can grow into a global Kingdom community, and into clear streams of support for
          missionaries and ministries across the world.
        </p>
      </section>

      {/* 3. Core Platform Features (What) */}
      <section
        id="what"
        className="mx-auto max-w-3xl px-4 py-16 sm:py-24 border-t border-gray-200"
        aria-labelledby="what-heading"
      >
        <h2
          id="what-heading"
          className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight"
        >
          3. Core platform features &amp; business model (The &apos;What&apos;)
        </h2>

        <div className="mt-10">
          <h3 className="text-xl font-semibold text-gray-800">
            A. Spiritual networking &amp; Christian content hub (Community &amp; Content)
          </h3>
          <ul className="mt-4 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-3 list-disc pl-5">
            <li><strong className="text-gray-900">Lay-led spiritual networking:</strong> any believer
              can share prayers, reflections, and everyday worship in a safe space, and find others
              walking the same path.</li>
            <li><strong className="text-gray-900">Creator ecosystem:</strong> a home for Christian
              podcasts, webtoons, sermons, essays, and worship covers—with media players designed to
              fit how people actually listen and watch.</li>
            <li><strong className="text-gray-900">Trusted curation from churches and pastors:</strong>{" "}
              channels where teaching, reflections, and resources from trusted leaders are gathered
              instead of scattered.</li>
            <li><strong className="text-gray-900">Global diaspora connection:</strong> believers and
              missionaries across the world can find and encourage one another beyond geographic
              distance.</li>
          </ul>
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-800">
            B. Open Cell &amp; Direct Message (Connection: organic community)
          </h3>
          <ul className="mt-4 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-3 list-disc pl-5">
            <li><strong className="text-gray-900">Open Cell (online cell groups):</strong> online cell
              rooms around Scripture, prayer, vocation, seasons of life, and more—places for deeper,
              focused fellowship.</li>
            <li><strong className="text-gray-900">Direct Message &amp; group chat:</strong> private
              spaces for 1:1 or small groups to share prayers and walk together.</li>
            <li><strong className="text-gray-900">Christian emoji &amp; expression:</strong> a
              visual language shaped by blessing, prayer, and the church calendar rather than
              trends.</li>
          </ul>
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-800">
            C. Direct support &amp; fintech
          </h3>
          <ul className="mt-4 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-3 list-disc pl-5">
            <li><strong className="text-gray-900">Everyone as a creator (direct sponsoring):</strong>{" "}
              a simple way for missionaries, church plants, and creators to share what is happening
              on the ground and receive transparent, in-platform support.</li>
            <li className="text-gray-600">(Planned) 1:1 creator coaching and care for those who are
              new to digital tools.</li>
            <li className="text-gray-600">(Planned) Time-to-Donate: watching a short sponsor video to
              generate credits for those who want to give but have limited finances.</li>
            <li className="text-gray-600">(Planned) Impact Pro membership: a monthly subscription
              that flows directly to urgent missions and relief, with a quiet &quot;impact
              supporter&quot; badge and a regular Good Impact Report.</li>
          </ul>
        </div>
      </section>

      {/* Crow Subscription */}
      <section
        id="crow"
        className="mx-auto max-w-3xl px-4 py-16 sm:py-24 border-t border-gray-200"
        aria-labelledby="crow-heading"
      >
        <h2
          id="crow-heading"
          className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight"
        >
          4. The Crow Subscription System
        </h2>
        <div className="mt-8 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-6">
          <p>
            Subscribers on Cellah are called <strong className="text-gray-900">Crows</strong>.
            A Crow is not merely a subscriber—they are someone who participates in the content ministry.
          </p>
          <p className="text-gray-600 italic">
            In Scripture, God sent food to Elijah in the wilderness through ravens (crows).
            That provision was quiet, unannounced, unseen. Yet it was unmistakably God&apos;s work.
          </p>
          <p>
            On Cellah, a <strong className="text-gray-900">Crow</strong> is a subscriber who quietly
            supports content ministry. Crows can subscribe to content, access premium content,
            and support ministry creators.
          </p>
        </div>
      </section>

      {/* In-page nav & Footer */}
      <section className="mx-auto max-w-3xl px-4 py-12 border-t border-gray-200">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500" aria-label="In-page navigation">
          <a href="#why" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Why</a>
          <a href="#how" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Problem &amp; response</a>
          <a href="#what" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Platform</a>
          <a href="#crow" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Crow</a>
        </nav>
        <p className="mt-6 text-sm text-gray-500">
          <Link href="/principles" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Principles</Link>
          {" · "}
          <Link href="/contact" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Contact</Link>
        </p>
      </section>
    </div>
  );
}
