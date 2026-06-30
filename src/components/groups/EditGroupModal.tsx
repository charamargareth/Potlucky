"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { X } from "lucide-react";
import type { PeriodType, SavingsGroup } from "@/types/database";

const periodOptions: { value: PeriodType; label: string }[] = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
];

export default function EditGroupModal({
  group,
  onClose,
  onSaved,
}: {
  group: SavingsGroup;
  onClose: () => void;
  onSaved: (updated: SavingsGroup) => void;
}) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [targetAmount, setTargetAmount] = useState(String(group.target_amount));
  const [targetDate, setTargetDate] = useState(group.target_date ?? "");
  const [periodType, setPeriodType] = useState<PeriodType>(group.period_type);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");

    if (!name.trim()) {
      setError("Nama pot wajib diisi.");
      return;
    }
    const amount = Number(targetAmount.replace(/\D/g, ""));
    if (!amount || amount <= 0) {
      setError("Target tabungan harus lebih dari 0.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { data, error: updateError } = await supabase.rpc(
      "update_savings_group",
      {
        p_group_id: group.id,
        p_name: name.trim(),
        p_description: description.trim() || null,
        p_target_amount: amount,
        p_target_date: targetDate || null,
        p_period_type: periodType,
      }
    );

    setSaving(false);

    if (updateError || !data) {
      setError(updateError?.message ?? "Gagal menyimpan perubahan.");
      return;
    }

    onSaved(data as SavingsGroup);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="bg-glass rounded-3xl p-6 max-w-sm w-full animate-rise relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach transition-colors"
        >
          <X className="size-4" />
        </button>

        <h3 className="font-display text-xl text-ink mb-1">Edit pot</h3>
        <p className="text-sm text-ink-soft mb-6">
          Ubah nama, deskripsi, atau target tabungan pot ini.
        </p>

        <div className="flex flex-col gap-5">
          <Input
            label="Nama pot"
            placeholder="Misal: Liburan ke Bali"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink">
              Deskripsi (opsional)
            </label>
            <textarea
              placeholder="Tabungan buat liburan akhir tahun bareng geng kampus"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-xl border border-pink-soft bg-glass px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-soft/60 outline-none focus:border-pink-strong transition-colors resize-none"
            />
          </div>

          <Input
            label="Target jumlah (Rp)"
            placeholder="5000000"
            inputMode="numeric"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value.replace(/\D/g, ""))}
            hint={
              targetAmount
                ? `Rp ${Number(targetAmount).toLocaleString("id-ID")}`
                : undefined
            }
            required
          />

          <Input
            label="Tenggat target (opsional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink">
              Jenis periode target
            </label>
            <div className="grid grid-cols-3 gap-2">
              {periodOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriodType(opt.value)}
                  className={`rounded-xl border px-3 py-2.5 text-center transition-colors ${
                    periodType === opt.value
                      ? "border-pink-strong bg-pink-soft/50"
                      : "border-pink-soft bg-glass hover:bg-peach"
                  }`}
                >
                  <span className="block text-sm font-semibold text-ink">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-amber font-medium">{error}</p>}

          <Button onClick={handleSave} loading={saving} size="lg">
            Simpan perubahan
          </Button>
        </div>
      </div>
    </div>
  );
}