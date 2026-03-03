import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section
        className="mx-auto max-w-3xl px-4 pt-24 pb-32 sm:pt-32 sm:pb-40"
        aria-labelledby="hero-heading"
      >
        <h1
          id="hero-heading"
          className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-gray-800 tracking-tight leading-[1.12]"
        >
          A digital sanctuary for the Christian life
        </h1>
        <p className="mt-8 text-xl sm:text-2xl text-gray-600 font-sans max-w-xl leading-relaxed">
          No algorithms. No ads. No noise.
        </p>
        <p className="mt-3 text-lg text-gray-700 font-sans max-w-lg leading-relaxed">
          A place for prayer, Scripture, testimony, and mission.
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
            Why this exists
          </Link>
        </div>
      </section>

      {/* Why this exists */}
      <section
        id="why"
        className="mx-auto max-w-3xl px-4 py-24 sm:py-32 border-t border-gray-200"
        aria-labelledby="why-heading"
      >
        <h2
          id="why-heading"
          className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight"
        >
          Why this exists
        </h2>
        <div className="mt-8 text-lg text-gray-800 font-sans leading-relaxed max-w-2xl space-y-6">
          <p>
            CSM exists to extend the life you already live—
            prayer, Scripture, testimony, and mission—into a digital space shaped by care, not competition.
          </p>
          <p>
            This is not a platform built to capture attention, amplify outrage, or sell your presence.
            There are no algorithms deciding what matters, no ads interrupting what is sacred.
          </p>
          <p>
            Here, sharing is intentional.
            <br />
            Response is relational.
            <br />
            Support for ministry happens quietly, transparently, and without spectacle.
          </p>
          <p>
            CSM is a place to remain human—and faithful—online.
          </p>
        </div>
        <p className="mt-8 text-sm text-gray-500 font-sans">
          <Link
            href="/principles"
            className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
          >
            Principles
          </Link>
          {" · "}
          <Link
            href="/support"
            className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
          >
            Support
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer
        className="mx-auto max-w-3xl px-4 py-16 sm:py-20 border-t border-gray-200"
        role="contentinfo"
      >
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500" aria-label="Footer navigation">
          <Link href="/principles" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
            Principles
          </Link>
          <Link href="/support" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
            Support
          </Link>
          <Link href="/contact" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
            Contact
          </Link>
        </nav>
        <p className="mt-6 text-sm text-gray-500">
          CSM
        </p>
      </footer>
    </div>
  );
}
