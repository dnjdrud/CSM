import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Redirect to unified notification settings under /settings/notifications
export default function NotificationsSettingsRedirect() {
  redirect("/settings/notifications");
}
