"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, X } from "lucide-react";
import Button from "@/components/ui/Button";

export default function InviteModal({
  inviteCode,
  onClose,
}: {
  inviteCode: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const qrValue =
    typeof window !== "undefined"
      ? `${window.location.origin}/groups/join?code=${inviteCode}`
      : inviteCode;

  function handleCopy() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
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

        <div className="flex justify-center mb-6 bg-white p-4 rounded-2xl border border-pink-soft">
          <QRCodeSVG
            value={qrValue}
            size={180}
            fgColor="#5C3A42"
            bgColor="#FFFFFF"
          />
        </div>

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

        <Button onClick={onClose} variant="secondary" className="w-full">
          Selesai
        </Button>
      </div>
    </div>
  );
}
