import type { TheologyQuestion, TheologyCategory, TheologyAnswer } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { rowToUser } from "./_internal/postHelpers";

// ── Row mapper ────────────────────────────────────────────────────────────────

function rowToTheologyQuestion(r: {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  users?: { id: string; name: string | null; role: string | null; bio: string | null; affiliation: string | null; created_at: string | null; avatar_url?: string | null } | null;
  theology_answers?: { count: number }[] | null;
}): TheologyQuestion {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    content: r.content,
    category: r.category as TheologyCategory,
    createdAt: r.created_at,
    author: r.users ? rowToUser(r.users as any) : undefined,
    answerCount: r.theology_answers?.[0]?.count ?? 0,
  };
}

// ── Question queries ──────────────────────────────────────────────────────────

export async function listTheologyQuestions(
  opts: { category?: TheologyCategory; limit?: number } = {}
): Promise<TheologyQuestion[]> {
  const supabase = await supabaseServer();
  let q = supabase
    .from("theology_questions")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), theology_answers(count)")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 30);
  if (opts.category) q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) { console.error("[listTheologyQuestions]", error.message); return []; }
  return (data ?? []).map((r: any) => rowToTheologyQuestion(r));
}

export async function getTheologyQuestionById(
  id: string,
  _viewerId?: string | null
): Promise<TheologyQuestion | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("theology_questions")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), theology_answers(count)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return rowToTheologyQuestion(data as any);
}

// ── Question mutations ────────────────────────────────────────────────────────

export async function createTheologyQuestion(input: {
  userId: string;
  title: string;
  content: string;
  category: TheologyCategory;
}): Promise<TheologyQuestion> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("theology_questions")
    .insert({
      user_id: input.userId,
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category,
    })
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), theology_answers(count)")
    .single();
  if (error) throw new Error(error.message);
  return rowToTheologyQuestion(data as any);
}

export async function deleteTheologyQuestion(id: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("theology_questions").delete().eq("id", id).eq("user_id", userId);
}

// ── Answer queries ────────────────────────────────────────────────────────────

export async function listTheologyAnswers(
  questionId: string,
  viewerId?: string | null
): Promise<TheologyAnswer[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("theology_answers")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), theology_answer_votes(count)")
    .eq("question_id", questionId)
    .order("is_accepted", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) return [];

  const rows = (data ?? []) as any[];
  if (!viewerId)
    return rows.map((r: any) => ({
      id: r.id, questionId: r.question_id, userId: r.user_id, content: r.content,
      isAccepted: r.is_accepted, createdAt: r.created_at,
      author: r.users ? rowToUser(r.users) : undefined,
      voteCount: r.theology_answer_votes?.[0]?.count ?? 0, hasVoted: false,
    }));

  const answerIds = rows.map((r: any) => r.id);
  const { data: votes } = await supabase
    .from("theology_answer_votes")
    .select("answer_id")
    .in("answer_id", answerIds)
    .eq("user_id", viewerId);
  const votedSet = new Set((votes ?? []).map((v: any) => v.answer_id));

  return rows.map((r: any) => ({
    id: r.id, questionId: r.question_id, userId: r.user_id, content: r.content,
    isAccepted: r.is_accepted, createdAt: r.created_at,
    author: r.users ? rowToUser(r.users) : undefined,
    voteCount: r.theology_answer_votes?.[0]?.count ?? 0,
    hasVoted: votedSet.has(r.id),
  }));
}

// ── Answer mutations ──────────────────────────────────────────────────────────

export async function createTheologyAnswer(
  questionId: string,
  userId: string,
  content: string
): Promise<void> {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("theology_answers")
    .insert({ question_id: questionId, user_id: userId, content: content.trim() });
  if (error) throw new Error(error.message);
}

export async function toggleTheologyAnswerVote(
  answerId: string,
  userId: string
): Promise<"added" | "removed"> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("theology_answer_votes")
    .select("id")
    .eq("answer_id", answerId)
    .eq("user_id", userId)
    .single();
  if (existing) {
    await supabase.from("theology_answer_votes").delete().eq("id", existing.id);
    return "removed";
  }
  await supabase.from("theology_answer_votes").insert({ answer_id: answerId, user_id: userId });
  return "added";
}

export async function acceptTheologyAnswer(answerId: string, questionId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("theology_answers").update({ is_accepted: false }).eq("question_id", questionId);
  await supabase.from("theology_answers").update({ is_accepted: true }).eq("id", answerId);
}
