import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Legacy /feed route.
 * This page is no longer used; all feed content lives at /home (feed 탭).
 * Keep the route but immediately redirect so 기존 링크/리다이렉트가 깨지지 않는다.
 */
export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
  }
  const target = qs.toString() ? `/home?${qs.toString()}` : "/home";
  redirect(target);
}
