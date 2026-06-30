"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { PeriodType } from "@/types/database";

const periodOptions: { value: PeriodType; label: string; desc: string }[] = [
  { value: "daily", label: "Harian", desc: "Target dicicil tiap hari" },
  { value: "weekly", label: "Mingguan", desc: "Target dicicil tiap minggu" },
  { value: "monthly", label: "Bulanan", desc: "Target dicicil tiap bulan" },
];

export default function NewGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Sesi berakhir, silakan masuk ulang.");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase.rpc(
      "create_savings_group",
      {
        p_name: name.trim(),
        p_description: description.trim() || null,
        p_target_amount: amount,
        p_target_date: targetDate || null,
        p_period_type: periodType,
      }
    );

    const group = data as { id: string } | null;

    if (insertError || !group) {
      setError(insertError?.message ?? "Gagal membuat pot.");
      setLoading(false);
      return;
    }

    router.push(`/groups/${group.id}`);
  }

  return (
    <div className="max-w-lg mx-auto animate-rise">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-pink-deep mb-5 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Kembali
      </Link>

      <h1 className="font-display text-2xl text-ink mb-1">
        Buat pot baru
      </h1>
      <p className="text-sm text-ink-soft mb-6">
        Tentukan target bersama. Kamu bisa undang anggota setelah pot
        dibuat.
      </p>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            min={new Date().toISOString().slice(0, 10)}
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
            <span className="text-xs text-ink-soft">
              {periodOptions.find((o) => o.value === periodType)?.desc}
            </span>
          </div>

          {error && (
            <p className="text-sm text-amber font-medium">{error}</p>
          )}

          <Button type="submit" loading={loading} size="lg">
            Buat pot
          </Button>
        </form>
      </Card>
    </div>
  );
}