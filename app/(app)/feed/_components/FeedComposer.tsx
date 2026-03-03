import { ComposeBox } from "@/components/ComposeBox";
import { composePostAction } from "../actions";

/** Wraps ComposeBox; render only when user is logged in. */
export function FeedComposer() {
  return <ComposeBox composePostAction={composePostAction} />;
}
