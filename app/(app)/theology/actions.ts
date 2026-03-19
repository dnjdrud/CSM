"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getCurrentUser,
  createTheologyQuestion,
  deleteTheologyQuestion,
  createTheologyAnswer,
  toggleTheologyAnswerVote,
  acceptTheologyAnswer,
} from "@/lib/data/repository";
import type { TheologyCategory } from "@/lib/domain/types";

export async function createQuestionAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const title = formData.get("title")?.toString().trim();
  const content = formData.get("content")?.toString().trim();
  const category = (formData.get("category")?.toString() ?? "GENERAL") as TheologyCategory;

  if (!title || title.length < 5 || !content || content.length < 10) return;

  const q = await createTheologyQuestion({ userId: user.id, title, content, category });
  revalidatePath("/theology");
  redirect(`/theology/${q.id}`);
}

export async function deleteQuestionAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const id = formData.get("id")?.toString();
  if (!id) return;
  await deleteTheologyQuestion(id, user.id);
  revalidatePath("/theology");
  redirect("/theology");
}

export async function submitAnswerAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const questionId = formData.get("questionId")?.toString();
  const content = formData.get("content")?.toString().trim();
  if (!questionId || !content || content.length < 10) return;
  await createTheologyAnswer(questionId, user.id, content);
  revalidatePath(`/theology/${questionId}`);
}

export async function voteAnswerAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const answerId = formData.get("answerId")?.toString();
  const questionId = formData.get("questionId")?.toString();
  if (!answerId || !questionId) return;
  await toggleTheologyAnswerVote(answerId, user.id);
  revalidatePath(`/theology/${questionId}`);
}

export async function acceptAnswerAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const answerId = formData.get("answerId")?.toString();
  const questionId = formData.get("questionId")?.toString();
  if (!answerId || !questionId) return;
  await acceptTheologyAnswer(answerId, questionId);
  revalidatePath(`/theology/${questionId}`);
}
