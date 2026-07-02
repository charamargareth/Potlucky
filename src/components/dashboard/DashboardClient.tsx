"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import GroupCard from "@/components/groups/GroupCard";
import SavingsJar from "@/components/ui/SavingsJar";
import { Plus, QrCode, Trophy, ArrowUpDown, PiggyBank, TrendingUp, Wallet, Zap } from "lucide-react";
import { formatCurrencyShort } from "@/lib/utils";
import type { GroupWithStats } from "@/types/database";

type FilterTab = "all" | "active" | "completed";
type SortKey = "created" | "progress_asc" | "progress_desc" | "name";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "created", label: "Terbaru" },
  { value: "progress_desc", label: "Progress tertinggi" },
  { value: "progress_asc", label: "Progress terendah" },
  { value: "name", label: "Nama A–Z" },
];

const motivasi = [
  "Sedikit demi sedikit, lama-lama jadi bukit.",
  "Nabung hari ini, liburan besok.",
  "Konsisten lebih penting dari nominal.",
  "Setiap rupiah yang ditabung adalah versi masa depan yang lebih baik.",
  "Mulai kecil, mimpi besar.",
  "Uang terbaik adalah uang yang sudah kamu sisihkan.",
  "Progress is progress, no matter how small.",
];

function getMotivasi() {
  const day = new Date().getDay();
  return motivasi[day % motivasi.length];
}

function StatsBar({ groups }: { groups: GroupWithStats[] }) {
  const activeGroups = groups.filter((g) => g.status === "active");
  const totalSaldo = activeGroups.reduce((s, g) => s + g.total_saved, 0);
  const totalTarget = activeGroups.reduce((s, g) => s + g.target_amount, 0);
  const avgProgress = activeGroups.length > 0
    ? Math.round(activeGroups.reduce((s, g) => s + g.progress_pct, 0) / activeGroups.length)
    : 0;

  const stats = [
    {
      icon: Wallet,
      label: "Total saldo aktif",
      value: formatCurrencyShort(totalSaldo),
      color: "text-pink-deep",
      bg: "bg-pink-soft/50",
    },
    {
      icon: TrendingUp,
      label: "Total target",
      value: formatCurrencyShort(totalTarget),
      color: "text-mint",
      bg: "bg-mint/10",
    },
    {
      icon: PiggyBank,
      label: "Rata-rata progress",
      value: `${avgProgress}%`,
      color: "text-amber",
      bg: "bg-amber-soft",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="bg-glass border border-pink-soft rounded-2xl px-4 py-3.5 flex items-center gap-3"
          >
            <div className={`size-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`size-4.5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`font-display text-lg leading-none ${s.color} mb-0.5`}>
                {s.value}
              </p>
              <p className="text-[11px] text-ink-soft truncate">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuickActionCard({ groups }: { groups: GroupWithStats[] }) {
  const activeGroups = groups.filter((g) => g.status === "active");

  // Pot aktif yang belum ada yang nabung hari ini (members_contributed_today === 0)
  const potBelumNabung = activeGroups.filter((g) => g.members_contributed_today === 0);

  // Pot dengan progress tertinggi (paling dekat target)
  const potTerdekat = activeGroups.length > 0
    ? [...activeGroups].sort((a, b) => b.progress_pct - a.progress_pct)[0]
    : null;

  if (activeGroups.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-3">
      {/* Quick nabung */}
      {potBelumNabung.length > 0 && (
        <div className="flex-1 bg-gradient-to-br from-pink-strong to-pink-deep rounded-2xl p-4 flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Zap className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-snug mb-0.5">
              Belum nabung hari ini
            </p>
            <p className="text-white/70 text-xs truncate">
              {potBelumNabung.length === 1
                ? potBelumNabung[0].name
                : `${potBelumNabung.length} pot menunggumu`}
            </p>
          </div>
          <Link
            href={potBelumNabung.length === 1 ? `/groups/${potBelumNabung[0].id}` : "/dashboard"}
            className="shrink-0 h-8 px-3.5 rounded-xl bg-white text-pink-deep text-xs font-bold hover:bg-peach transition-colors flex items-center"
          >
            Nabung
          </Link>
        </div>
      )}

      {/* Motivasi harian */}
      <div className="flex-1 bg-peach border border-pink-soft rounded-2xl p-4 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-pink-soft/60 flex items-center justify-center shrink-0">
          <PiggyBank className="size-5 text-pink-deep" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-ink-soft font-semibold uppercase tracking-wide mb-0.5">
            Motivasi hari ini
          </p>
          <p className="text-sm text-ink leading-snug italic">
            "{getMotivasi()}"
          </p>
        </div>
      </div>

      {/* Pot paling dekat target */}
      {potTerdekat && potTerdekat.progress_pct > 0 && potTerdekat.progress_pct < 100 && (
        <Link
          href={`/groups/${potTerdekat.id}`}
          className="flex-1 bg-glass border border-pink-soft rounded-2xl p-4 flex items-center gap-3 hover:border-pink-strong/60 transition-colors"
        >
          <div className="size-10 rounded-xl bg-mint/10 flex items-center justify-center shrink-0">
            <TrendingUp className="size-5 text-mint" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-ink-soft font-semibold uppercase tracking-wide mb-0.5">
              Paling dekat target
            </p>
            <p className="text-sm text-ink font-semibold truncate">{potTerdekat.name}</p>
            <div className="mt-1.5 h-1.5 bg-pink-soft rounded-full overflow-hidden">
              <div
                className="h-full bg-mint rounded-full transition-all"
                style={{ width: `${Math.min(100, potTerdekat.progress_pct)}%` }}
              />
            </div>
            <p className="text-[11px] text-mint font-semibold mt-1">
              {Math.round(potTerdekat.progress_pct)}% tercapai
            </p>
          </div>
        </Link>
      )}
    </div>
  );
}

export default function DashboardClient({ groups }: { groups: GroupWithStats[] }) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortKey>("created");
  const [showSort, setShowSort] = useState(false);

  const filtered = useMemo(() => {
    let list = [...groups];
    if (filter === "active") list = list.filter((g) => g.status === "active");
    else if (filter === "completed") list = list.filter((g) => g.status === "completed");
    switch (sort) {
      case "progress_desc": list.sort((a, b) => b.progress_pct - a.progress_pct); break;
      case "progress_asc": list.sort((a, b) => a.progress_pct - b.progress_pct); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name, "id")); break;
      default: list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [groups, filter, sort]);

  const activeCount = groups.filter((g) => g.status === "active").length;
  const completedCount = groups.filter((g) => g.status === "completed").length;

  const filterTabs: { value: FilterTab; label: string; count: number }[] = [
    { value: "all", label: "Semua", count: groups.length },
    { value: "active", label: "Aktif", count: activeCount },
    { value: "completed", label: "Tercapai", count: completedCount },
  ];

  if (groups.length === 0) {
    return (
      <div className="animate-rise">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl text-ink">Pot kamu</h1>
            <p className="text-sm text-ink-soft mt-0.5">Belum ada pot tabungan. Mulai satu sekarang.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/groups/join" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-pink-soft text-ink text-sm font-semibold hover:bg-peach transition-colors">
              <QrCode className="size-4" /> Gabung
            </Link>
            <Link href="/groups/new" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors">
              <Plus className="size-4" /> Pot baru
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-center text-center py-16 px-6">
          <SavingsJar fillPercent={5} className="w-40 mb-6 opacity-90" />
          <h2 className="font-display text-xl text-ink mb-2">Potnya masih kosong</h2>
          <p className="text-ink-soft text-sm max-w-sm mb-6">
            Buat pot tabungan baru untuk mulai nabung bareng, atau gabung ke pot teman dengan kode undangan.
          </p>
          <div className="flex gap-3">
            <Link href="/groups/join" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-pink-soft text-ink text-sm font-semibold hover:bg-peach transition-colors">
              <QrCode className="size-4" /> Gabung pot
            </Link>
            <Link href="/groups/new" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors">
              <Plus className="size-4" /> Buat pot
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Pot kamu</h1>
          <p className="text-sm text-ink-soft mt-0.5">
            {activeCount} aktif{completedCount > 0 ? `, ${completedCount} tercapai` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/groups/join" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-pink-soft text-ink text-sm font-semibold hover:bg-peach transition-colors">
            <QrCode className="size-4" /> Gabung
          </Link>
          <Link href="/groups/new" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors">
            <Plus className="size-4" /> Pot baru
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar groups={groups} />

      {/* Quick action + motivasi */}
      <QuickActionCard groups={groups} />

      {/* Filter + Sort */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-semibold transition-colors ${
                filter === tab.value
                  ? "bg-pink-strong text-white"
                  : "bg-glass border border-pink-soft text-ink-soft hover:bg-peach hover:text-ink"
              }`}
            >
              {tab.value === "completed" && <Trophy className="size-3" />}
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === tab.value ? "bg-white/20 text-white" : "bg-peach text-ink-soft"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSort((s) => !s)}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-pink-soft text-xs font-semibold text-ink-soft hover:bg-peach hover:text-ink transition-colors"
          >
            <ArrowUpDown className="size-3.5" />
            {sortOptions.find((s) => s.value === sort)?.label ?? "Urutkan"}
          </button>
          {showSort && (
            <div className="absolute right-0 top-10 z-20 bg-glass border border-pink-soft rounded-2xl shadow-lg overflow-hidden min-w-[175px]">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setShowSort(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sort === opt.value ? "text-pink-deep font-semibold bg-peach/60" : "text-ink hover:bg-peach"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pot grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-ink-soft">
          Tidak ada pot dengan filter ini.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}