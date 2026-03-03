"use server";

import { redirect } from "next/navigation";

/** Submit support flow (mock). Server redirect avoids client-side navigation flicker. */
export async function submitSupportAction(): Promise<never> {
  redirect("/support/thank-you");
}
