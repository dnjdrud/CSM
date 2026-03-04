import Link from "next/link";

export default function HomePage() {
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

      {/* 1. Vision and core reason (The 'Why') */}
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

      {/* 2. Problem & approach (The 'How') */}
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

      {/* 3. Core platform features & business model (The 'What') */}
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

        {/* A. Spiritual networking & Christian content hub */}
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

        {/* B. Open Cell & Direct Message */}
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

        {/* C. Direct support & fintech */}
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

      {/* In-page nav & Footer */}
      <section className="mx-auto max-w-3xl px-4 py-12 border-t border-gray-200">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500" aria-label="In-page navigation">
          <a href="#why" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Why</a>
          <a href="#how" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Problem &amp; response</a>
          <a href="#what" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Platform</a>
        </nav>
        <p className="mt-6 text-sm text-gray-500">
          <Link href="/principles" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Principles</Link>
          {" · "}
          <Link href="/support" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Support</Link>
          {" · "}
          <Link href="/contact" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">Contact</Link>
        </p>
      </section>
    </div>
  );
}
