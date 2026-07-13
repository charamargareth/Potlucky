"use client";

import { useEffect, useState } from "react";
import { SquarePlus, Share, X, Download } from "lucide-react";

type Platform = "ios" | "android" | "desktop" | null;

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

const DISMISS_KEY = "potlucky_pwa_dismissed";

export default function PWAInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const p = detectPlatform();
    setPlatform(p);

    // Android/Desktop: tangkap beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: selalu tampil kalau belum dismiss
    if (p === "ios") setShow(true);

    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt as unknown as { prompt: () => void; userChoice: Promise<{ outcome: string }> };
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
    setShow(false);
  }

  if (!show || installed) return null;

  // iOS — instruksi manual
  if (platform === "ios") {
    return (
      <div className="flex items-start gap-3 bg-peach border border-pink-soft rounded-2xl px-4 py-3.5 mb-6 animate-rise">
        <div className="size-9 rounded-xl bg-pink-soft/70 flex items-center justify-center shrink-0">
          <SquarePlus className="size-4 text-pink-deep" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink mb-0.5">Tambahkan ke Layar Utama</p>
          <p className="text-xs text-ink-soft leading-relaxed">
            Ketuk ikon <Share className="size-3 text-pink-deep inline" /> Bagikan lalu pilih{" "}
            <strong>Tambah ke Layar Utama</strong> untuk akses lebih cepat dan notifikasi pengingat.
          </p>
        </div>
        <button onClick={dismiss} className="size-7 flex items-center justify-center rounded-full text-ink-soft hover:bg-pink-soft/60 transition-colors shrink-0">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  // Android / Desktop — native install prompt
  if (deferredPrompt) {
    return (
      <div className="flex items-start gap-3 bg-peach border border-pink-soft rounded-2xl px-4 py-3.5 mb-6 animate-rise">
        <div className="size-9 rounded-xl bg-pink-soft/70 flex items-center justify-center shrink-0">
          <Download className="size-4 text-pink-deep" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink mb-0.5">Install Potlucky</p>
          <p className="text-xs text-ink-soft leading-relaxed">
            {platform === "android" ? "Pasang di HP kamu biar bisa pakai tanpa buka browser." : "Pasang di komputer kamu untuk akses lebih cepat."}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="h-7 px-3 rounded-lg bg-pink-strong text-white text-xs font-semibold hover:bg-pink-deep transition-colors"
          >
            Pasang
          </button>
          <button onClick={dismiss} className="size-7 flex items-center justify-center rounded-full text-ink-soft hover:bg-pink-soft/60 transition-colors">
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}