import { redirect } from "next/navigation";

// /topics tag hub is retired.
// Tag browsing is available in Search (태그 탭).
export default function TopicsPage() {
  redirect("/search?tab=tags");
}
