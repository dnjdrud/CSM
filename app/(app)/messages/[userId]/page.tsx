import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getUserById, listMessages } from "@/lib/data/repository";
import { TimelineContainer } from "@/components/TimelineContainer";
import { MessageThread } from "./_components/MessageThread";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: partnerId } = await params;
  const [currentUser, partner] = await Promise.all([getCurrentUser(), getUserById(partnerId)]);
  if (!currentUser) redirect("/feed");
  if (!partner) notFound();
  if (partner.id === currentUser.id) redirect("/messages");

  const messages = await listMessages(currentUser.id, partner.id, 100);

  return (
    <TimelineContainer>
      <MessageThread
        initialMessages={messages}
        currentUserId={currentUser.id}
        partner={partner}
      />
    </TimelineContainer>
  );
}
