import Link from "next/link";

export default function PrinciplesPage() {
  return (
    <div className="mx-auto max-w-[65ch] px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded mb-10 inline-block"
      >
        ← Back
      </Link>
      <h1 className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight">
        Our principles
      </h1>
      <p className="mt-5 text-gray-700 font-sans leading-7">
        Restraint over feature richness. Clarity over cleverness. Reverence over optimization.
      </p>

      <ul className="mt-14 sm:mt-16 space-y-12 list-none p-0" role="list">
        <li>
          <h2 className="text-lg font-serif font-normal text-gray-800">
            Algorithm-free
          </h2>
          <p className="mt-3 text-gray-700 font-sans leading-7">
            Chronological order only. No recommendations or “for you” feeds. What you see is what the community posted, in time order.
          </p>
        </li>
        <li>
          <h2 className="text-lg font-serif font-normal text-gray-800">
            No ads, no trends
          </h2>
          <p className="mt-3 text-gray-700 font-sans leading-7">
            The space is funded and run without selling attention or surfacing what’s “hot.” You are not the product.
          </p>
        </li>
        <li>
          <h2 className="text-lg font-serif font-normal text-gray-800">
            Psychological and spiritual safety first
          </h2>
          <p className="mt-3 text-gray-700 font-sans leading-7">
            This is a sanctuary, not a stage. An environment where people can share prayer, testimony, and mission without performative pressure.
          </p>
        </li>
        <li>
          <h2 className="text-lg font-serif font-normal text-gray-800">
            Slow content, intentional reading
          </h2>
          <p className="mt-3 text-gray-700 font-sans leading-7">
            No engagement metrics, like counts, or rankings. Responses like “I prayed” or “With you” are for connection, not vanity.
          </p>
        </li>
        <li>
          <h2 className="text-lg font-serif font-normal text-gray-800">
            Giving is reverent
          </h2>
          <p className="mt-3 text-gray-700 font-sans leading-7">
            Support for ministry is transparent and intentional. No spiritual exploitation, no public goals or pressure. Giving is between the giver, the ministry, and God.
          </p>
        </li>
      </ul>

      <p className="mt-14 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
          ← Return home
        </Link>
      </p>
    </div>
  );
}
