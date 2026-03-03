import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — CSM",
  description: "Terms of use and community guidelines for CSM.",
};

function getContactEmail(): string {
  return process.env.CONTACT_EMAIL ?? "contact@example.com";
}

export default function TermsPage() {
  const contactEmail = getContactEmail();

  return (
    <div className="mx-auto max-w-[65ch] px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded mb-10 inline-block"
      >
        ← Back
      </Link>
      <h1 className="text-2xl sm:text-3xl font-serif font-normal text-gray-800 tracking-tight">
        Terms of use
      </h1>

      <section className="mt-8">
        <h2 className="text-lg font-serif font-normal text-gray-800">Acceptance of terms</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          By using CSM you agree to these terms and to our community guidelines. If you do not agree, please do not use the service.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">Community guidelines</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          We ask that you treat others with respect. Harassment, hate speech, threats, or deliberate harm have no place here. Disagreement is fine; personal attacks and abuse are not. We are a community-first space, not a corporate platform—we rely on mutual respect and accountability.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">Content responsibility</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          You are responsible for the content you post. Do not post material that infringes others’ rights or that you do not have permission to share. We may remove content that violates our guidelines or the law.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">Moderation</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          We reserve the right to moderate content and to hide posts or remove comments that break our guidelines. We may suspend or terminate accounts that repeatedly violate the rules or that pose a risk to the community.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">Account termination</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          You may stop using the service at any time. We may suspend or terminate your access if you breach these terms or for operational or safety reasons. We will handle data as described in our Privacy page.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">Changes to terms</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          We may update these terms from time to time. We will post the updated version here and, for material changes, we will notify you where practical. Continued use after changes means you accept the updated terms.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">Contact</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          Questions about these terms? Email us at{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-gray-800 font-medium underline hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
          >
            {contactEmail}
          </a>
          .
        </p>
      </section>

      <p className="mt-14 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
          ← Return home
        </Link>
      </p>
    </div>
  );
}
