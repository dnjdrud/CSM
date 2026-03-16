import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CellPrayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/cells/${id}`);
}
