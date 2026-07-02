"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import GroupCard from "@/components/groups/GroupCard";
import SavingsJar from "@/components/ui/SavingsJar";
import {
  Plus, QrCode, Trophy, ArrowUpDown, PiggyBank,
  TrendingUp, Wallet, Zap, Bell, CircleDollarSign,
  UserPlus, AlarmClock, ArrowRight, Users,
} from "lucide-react";
import { formatCurrencyShort, getInitials } from "@/lib/utils";
import type { GroupWithStats, AppNotification, GroupMember, NotificationType, Profile } from "@/types/database";

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

const notifIcons: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  reminder: { icon: AlarmClock, color: "text-amber", bg: "bg-amber-soft" },
  member_contributed: { icon: CircleDollarSign, color: "text-mint", bg: "bg-mint/10" },
  target_reached: { icon: Trophy, color: "text-amber", bg: "bg-amber-soft" },
  member_joined: { icon: UserPlus, color: "text-pink-deep", bg: "bg-pink-soft/60" },
  milestone: { icon: Trophy, color: "text-amber", bg: "bg-amber-soft" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function StatsBar({ groups }: { groups: GroupWithStats[] }) {
  const activeGroups = groups.filter((g) => g.status === "active");
  const totalSaldo = activeGroups.reduce((s, g) => s + g.total_saved, 0);
  const totalTarget = activeGroups.reduce((s, g) => s + g.target_amount, 0);
  const avgProgress = activeGroups.length > 0
    ? Math.round(activeGroups.reduce((s, g) => s + g.progress_pct, 0) / activeGroups.length)
    : 0;

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {[
        { icon: Wallet, label: "Total saldo aktif", value: formatCurrencyShort(totalSaldo), color: "text-pink-deep", bg: "bg-pink-soft/50" },
        { icon: TrendingUp, label: "Total target", value: formatCurrencyShort(totalTarget), color: "text-mint", bg: "bg-mint/10" },
        { icon: PiggyBank, label: "Rata-rata progress", value: `${avgProgress}%`, color: "text-amber", bg: "bg-amber-soft" },
      ].map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-glass border border-pink-soft rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <div className={`size-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`size-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`font-display text-lg leading-none ${s.color} mb-0.5`}>{s.value}</p>
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
  const potBelumNabung = activeGroups.filter((g) => g.members_contributed_today === 0);
  const day = new Date().getDay();

  if (activeGroups.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      {potBelumNabung.length > 0 && (
        <div className="flex-1 bg-gradient-to-br from-pink-strong to-pink-deep rounded-2xl p-4 flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Zap className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm mb-0.5">Belum nabung hari ini</p>
            <p className="text-white/70 text-xs truncate">
              {potBelumNabung.length === 1 ? potBelumNabung[0].name : `${potBelumNabung.length} pot menunggumu`}
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
      <div className="flex-1 bg-peach border border-pink-soft rounded-2xl p-4 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-pink-soft/60 flex items-center justify-center shrink-0">
          <PiggyBank className="size-5 text-pink-deep" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-ink-soft font-semibold uppercase tracking-wide mb-0.5">Motivasi hari ini</p>
          <p className="text-sm text-ink leading-snug italic">"{motivasi[day % motivasi.length]}"</p>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────
function Sidebar({
  activity,
  members,
  groups,
}: {
  activity: (AppNotification & { group_name?: string })[];
  members: (GroupMember & { group_name?: string })[];
  groups: GroupWithStats[];
}) {
  // Kelompokkan anggota per grup, dedupe by user_id across groups
  const uniqueMembers = useMemo(() => {
    const seen = new Map<string, GroupMember & { group_name?: string; groups: string[] }>();
    for (const m of members) {
      if (seen.has(m.user_id)) {
        seen.get(m.user_id)!.groups.push(m.group_name ?? "");
      } else {
        seen.set(m.user_id, { ...m, groups: [m.group_name ?? ""] });
      }
    }
    return Array.from(seen.values()).slice(0, 8);
  }, [members]);

  return (
    <aside className="hidden lg:flex flex-col gap-5 w-72 xl:w-80 shrink-0">

      {/* Anggota */}
      <div className="bg-glass border border-pink-soft rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base text-ink flex items-center gap-2">
            <Users className="size-4 text-pink-deep" />
            Anggota
          </h3>
          <span className="text-xs text-ink-soft">{uniqueMembers.length} orang</span>
        </div>

        {uniqueMembers.length === 0 ? (
          <p className="text-xs text-ink-soft text-center py-4">Belum ada anggota lain.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {uniqueMembers.map((m) => {
              const profile = m.profile as Profile | undefined;
              return (
                <li key={m.user_id} className="flex items-center gap-2.5">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-pink-soft flex items-center justify-center text-[11px] font-semibold text-pink-deep shrink-0">
                      {getInitials(profile?.full_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {profile?.full_name ?? "Anggota"}
                    </p>
                    <p className="text-[11px] text-ink-soft truncate">
                      {m.groups.join(", ")}
                    </p>
                  </div>
                  {m.role === "owner" && (
                    <span className="text-[10px] font-bold text-pink-deep bg-pink-soft/60 px-2 py-0.5 rounded-full shrink-0">
                      Owner
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Aktivitas terbaru */}
      <div className="bg-glass border border-pink-soft rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base text-ink flex items-center gap-2">
            <Bell className="size-4 text-pink-deep" />
            Aktivitas
          </h3>
          <Link href="/activity" className="text-xs text-pink-deep hover:text-pink-strong transition-colors font-semibold">
            Lihat semua
          </Link>
        </div>

        {activity.length === 0 ? (
          <p className="text-xs text-ink-soft text-center py-4">Belum ada aktivitas.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {activity.slice(0, 6).map((n) => {
              const meta = notifIcons[n.type] ?? { icon: Bell, color: "text-pink-deep", bg: "bg-pink-soft/60" };
              const Icon = meta.icon;
              return (
                <li key={n.id} className="flex items-start gap-2.5">
                  <div className={`size-7 rounded-full ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`size-3.5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink leading-snug">{n.title}</p>
                    <p className="text-[11px] text-ink-soft leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-ink-soft/60 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {n.group_id && (
                    <Link
                      href={`/groups/${n.group_id}`}
                      className="shrink-0 size-6 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors mt-0.5"
                    >
                      <ArrowRight className="size-3" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

// ─── Main component ──────────────────────────────────────────
export default function DashboardClient({
  groups,
  recentActivity,
  allMembers,
}: {
  groups: GroupWithStats[];
  recentActivity: (AppNotification & { group_name?: string })[];
  allMembers: (GroupMember & { group_name?: string })[];
}) {
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

      {/* Quick action */}
      <QuickActionCard groups={groups} />

      {/* 2-col layout: main + sidebar */}
      <div className="flex gap-6 items-start">

        {/* Main: filter + grid */}
        <div className="flex-1 min-w-0">
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
            <div className="text-center py-10 text-sm text-ink-soft">Tidak ada pot dengan filter ini.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar — desktop only */}
        <Sidebar activity={recentActivity} members={allMembers} groups={groups} />
      </div>
    </div>
  );
}