import { redirect } from "next/navigation";
import { getSession, hasSeenIntro } from "@/server/session";

export default async function Home() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role === "son") redirect("/admin");
  redirect((await hasSeenIntro(s.role)) ? "/rooms" : "/welcome");
}
