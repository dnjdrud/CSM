import { supabaseServer } from "@/lib/supabase/server";

export async function getCreatorStats(authorId: string): Promise<{
  postCount: number;
  totalPrayed: number;
  totalWithYou: number;
  totalComments: number;
}> {
  const supabase = await supabaseServer();
  const { data: posts } = await supabase.from("posts").select("id").eq("author_id", authorId);
  const postIds = (posts ?? []).map((p: any) => p.id);
  if (!postIds.length) return { postCount: 0, totalPrayed: 0, totalWithYou: 0, totalComments: 0 };

  const [reactionData, commentData] = await Promise.all([
    supabase.from("reactions").select("type").in("post_id", postIds),
    supabase.from("comments").select("id", { count: "exact", head: true }).in("post_id", postIds),
  ]);

  const reactions = reactionData.data ?? [];
  return {
    postCount: postIds.length,
    totalPrayed:   reactions.filter((r: any) => r.type === "PRAYED").length,
    totalWithYou:  reactions.filter((r: any) => r.type === "WITH_YOU").length,
    totalComments: commentData.count ?? 0,
  };
}
