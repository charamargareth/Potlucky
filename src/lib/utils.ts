import {
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  startOfDay,
} from "date-fns";
import type { PeriodType, RecommendationResult } from "@/types/database";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1)} M`;
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)} jt`;
  if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)} rb`;
  return formatCurrency(amount);
}

export function formatDateID(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatDateShortID(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

export function todayISO(): string {
  return startOfDay(new Date()).toISOString().slice(0, 10);
}

const periodLabels: Record<PeriodType, string> = {
  daily: "hari",
  weekly: "minggu",
  monthly: "bulan",
};

/**
 * Menghitung rekomendasi jumlah nabung berikutnya berdasarkan:
 * - sisa target (target - total terkumpul)
 * - sisa periode hingga target_date
 * - budget harian user (jika ada), untuk memberi peringatan jika rekomendasi > budget
 */
export function calculateRecommendation({
  targetAmount,
  totalSaved,
  targetDate,
  periodType,
  dailyBudget,
}: {
  targetAmount: number;
  totalSaved: number;
  targetDate: string | null;
  periodType: PeriodType;
  dailyBudget: number | null;
}): RecommendationResult {
  const remainingAmount = Math.max(targetAmount - totalSaved, 0);
  const periodLabel = periodLabels[periodType];

  if (remainingAmount <= 0) {
    return {
      suggestedAmount: 0,
      remainingAmount: 0,
      remainingPeriods: 0,
      periodLabel,
      isAheadOfSchedule: true,
      isBehindSchedule: false,
      withinBudget: true,
      message: "Target sudah tercapai. Mantap!",
    };
  }

  if (!targetDate) {
    // Tanpa deadline: kasih rekomendasi default berbasis periode (asumsi 30 periode ke depan)
    const fallbackPeriods = periodType === "daily" ? 30 : periodType === "weekly" ? 12 : 6;
    const suggestedAmount = Math.ceil(remainingAmount / fallbackPeriods);
    return {
      suggestedAmount,
      remainingAmount,
      remainingPeriods: fallbackPeriods,
      periodLabel,
      isAheadOfSchedule: false,
      isBehindSchedule: false,
      withinBudget: dailyBudget ? suggestedAmount <= dailyBudget : true,
      message: `Belum ada tenggat. Nabung ${formatCurrency(
        suggestedAmount
      )} per ${periodLabel} agar target tercapai dalam waktu wajar.`,
    };
  }

  const today = startOfDay(new Date());
  const target = startOfDay(new Date(targetDate));

  let remainingPeriods: number;
  if (periodType === "daily") {
    remainingPeriods = differenceInCalendarDays(target, today);
  } else if (periodType === "weekly") {
    remainingPeriods = differenceInCalendarWeeks(target, today);
  } else {
    remainingPeriods = differenceInCalendarMonths(target, today);
  }

  if (remainingPeriods <= 0) {
    // Sudah lewat tenggat tapi belum tercapai — sarankan lunasi segera
    return {
      suggestedAmount: remainingAmount,
      remainingAmount,
      remainingPeriods: 0,
      periodLabel,
      isAheadOfSchedule: false,
      isBehindSchedule: true,
      withinBudget: dailyBudget ? remainingAmount <= dailyBudget : true,
      message: `Tenggat sudah lewat. Sisa ${formatCurrency(
        remainingAmount
      )} yang perlu dikumpulkan segera.`,
    };
  }

  const suggestedAmount = Math.ceil(remainingAmount / remainingPeriods);
  const withinBudget = dailyBudget ? suggestedAmount <= dailyBudget : true;

  let message = `Nabung ${formatCurrency(
    suggestedAmount
  )} per ${periodLabel} untuk mencapai target tepat waktu.`;

  if (!withinBudget && dailyBudget) {
    message = `Rekomendasi ${formatCurrency(
      suggestedAmount
    )} per ${periodLabel} ini melebihi budget kamu (${formatCurrency(
      dailyBudget
    )}). Coba perpanjang tenggat atau turunkan target.`;
  }

  return {
    suggestedAmount,
    remainingAmount,
    remainingPeriods,
    periodLabel,
    isAheadOfSchedule: false,
    isBehindSchedule: false,
    withinBudget,
    message,
  };
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
