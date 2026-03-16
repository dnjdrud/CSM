import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePrayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/profile/${id}`);
}
