"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import GroupCard from "@/components/groups/GroupCard";
import SavingsJar from "@/components/ui/SavingsJar";
import { Plus, QrCode, Trophy, ArrowUpDown } from "lucide-react";
import type { GroupWithStats } from "@/types/database";

type FilterTab = "all" | "active" | "completed";
type SortKey = "created" | "progress_asc" | "progress_desc" | "name";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "created", label: "Terbaru" },
  { value: "progress_desc", label: "Progress tertinggi" },
  { value: "progress_asc", label: "Progress terendah" },
  { value: "name", label: "Nama A–Z" },
];

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
      default:
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

      {/* Filter + Sort bar */}
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