"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { X, Trash2 } from "lucide-react";
import type { Contribution } from "@/types/database";

export default function EditContributionModal({
  contribution,
  canDelete,
  onClose,
  onSaved,
  onDeleted,
}: {
  contribution: Contribution;
  canDelete: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [amount, setAmount] = useState(String(Math.round(contribution.amount)));
  const [note, setNote] = useState(contribution.note ?? "");
  const [date, setDate] = useState(contribution.contributed_on);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount.replace(/\D/g, ""));
    if (!value || value <= 0) {
      setError("Masukkan jumlah yang valid.");
      return;
    }

    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: updateError } = await supabase.rpc("update_contribution", {
      p_contribution_id: contribution.id,
      p_amount: value,
      p_note: note.trim() || null,
      p_contributed_on: date,
    });

    setLoading(false);

    if (updateError) {
      setError("Gagal menyimpan: " + updateError.message);
      return;
    }

    onSaved();
  }

  async function handleDelete() {
    if (!window.confirm("Hapus catatan tabungan ini? Tindakan ini tidak bisa dibatalkan.")) {
      return;
    }
    setDeleting(true);
    setError("");
    const supabase = createClient();

    const { error: deleteError } = await supabase.rpc("delete_contribution", {
      p_contribution_id: contribution.id,
    });

    setDeleting(false);

    if (deleteError) {
      setError("Gagal menghapus: " + deleteError.message);
      return;
    }

    onDeleted();
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
          Edit catatan tabungan
        </h3>
        <p className="text-sm text-ink-soft mb-6">
          Salah input jumlah atau tanggal? Benerin di sini.
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Jumlah (Rp)"
            inputMode="numeric"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            hint={
              amount ? `Rp ${Number(amount).toLocaleString("id-ID")}` : undefined
            }
          />

          <Input
            label="Tanggal"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Input
            label="Catatan (opsional)"
            placeholder="Misal: sisa uang makan"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {error && <p className="text-sm text-amber font-medium">{error}</p>}

          <Button type="submit" loading={loading} size="lg">
            Simpan perubahan
          </Button>

          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-1.5 text-sm text-amber hover:text-red-500 transition-colors py-1"
            >
              <Trash2 className="size-3.5" />
              {deleting ? "Menghapus…" : "Hapus catatan ini"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}