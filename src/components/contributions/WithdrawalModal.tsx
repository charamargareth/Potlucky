"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { X, Minus } from "lucide-react";
import { formatCurrency, todayISO } from "@/lib/utils";

export default function WithdrawalModal({
  groupId,
  currentSaldo,
  onClose,
  onSuccess,
}: {
  groupId: string;
  currentSaldo: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const value = Number(amount.replace(/\D/g, ""));
  const sisaSaldo = currentSaldo - value;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value || value <= 0) {
      setError("Masukkan jumlah yang valid.");
      return;
    }
    if (value > currentSaldo) {
      setError(`Jumlah melebihi saldo pot (${formatCurrency(currentSaldo)}).`);
      return;
    }

    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: rpcError } = await supabase.rpc("add_withdrawal", {
      p_group_id: groupId,
      p_amount: value,
      p_note: note.trim() || null,
      p_date: date,
    });

    setLoading(false);

    if (rpcError) {
      setError("Gagal mencatat: " + rpcError.message);
      return;
    }

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

        <div className="flex items-center gap-2.5 mb-1">
          <div className="size-8 rounded-full bg-amber-soft flex items-center justify-center shrink-0">
            <Minus className="size-4 text-amber" />
          </div>
          <h3 className="font-display text-xl text-ink">Catat pemakaian</h3>
        </div>
        <p className="text-sm text-ink-soft mb-2">
          Catat berapa uang pot yang sudah dipakai.
        </p>

        {/* Saldo info */}
        <div className="bg-peach rounded-2xl px-4 py-3 mb-6 flex items-center justify-between">
          <span className="text-sm text-ink-soft">Saldo saat ini</span>
          <span className="font-semibold text-ink">{formatCurrency(currentSaldo)}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Jumlah dipakai (Rp)"
            inputMode="numeric"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            hint={
              value > 0
                ? value > currentSaldo
                  ? "⚠ Melebihi saldo pot"
                  : `Sisa saldo: ${formatCurrency(sisaSaldo)}`
                : undefined
            }
          />

          <Input
            label="Dipakai untuk apa? (opsional)"
            placeholder="Misal: beli tiket pesawat"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Input
            label="Tanggal"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {error && <p className="text-sm text-amber font-medium">{error}</p>}

          <Button
            type="submit"
            loading={loading}
            size="lg"
            disabled={value > currentSaldo}
            className="bg-amber hover:bg-amber/80"
          >
            Catat pemakaian
          </Button>
        </form>
      </div>
    </div>
  );
}