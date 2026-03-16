/**
 * Design system: Modal
 * Overlay + panel; escape to close; focus trap recommended when used with forms.
 * Use as wrapper: <Modal onClose={...} title="..."><content /></Modal>
 */
"use client";

import * as React from "react";
import { SHADOW, BORDER, FOCUS_RING } from "@/lib/design/tokens";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
  /** Optional aria-label if title is not visible */
  "aria-label"?: string;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
  panelClassName = "",
  "aria-label": ariaLabel,
}: ModalProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm ${className}`}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal
      aria-labelledby={title ? "modal-title" : undefined}
      aria-label={ariaLabel}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border bg-theme-surface ${SHADOW.lg} ${BORDER.default} ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-theme-border px-5 py-4">
          {title ? (
            <h2 id="modal-title" className="text-lg font-semibold tracking-tight text-theme-text">
              {title}
            </h2>
          ) : (
            <span aria-hidden className="flex-1" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-theme-muted transition-colors duration-150 hover:bg-theme-surface-2 hover:text-theme-text active:bg-theme-surface-3 ${FOCUS_RING}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
