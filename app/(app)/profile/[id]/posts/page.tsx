import { redirect } from "next/navigation";

// Canonical posts view is the main profile page (/profile/[id]).
// This subroute has no visible navigation entry — redirect to the canonical path.
export default async function ProfilePostsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/profile/${id}`);
}
