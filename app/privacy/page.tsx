import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — CSM",
  description: "How CSM collects, uses, and stores your data. Plain English.",
};

function getContactEmail(): string {
  return process.env.CONTACT_EMAIL ?? "contact@example.com";
}

export default function PrivacyPage() {
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
        Privacy
      </h1>

      <section className="mt-8">
        <h2 className="text-lg font-serif font-normal text-gray-800">Introduction</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          We run this space with care for your privacy. This page explains what we collect, how we use it, and your rights. We do not run ads or sell your data.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">What we collect</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          We collect the information needed to run the service: your email (for sign-in), profile information (name, role, optional bio), and the content you post—posts, comments, and reactions. We do not track you across other sites.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">How we use data</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          We use your data only to operate the community: to show the feed, deliver notifications, enforce community guidelines, and respond to support or abuse reports. We do not use it for advertising or analytics beyond basic operational needs.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">No ads, no selling data</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          We do not show ads. We do not sell, rent, or share your data with third parties for marketing. Data is used only as described above.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">Data storage</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          Data is stored with Supabase (hosted infrastructure). Data at rest is encrypted. We choose providers that respect privacy and security best practices.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">Your rights</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          You can request deletion of your account and associated data. Contact us at the email below and we will process the request in a reasonable time.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-serif font-normal text-gray-800">Contact</h2>
        <p className="mt-3 text-gray-700 font-sans leading-7">
          For privacy requests or questions, email us at{" "}
          <a href={`mailto:${contactEmail}`} className="text-gray-800 font-medium underline hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
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
