"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts(options?: {
  onNewPot?: () => void;
  onContribute?: () => void;
  onWithdraw?: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip kalau user sedang ketik di input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      // Skip kalau ada modifier key (Ctrl, Cmd, Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          if (options?.onNewPot) options.onNewPot();
          else router.push("/groups/new");
          break;
        case "j":
          e.preventDefault();
          router.push("/groups/join");
          break;
        case "c":
          e.preventDefault();
          options?.onContribute?.();
          break;
        case "w":
          e.preventDefault();
          options?.onWithdraw?.();
          break;
        case "d":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "p":
          e.preventDefault();
          router.push("/profile");
          break;
        case "a":
          e.preventDefault();
          router.push("/activity");
          break;
        case "?":
          e.preventDefault();
          router.push("/guide");
          break;
        case "escape":
          // Handled by individual modals
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, options]);
}

// Komponen UI untuk tampilkan keyboard shortcuts hint
export function KeyboardShortcutsHint() {
  return (
    <div className="hidden lg:block fixed bottom-4 right-4 z-10">
      <details className="group">
        <summary className="cursor-pointer text-xs text-ink-soft bg-glass border border-pink-soft rounded-xl px-3 py-2 hover:bg-peach transition-colors list-none flex items-center gap-1.5">
          <span>⌨</span>
          <span>Shortcuts</span>
        </summary>
        <div className="absolute bottom-full right-0 mb-2 bg-glass border border-pink-soft rounded-2xl p-4 min-w-[220px] shadow-lg">
          <p className="text-xs font-semibold text-ink mb-3">Keyboard Shortcuts</p>
          <div className="flex flex-col gap-2">
            {[
              { key: "N", desc: "Pot baru" },
              { key: "J", desc: "Gabung ke pot" },
              { key: "C", desc: "Catat tabungan (di halaman pot)" },
              { key: "W", desc: "Catat pemakaian (di halaman pot)" },
              { key: "D", desc: "Ke dashboard" },
              { key: "P", desc: "Ke profil" },
              { key: "A", desc: "Ke aktivitas" },
              { key: "?", desc: "Ke panduan" },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-xs text-ink-soft">{desc}</span>
                <kbd className="text-[10px] font-mono bg-peach border border-pink-soft rounded px-1.5 py-0.5 text-ink shrink-0">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}