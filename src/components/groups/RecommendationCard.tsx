"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { calculateRecommendation, formatCurrency } from "@/lib/utils";
import { Lightbulb, Settings2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PeriodType } from "@/types/database";

export default function RecommendationCard({
  targetAmount,
  totalSaved,
  targetDate,
  periodType,
  initialDailyBudget,
}: {
  targetAmount: number;
  totalSaved: number;
  targetDate: string | null;
  periodType: PeriodType;
  initialDailyBudget: number;
}) {
  const [dailyBudget, setDailyBudget] = useState(initialDailyBudget);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(initialDailyBudget || ""));
  const [saving, setSaving] = useState(false);

  const recommendation = calculateRecommendation({
    targetAmount,
    totalSaved,
    targetDate,
    periodType,
    dailyBudget: dailyBudget || null,
  });

  async function saveBudget() {
    const value = Number(budgetInput.replace(/\D/g, "")) || 0;
    setSaving(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase
        .from("profiles")
        .update({ daily_budget: value })
        .eq("id", userData.user.id);
    }
    setDailyBudget(value);
    setSaving(false);
    setEditingBudget(false);
  }

  return (
    <Card className="p-5 bg-peach border-pink-strong/25">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-xl bg-pink-strong/15 flex items-center justify-center shrink-0">
          <Lightbulb className="size-4.5 text-pink-deep" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-ink text-[15px] mb-1">
            Rekomendasi nabung
          </h3>

          {recommendation.suggestedAmount > 0 ? (
            <p className="font-display text-2xl text-pink-deep mb-1">
              {formatCurrency(recommendation.suggestedAmount)}
              <span className="text-sm font-body text-ink-soft ml-1">
                / {recommendation.periodLabel}
              </span>
            </p>
          ) : null}

          <p className="text-sm text-ink-soft leading-relaxed">
            {recommendation.message}
          </p>

          {!recommendation.withinBudget && dailyBudget > 0 && (
            <p className="text-xs text-amber font-medium mt-2 bg-amber-soft rounded-lg px-3 py-2">
              Melebihi budget harianmu sebesar {formatCurrency(dailyBudget)}.
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-pink-strong/15">
            {editingBudget ? (
              <div className="flex items-end gap-2">
                <Input
                  label="Budget harianmu (Rp)"
                  inputMode="numeric"
                  value={budgetInput}
                  onChange={(e) =>
                    setBudgetInput(e.target.value.replace(/\D/g, ""))
                  }
                  className="flex-1"
                />
                <button
                  onClick={saveBudget}
                  disabled={saving}
                  className="h-11 px-4 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors disabled:opacity-50"
                >
                  {saving ? "..." : "Simpan"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingBudget(true)}
                className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-pink-deep transition-colors"
              >
                <Settings2 className="size-3.5" />
                {dailyBudget > 0
                  ? `Budget harian: ${formatCurrency(dailyBudget)}`
                  : "Atur budget harian untuk rekomendasi lebih akurat"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
