/**
 * Helper deteksi platform untuk menangani perbedaan dukungan Web Push
 * antara Android/desktop dan iOS Safari.
 *
 * Push notification di iOS HANYA berfungsi jika web app sudah di-install
 * ke Home Screen (mode standalone). Membuka langsung di tab Safari/Chrome
 * iOS tidak memberi akses ke PushManager sama sekali — ini batasan dari
 * Apple sendiri, bukan keterbatasan kode. Semua browser di iOS (termasuk
 * Chrome iOS) memakai mesin WebKit yang sama, jadi perilakunya identik.
 */

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
  // iPadOS modern menyamar sebagai Mac, deteksi lewat touch support
  const isIpadOS =
    ua.includes("Macintosh") && navigator.maxTouchPoints > 1;
  return isAppleMobile || isIpadOS;
}

export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari pakai navigator.standalone, browser lain pakai matchMedia
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean })
    .standalone;
  const mediaStandalone = window.matchMedia(
    "(display-mode: standalone)"
  ).matches;
  return Boolean(iosStandalone) || mediaStandalone;
}

export function supportsWebPush(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  // Di iOS, PushManager hanya benar-benar berfungsi dalam mode standalone,
  // meskipun API-nya terdeteksi "ada" saat dibuka di tab biasa.
  if (isIOS() && !isStandalonePWA()) {
    return false;
  }
  return true;
}
