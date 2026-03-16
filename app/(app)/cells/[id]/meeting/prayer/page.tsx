import { redirect } from "next/navigation";

export default async function MeetingPrayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/cells/${id}/meeting/pray`);
}
