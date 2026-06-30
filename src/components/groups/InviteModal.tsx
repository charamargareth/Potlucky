"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, X, Share2, Download } from "lucide-react";
import Button from "@/components/ui/Button";

export default function InviteModal({
  inviteCode,
  groupName,
  onClose,
}: {
  inviteCode: string;
  groupName?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "copied" | "error">("idle");
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/groups/join?code=${inviteCode}`
      : inviteCode;

  function handleCopy() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleShare() {
    const shareData = {
      title: groupName ? `Gabung ke pot "${groupName}"` : "Gabung ke pot tabungan",
      text: `Yuk gabung nabung bareng! Pakai kode ${inviteCode} atau klik link ini.`,
      url: inviteLink,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        setShareStatus("shared");
      } catch {
        // dibatalkan user, gak masalah
      }
    } else {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setShareStatus("copied");
        setTimeout(() => setShareStatus("idle"), 1800);
      } catch {
        setShareStatus("error");
      }
    }
  }

  function handleDownloadQR() {
    const svgEl = qrWrapperRef.current?.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const padding = 32;
      const canvas = document.createElement("canvas");
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding);

      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `qr-undangan-${inviteCode}.png`;
      link.click();
    };
    img.src = url;
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="bg-glass rounded-3xl p-6 max-w-sm w-full animate-rise relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach transition-colors"
        >
          <X className="size-4" />
        </button>

        <h3 className="font-display text-xl text-ink mb-1 text-center">
          Undang ke pot
        </h3>
        <p className="text-sm text-ink-soft text-center mb-6">
          Bagikan kode atau QR ini ke teman, pacar, atau keluarga.
        </p>

        <div
          ref={qrWrapperRef}
          className="flex justify-center mb-3 bg-white p-4 rounded-2xl border border-pink-soft"
        >
          <QRCodeSVG
            value={inviteLink}
            size={180}
            fgColor="#5C3A42"
            bgColor="#FFFFFF"
          />
        </div>

        <button
          onClick={handleDownloadQR}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-ink-soft hover:text-pink-deep transition-colors mb-5"
        >
          <Download className="size-3.5" />
          Simpan QR sebagai gambar
        </button>

        <div className="flex items-center justify-between bg-peach rounded-xl px-4 py-3 mb-4">
          <span className="font-mono font-bold text-lg text-ink tracking-widest">
            {inviteCode}
          </span>
          <button
            onClick={handleCopy}
            className="text-pink-deep hover:text-pink-strong transition-colors"
            aria-label="Salin kode"
          >
            {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button onClick={handleShare} className="w-full">
            <Share2 className="size-4" />
            {shareStatus === "shared"
              ? "Terbagikan!"
              : shareStatus === "copied"
              ? "Link disalin!"
              : "Bagikan undangan"}
          </Button>
          <Button onClick={onClose} variant="secondary" className="w-full">
            Selesai
          </Button>
        </div>
      </div>
    </div>
  );
}