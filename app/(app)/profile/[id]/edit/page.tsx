import { redirect } from "next/navigation";

// Canonical profile editing is at /settings/profile.
// /profile/[id]/edit has no visible navigation entry — redirect to the canonical path.
export default function ProfileEditPage() {
  redirect("/settings/profile");
}
