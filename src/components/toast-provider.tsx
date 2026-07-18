"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastVariant = "success" | "error";
type Toast = { id: number; message: string; variant: ToastVariant };

const ToastContext = createContext<((message: string, variant?: ToastVariant) => void) | null>(null);

const VISIBLE_MS = 3000;
const FADE_MS = 400;

/**
 * A single, app-wide toast surface — small popups in a fixed corner of the
 * viewport, used for transient confirmations (XP gained, hunger restored,
 * "already did that today") instead of inline text that has to compete
 * for space with whatever button triggered it.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, VISIBLE_MS + FADE_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastBubble key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBubble({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(fadeTimer);
  }, []);

  return (
    <div
      className="pointer-events-auto max-w-xs bg-ink-900 border rounded-lg shadow-2xl shadow-black/50 px-4 py-2.5 text-sm transition-opacity"
      style={{
        borderColor: toast.variant === "success" ? "#68846c" : "#c43030",
        color: toast.variant === "success" ? "#68846c" : "#c43030",
        opacity: visible ? 1 : 0,
        transitionDuration: `${FADE_MS}ms`,
      }}
    >
      {toast.message}
    </div>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return showToast;
}
