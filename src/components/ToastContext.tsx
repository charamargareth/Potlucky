"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles: Record<ToastType, { container: string; icon: string }> = {
  success: { container: "border-mint/30 bg-mint/10", icon: "text-mint" },
  error:   { container: "border-amber/30 bg-amber-soft/60", icon: "text-amber" },
  info:    { container: "border-pink-soft bg-peach/60", icon: "text-pink-deep" },
  warning: { container: "border-amber/30 bg-amber-soft/40", icon: "text-amber" },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = icons[toast.type];
  const style = styles[toast.type];

  return (
    <div className={`flex items-start gap-3 w-full max-w-sm bg-glass border rounded-2xl shadow-lg px-4 py-3.5 animate-rise ${style.container}`}>
      <Icon className={`size-5 shrink-0 mt-0.5 ${style.icon}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="size-6 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach transition-colors shrink-0"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const duration = opts.duration ?? (opts.type === "error" ? 5000 : 3500);

    setToasts((prev) => [...prev.slice(-4), { ...opts, id }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const success = useCallback((title: string, description?: string) => toast({ type: "success", title, description }), [toast]);
  const error   = useCallback((title: string, description?: string) => toast({ type: "error",   title, description }), [toast]);
  const info    = useCallback((title: string, description?: string) => toast({ type: "info",    title, description }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast({ type: "warning", title, description }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}