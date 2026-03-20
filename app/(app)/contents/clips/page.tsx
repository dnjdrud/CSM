import { listAllClips } from "@/lib/data/supabaseRepository";
import { ClipsFeed } from "./_components/ClipsFeed";

export const dynamic = "force-dynamic";
export const metadata = { title: "클립 – Cellah" };

export default async function ClipsPage() {
  const clips = await listAllClips(50);

  return (
    <div className="fixed inset-0 bg-black z-20">
      <ClipsFeed clips={clips} />
    </div>
  );
}
