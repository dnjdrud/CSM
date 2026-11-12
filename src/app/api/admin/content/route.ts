import { getEditableContent } from "@/content/rooms";
import { publish, resetContent, saveDraft, splitParagraphs, unpublish, validateContent, type ContentJson } from "@/server/content-store";
import { isSameOriginRequest } from "@/server/request-guard";
import { getSession } from "@/server/session";

const noStore = { "cache-control": "no-store" };
const back = (key: string, m: string) =>
  new Response(null, { status: 303, headers: { ...noStore, location: `/admin/content/${encodeURIComponent(key)}?m=${m}` } });

/** Son only. HTML form POST: key, action (save | publish | unpublish | reset), body or section_N. */
export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) return new Response("forbidden", { status: 403, headers: noStore });
  const session = await getSession();
  if (session?.role !== "son") return new Response("unauthorized", { status: 401, headers: noStore });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("bad request", { status: 400, headers: noStore });
  }
  const key = form.get("key");
  const action = form.get("action");
  const item = typeof key === "string" ? getEditableContent(key) : null;
  if (!item || typeof action !== "string") return new Response("not found", { status: 404, headers: noStore });

  const text = (name: string) => {
    const v = form.get(name);
    return typeof v === "string" ? v : "";
  };
  const content: ContentJson = item.headings
    ? { body: null, sections: item.headings.map((heading, i) => ({ heading, paragraphs: splitParagraphs(text(`section_${i}`)) })) }
    : { body: splitParagraphs(text("body")), sections: null };
  if (!validateContent(content)) return back(item.key, "invalid");

  switch (action) {
    case "save":
      saveDraft(item.key, content);
      return back(item.key, "saved");
    case "publish":
      publish(item.key, content);
      return back(item.key, "published");
    case "unpublish":
      unpublish(item.key, content);
      return back(item.key, "unpublished");
    case "reset":
      resetContent(item.key);
      return back(item.key, "reset");
    default:
      return new Response("bad request", { status: 400, headers: noStore });
  }
}
