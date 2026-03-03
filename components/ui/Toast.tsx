"use client";

/**
 * Single feedback pattern: toast. Success = minimal message; error = calm, human.
 * Use useToast() in client components. Buttons should disable while pending and prevent duplicate submit.
 */
import React, { createContext, useCallback, useContext, useState } from "react";

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
              ? "fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 shadow-lg"
              : "fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-gray-800 px-4 py-2 text-sm font-medium text-white shadow-lg"
          }
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
