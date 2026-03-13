"use server";

export async function createPrayerRequestActionProxy(formData: FormData): Promise<void> {
  const { createPrayerRequestAction } = await import("../actions");
  return createPrayerRequestAction(formData);
}
