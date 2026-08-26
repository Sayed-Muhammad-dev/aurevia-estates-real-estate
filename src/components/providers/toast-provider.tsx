"use client";

import { CheckCircle2, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((title: string, description?: string) => {
    const id = Date.now();
    setItems((current) => [...current, { id, title, description }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3600);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto animate-fade-up rounded-2xl border border-line/80 bg-panel/95 p-4 shadow-float backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-accent/10 p-2 text-accent">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                className="rounded-full p-1 text-muted transition hover:bg-foreground/5 hover:text-foreground"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
