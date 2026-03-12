"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPrayerRequest,
  intercedeForPrayer,
  removeIntercession,
  markPrayerAnswered,
  deletePrayerRequest,
} from "@/lib/data/repository";
import { getCurrentUser } from "@/lib/data/repository";
import type { PrayerCategory } from "@/lib/domain/types";

export async function createPrayerRequestAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const content = formData.get("content")?.toString().trim();
  const category = (formData.get("category")?.toString() ?? "PERSONAL") as PrayerCategory;
  const visibility = (formData.get("visibility")?.toString() ?? "PUBLIC") as "PUBLIC" | "CELL" | "PRIVATE";

  if (!content || content.length < 5 || content.length > 1000) return;

  const req = await createPrayerRequest({ userId: user.id, content, category, visibility });
  revalidatePath("/prayer");
  redirect(`/prayer/${req.id}`);
}

export async function intercedeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const prayerRequestId = formData.get("prayerRequestId")?.toString();
  const message = formData.get("message")?.toString().trim();
  if (!prayerRequestId) return;

  await intercedeForPrayer(prayerRequestId, user.id, message || undefined);
  revalidatePath(`/prayer/${prayerRequestId}`);
}

export async function removeIntercedeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const prayerRequestId = formData.get("prayerRequestId")?.toString();
  if (!prayerRequestId) return;

  await removeIntercession(prayerRequestId, user.id);
  revalidatePath(`/prayer/${prayerRequestId}`);
}

export async function markAnsweredAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const prayerRequestId = formData.get("prayerRequestId")?.toString();
  const answerNote = formData.get("answerNote")?.toString().trim();
  if (!prayerRequestId) return;

  await markPrayerAnswered(prayerRequestId, user.id, answerNote || undefined);
  revalidatePath(`/prayer/${prayerRequestId}`);
  revalidatePath("/prayer");
  revalidatePath("/prayer/my");
}

export async function deletePrayerRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const id = formData.get("id")?.toString();
  if (!id) return;

  await deletePrayerRequest(id, user.id);
  revalidatePath("/prayer");
  revalidatePath("/prayer/my");
  redirect("/prayer");
}
