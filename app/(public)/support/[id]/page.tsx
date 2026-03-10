import Link from "next/link";
import { getMinistryById } from "@/lib/data/repository";
import { notFound } from "next/navigation";
import { SupportFlowForm } from "@/components/SupportFlowForm";

export const dynamic = "force-dynamic";

export default async function SupportMinistryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ministry = await getMinistryById(id);
  if (!ministry) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/support"
        className="text-sm text-theme-muted hover:text-theme-text rounded mb-8 inline-block transition-colors"
      >
        ← 사역 목록
      </Link>
      <h1 className="text-2xl font-semibold text-theme-text">{ministry.name}</h1>
      {ministry.location && (
        <p className="mt-1 text-sm text-theme-muted">{ministry.location}</p>
      )}

      <div className="mt-8">
        <SupportFlowForm ministry={ministry} />
      </div>
    </div>
  );
}
