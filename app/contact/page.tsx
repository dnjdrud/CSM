import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — CSM",
  description:
    "Get in touch with the CSM community operators. Email, report a concern, or request access.",
};

function getContactEmail(): string {
  return process.env.CONTACT_EMAIL ?? "dndnjsrud123@naver.com";
}

export default function ContactPage() {
  const email = getContactEmail();

  return (
    <div className="mx-auto max-w-[65ch] px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded mb-10 inline-block"
      >
        ← Back
      </Link>
      <h1 className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight">
        Contact
      </h1>
      <p className="mt-5 text-gray-700 font-sans leading-7">
        We’re a small team running this space. If you need to reach us, use one of the options below.
      </p>

      <ul className="mt-14 sm:mt-16 space-y-12 list-none p-0" role="list">
        <li>
          <h2 className="text-lg font-serif font-normal text-gray-800">
            Email
          </h2>
          <p className="mt-3 text-gray-700 font-sans leading-7">
            For general questions, feedback, or partnership inquiries, email us.
          </p>
          <p className="mt-3">
            <a
              href={`mailto:${email}`}
              className="text-gray-800 font-medium underline hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
            >
              {email}
            </a>
          </p>
          <p className="mt-2 text-sm text-gray-600">
            For abuse reports, include links and details.
          </p>
        </li>
        <li>
          <h2 className="text-lg font-serif font-normal text-gray-800">
            Report a concern
          </h2>
          <p className="mt-3 text-gray-700 font-sans leading-7">
            If something in the community worries you—a post or a comment—use the in-app Report option on that content. Reports are reviewed by the team.
          </p>
          <p className="mt-3">
            <Link
              href="/feed"
              className="text-gray-800 font-medium underline hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
            >
              Go to feed
            </Link>
          </p>
        </li>
        <li>
          <h2 className="text-lg font-serif font-normal text-gray-800">
            Invite request
          </h2>
          <p className="mt-3 text-gray-700 font-sans leading-7">
            CSM is invite-only. If you’d like to join, request an invite from someone who’s already in the community, or reach out to us by email above.
          </p>
          <p className="mt-3">
            <Link
              href="/onboarding"
              className="text-gray-800 font-medium underline hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
            >
              Sign in / onboarding
            </Link>
          </p>
        </li>
      </ul>

      <p className="mt-14 text-sm text-gray-500 font-sans">
        We usually reply within 2–3 business days.
      </p>

      <p className="mt-10 text-sm text-gray-500">
        <Link
          href="/"
          className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        >
          ← Return home
        </Link>
      </p>
    </div>
  );
}
