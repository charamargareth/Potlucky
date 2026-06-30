"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { X } from "lucide-react";

export default function AddContributionModal({
  groupId,
  suggestedAmount,
  onClose,
  onSuccess,
}: {
  groupId: string;
  suggestedAmount?: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(
    suggestedAmount ? String(Math.round(suggestedAmount)) : ""
  );
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount.replace(/\D/g, ""));
    if (!value || value <= 0) {
      setError("Masukkan jumlah yang valid.");
      return;
    }

    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Sesi berakhir, silakan masuk ulang.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("contributions").insert({
      group_id: groupId,
      user_id: userData.user.id,
      amount: value,
      note: note.trim() || null,
    });

    if (insertError) {
      setError("Gagal menyimpan: " + insertError.message);
      setLoading(false);
      return;
    }

    // Kirim push notification ke anggota lain (best-effort, tidak blocking)
    fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, amount: value }),
    }).catch(() => {});

    onSuccess();
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

        <h3 className="font-display text-xl text-ink mb-1">
          Catat tabungan hari ini
        </h3>
        <p className="text-sm text-ink-soft mb-6">
          Tambahkan jumlah yang kamu sisihkan ke pot ini.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Jumlah (Rp)"
            inputMode="numeric"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            hint={
              amount
                ? `Rp ${Number(amount).toLocaleString("id-ID")}`
                : undefined
            }
          />

          <Input
            label="Catatan (opsional)"
            placeholder="Misal: sisa uang makan"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {error && <p className="text-sm text-amber font-medium">{error}</p>}

          <Button type="submit" loading={loading} size="lg">
            Simpan tabungan
          </Button>
        </form>
      </div>
    </div>
  );
}
