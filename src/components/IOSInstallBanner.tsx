"use client";

import { useSyncExternalStore } from "react";
import { Share, SquarePlus, X } from "lucide-react";
import { isIOS, isStandalonePWA } from "@/lib/platform";

const DISMISS_KEY = "potlucky_ios_install_banner_dismissed";

function subscribe(callback: () => void) {
  window.addEventListener("potlucky-banner-dismiss", callback);
  return () => window.removeEventListener("potlucky-banner-dismiss", callback);
}

function getClientSnapshot() {
  return (
    isIOS() &&
    !isStandalonePWA() &&
    !sessionStorage.getItem(DISMISS_KEY)
  );
}

function getServerSnapshot() {
  // Selalu false saat SSR karena window/sessionStorage belum ada —
  // mencegah hydration mismatch.
  return false;
}

export default function IOSInstallBanner() {
  const shouldShow = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    // Trigger re-render manual karena tidak ada listener event nyata;
    // cara termudah adalah reload state lewat dispatch storage event semu.
    window.dispatchEvent(new Event("potlucky-banner-dismiss"));
  }

  if (!shouldShow) return null;

  return (
    <div className="flex items-start gap-3 bg-peach border border-pink-soft rounded-2xl px-4 py-3.5 mb-6 animate-rise">
      <div className="size-9 rounded-xl bg-pink-soft/70 flex items-center justify-center shrink-0">
        <SquarePlus className="size-4.5 text-pink-deep" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink mb-0.5">
          Tambahkan Potlucky ke Layar Utama
        </p>
        <p className="text-xs text-ink-soft leading-relaxed">
          Supaya bisa dapat notifikasi pengingat nabung di iPhone/iPad, ketuk
          ikon <Share className="size-3.5 text-pink-deep inline" /> Bagikan
          lalu pilih &quot;Tambah ke Layar Utama&quot;.
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Tutup"
        className="size-7 flex items-center justify-center rounded-full text-ink-soft hover:bg-pink-soft/60 transition-colors shrink-0"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
