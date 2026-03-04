import { redirect } from "next/navigation";

/**
 * Invites feature was removed. Redirect old links and bookmarks to Signups.
 */
export default function AdminInvitesRedirectPage() {
  redirect("/admin/signup-requests");
}
