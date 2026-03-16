"use client";

/**
 * Design system: Toast
 * Success / error feedback. Spacing and shadow from tokens; no hover (ephemeral).
 */
import React, { createContext, useCallback, useContext, useState } from "react";
import { RADIUS, SHADOW } from "@/lib/design/tokens";

const TOAST_DURATION_MS = 3000;
const ERROR_MESSAGE = "Something didn't work. Please try again.";

type ToastType = "success" | "error";

type ToastState = {
  message: string;
  type: ToastType;
} | null;

type ToastContextValue = {
  show: (message: string) => void;
  error: (message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const show = useCallback((message: string) => {
    setToast({ message, type: "success" });
    const t = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  const error = useCallback((message?: string) => {
    setToast({ message: message || ERROR_MESSAGE, type: "error" });
    const t = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <ToastContext.Provider value={{ show, error }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={
            toast.type === "error"
              ? `fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl border border-theme-danger/20 bg-theme-danger-bg px-5 py-3 text-sm font-medium text-theme-danger ${SHADOW.lg}`
              : `fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-theme-primary px-5 py-3 text-sm font-medium text-white ${SHADOW.lg}`
          }
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
