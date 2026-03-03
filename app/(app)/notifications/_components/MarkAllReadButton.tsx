"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { markAllReadAction } from "../actions";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleClick() {
    setLoading(true);
    try {
      await markAllReadAction();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("csm:notifications-read-all"));
      }
      router.refresh();
      toast.show("Marked as read.");
    } catch {
      toast.error();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      loading={loading}
      disabled={loading}
      onClick={handleClick}
    >
      Mark all as read
    </Button>
  );
}
