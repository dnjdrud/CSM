import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Notice, Title } from "@/components/ui";
import { METHOD_LABEL, SON_MESSAGE_MAX, canTransition, formatSeoul, seoulToday, type Proposal } from "@/lib/proposal-rules";
import { PARENT_LABEL, type ParentRole } from "@/lib/roles";
import { listProposalsForSon } from "@/server/proposals";
import { requireAdmin } from "@/server/session";

const MESSAGES: Record<string, [string, "info" | "error"]> = {
  done_accept: ["수락했어요. 해당 부모님 화면에만 ‘아들이 수락했어요’로 보여요.", "info"],
  done_other_time: ["다른 시간을 제안했어요. 부모님이 그 시간으로 할지 정하실 수 있어요.", "info"],
  done_cancel: ["취소했어요. 해당 부모님 화면에 ‘아들이 이번 제안은 어렵다고 했어요’로 보여요.", "info"],
  not_allowed: ["지금 상태에서는 할 수 없어요. 이미 처리했거나 취소된 제안이에요.", "error"],
  past_time: ["제안된 시간이 이미 지나서 수락할 수 없어요. 다른 시간을 제안하거나 취소해 주세요.", "error"],
  confirm_required: ["취소는 확인 화면에서 한 번 더 눌러야 해요.", "error"],
  time_required: ["다른 시간을 제안하려면 날짜와 시간을 모두 골라주세요.", "error"],
  invalid_time: ["날짜와 시간을 다시 확인해 주세요.", "error"],
  too_far: ["1년 안의 시간으로 골라주세요.", "error"],
  message_too_long: ["메시지가 너무 길어요.", "error"],
  invalid_request: ["처리하지 못했어요.", "error"],
};

function sonStatus(p: Proposal & { owner: ParentRole }): string {
  if (p.status === "cancelled") return p.cancelledBy === "son" ? "내가 취소함" : `${PARENT_LABEL[p.owner]}가 취소함`;
  return { proposed: "답을 기다리는 제안", accepted: "수락함", other_time: "다른 시간을 제안함" }[p.status];
}

/**
 * Conversation proposals from room 7. Answers are shown only to the parent who proposed,
 * inside this app; nothing is sent outside or put in a calendar.
 */
export default async function AdminProposalsPage({ searchParams }: PageProps<"/admin/proposals">) {
  await requireAdmin();
  const items = listProposalsForSon();
  const sp = await searchParams;
  const msg = typeof sp.m === "string" ? MESSAGES[sp.m] : undefined;
  const confirmId = typeof sp.confirm === "string" ? sp.confirm : null;
  const input = "mt-2 w-full rounded-2xl border-2 border-line bg-bg px-4 py-3 font-normal text-text";

  return (
    <AppShell backHref="/admin">
      <Title>대화 제안</Title>
      {msg ? (
        <Notice tone={msg[1]}>{msg[0]}</Notice>
      ) : (
        <Notice>답은 이 앱 안에서 제안한 부모님께만 보여요. 문자·메일·일정 초대는 보내지 않아요. 시간은 모두 한국 시간이에요.</Notice>
      )}
      {items.length === 0 ? (
        <p className="panel mt-6">아직 받은 제안이 없어요.</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {items.map((p) => {
            const past = p.timePassed;
            const canCancel = canTransition("son", "cancel", p.status);
            const confirming = confirmId === p.id && canCancel;
            return (
              <li key={p.id} id={`p-${p.id}`} className="panel">
                <p className="font-bold text-btn">
                  {PARENT_LABEL[p.owner]} · {sonStatus(p)}
                </p>
                <p className="text-2xl font-bold">{METHOD_LABEL[p.method]}</p>
                <p>
                  {p.proposedAt ? `${formatSeoul(p.proposedAt)} (한국 시간)` : "시간 미정"}
                  {past && p.status === "proposed" ? " · 이미 지난 시간이에요" : ""}
                </p>
                {p.location && <p>장소: {p.location}</p>}
                {p.companion && <p>함께할 분: {p.companion}</p>}
                {p.message && <p className="whitespace-pre-wrap">하고 싶은 말: {p.message}</p>}
                {p.status === "other_time" && p.sonProposedAt && <p className="mt-2">내가 제안한 시간: {formatSeoul(p.sonProposedAt)}</p>}
                {p.sonMessage && <p className="mt-2 whitespace-pre-wrap">내 답: {p.sonMessage}</p>}

                {confirming ? (
                  <form action={`/api/admin/proposals/${p.id}`} method="post" className="mt-4 grid gap-3 rounded-2xl border-2 border-btn p-4">
                    <p className="font-bold">정말 취소할까요?</p>
                    <p>{PARENT_LABEL[p.owner]} 화면에 ‘아들이 이번 제안은 어렵다고 했어요’로 보여요. 되돌릴 수 없고, 문자나 일정은 보내지 않아요.</p>
                    <label className="font-bold">
                      부모님께 남길 말 (선택)
                      <textarea name="message" rows={3} maxLength={SON_MESSAGE_MAX} className={input} />
                    </label>
                    <input type="hidden" name="confirm" value="yes" />
                    <button type="submit" name="action" value="cancel" className="btn btn-primary">
                      네, 취소할게요
                    </button>
                    <Link href={`/admin/proposals#p-${p.id}`} className="btn btn-secondary">
                      취소하지 않기
                    </Link>
                  </form>
                ) : (
                  <>
                    {p.status === "proposed" && (
                      <form action={`/api/admin/proposals/${p.id}`} method="post" className="mt-4 grid gap-3">
                        <label className="font-bold">
                          부모님께 남길 말 (선택)
                          <textarea name="message" rows={3} maxLength={SON_MESSAGE_MAX} className={input} />
                        </label>
                        {!past && (
                          <button type="submit" name="action" value="accept" className="btn btn-primary">
                            수락하기
                          </button>
                        )}
                        <fieldset className="grid gap-2 rounded-2xl border-2 border-line p-3">
                          <legend className="px-1 font-bold">다른 시간 제안 (한국 시간)</legend>
                          <label>
                            날짜
                            <input type="date" name="date" min={seoulToday()} className={input} />
                          </label>
                          <label>
                            시간
                            <input type="time" name="time" step={600} className={input} />
                          </label>
                          <button type="submit" name="action" value="other_time" className="btn btn-secondary">
                            이 시간으로 다시 제안하기
                          </button>
                        </fieldset>
                      </form>
                    )}
                    {canCancel && (
                      <Link href={`/admin/proposals?confirm=${p.id}#p-${p.id}`} className="btn btn-secondary mt-3">
                        {p.status === "proposed" ? "이번 제안은 어렵다고 답하기" : "이 약속 취소하기"}
                      </Link>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
