import { ApiError } from "./entries-client";
import type { Proposal, ProposalMethod } from "./proposal-rules";

async function call<T>(url: string, method = "GET", body?: unknown, grant?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (grant) headers["x-room-grant"] = grant;
  const res = await fetch(url, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? (res.status === 401 ? "unauthorized" : "network"));
  return data;
}

export const fetchOwnProposals = () => call<{ proposals: Proposal[] }>("/api/proposals").then((d) => d.proposals);

/** Made inside room 7 only: carries this visit's entry grant. */
export const sendProposal = (
  p: { method: ProposalMethod; date: string; time: string; location: string; companion: string; message: string },
  grant: string,
) => call<{ proposal: Proposal }>("/api/proposals", "POST", { ...p, confirm: true }, grant);

export const cancelProposal = (id: string) => call<{ ok: true }>(`/api/proposals/${id}`, "PATCH", { action: "cancel" });
export const acceptSonTime = (id: string) => call<{ ok: true }>(`/api/proposals/${id}`, "PATCH", { action: "accept_son_time" });
