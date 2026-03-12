"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMissionaryProject,
  createMissionaryReport,
  toggleMissionarySupport,
  getCurrentUser,
} from "@/lib/data/repository";

export async function createProjectAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const title = formData.get("title")?.toString().trim();
  const country = formData.get("country")?.toString().trim();
  const field = formData.get("field")?.toString().trim();
  const description = formData.get("description")?.toString().trim();

  if (!title || title.length < 2) return;

  const project = await createMissionaryProject({
    missionaryId: user.id,
    title,
    country: country || undefined,
    field: field || undefined,
    description: description || undefined,
  });

  revalidatePath("/missionary");
  revalidatePath("/missions");
  redirect(`/missions/${project.id}`);
}

export async function submitReportAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const projectId = formData.get("projectId")?.toString();
  const content = formData.get("content")?.toString().trim();

  if (!projectId || !content || content.length < 10) return;

  await createMissionaryReport(projectId, content);
  revalidatePath(`/missions/${projectId}`);
  revalidatePath("/missionary/reports");
}

export async function toggleSupportAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const projectId = formData.get("projectId")?.toString();
  if (!projectId) return;

  await toggleMissionarySupport(projectId, user.id);
  revalidatePath(`/missions/${projectId}`);
  revalidatePath("/missionary/supporters");
}
