"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import { Bell, CircleDollarSign, UserPlus, Trophy, AlarmClock, ChevronLeft, ArrowRight } from "lucide-react";import type { AppNotification, NotificationType } from "@/types/database";

const iconMap: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  reminder: { icon: AlarmClock, color: "text-amber", bg: "bg-amber-soft" },
  member_contributed: { icon: CircleDollarSign, color: "text-mint", bg: "bg-mint/10" },
  target_reached: { icon: Trophy, color: "text-amber", bg: "bg-amber-soft" },
  member_joined: { icon: UserPlus, color: "text-pink-deep", bg: "bg-pink-soft/60" },
  milestone: { icon: Trophy, color: "text-amber", bg: "bg-amber-soft" },
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long" });
}

interface NotifWithGroup extends AppNotification {
  group_name?: string | null;
}

export default function ActivityPage() {
  const [notifications, setNotifications] = useState<NotifWithGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      setNotifications((data ?? []) as NotifWithGroup[]);
      setLoading(false);

      // Mark semua as read
      await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    }
    load();
  }, []);

  // Group by date
  const grouped = new Map<string, NotifWithGroup[]>();
  for (const n of notifications) {
    const date = new Date(n.created_at).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date)!.push(n);
  }

  return (
    <div className="animate-rise">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-pink-deep mb-6 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Dashboard
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Konten utama */}
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl text-ink mb-6">Aktivitas</h1>

          {loading ? (
            <div className="text-center py-16 text-sm text-ink-soft">Memuat aktivitas…</div>
          ) : notifications.length === 0 ? (
            <Card className="p-10 flex flex-col items-center text-center">
              <Bell className="size-10 text-pink-soft mb-3" />
              <p className="font-semibold text-ink mb-1">Belum ada aktivitas</p>
              <p className="text-sm text-ink-soft">Nabung atau undang teman ke pot, aktivitasnya akan muncul di sini.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-8">
              {Array.from(grouped.entries()).map(([date, items]) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-3">{date}</p>
                  <Card className="overflow-hidden divide-y divide-pink-soft/40">
                    {items.map((n) => {
                      const meta = iconMap[n.type] ?? { icon: Bell, color: "text-pink-deep", bg: "bg-pink-soft/60" };
                      const Icon = meta.icon;
                      return (
                        <div key={n.id} className={`flex items-start gap-3.5 px-4 py-3.5 ${!n.is_read ? "bg-peach/40" : ""}`}>
                          <div className={`size-9 rounded-full ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Icon className={`size-4 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink leading-snug">{n.title}</p>
                            <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">{n.body}</p>
                            <p className="text-[11px] text-ink-soft/60 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                          {n.group_id && (
                            <Link
                              href={`/groups/${n.group_id}`}
                              className="shrink-0 size-7 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors"
                              title={n.group_name ? `Buka pot ${n.group_name}` : "Buka pot"}
                            >
                              <ArrowRight className="size-3.5" />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex flex-col gap-4 w-72 xl:w-80 shrink-0">
          <div className="bg-glass border border-pink-soft rounded-3xl p-5">
            <h3 className="font-display text-base text-ink mb-4">Ringkasan</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "Total aktivitas", value: String(notifications.length), color: "text-pink-deep" },
                { label: "Belum dibaca", value: String(notifications.filter((n) => !n.is_read).length), color: "text-amber" },
                { label: "Hari ini", value: String(notifications.filter((n) => new Date(n.created_at).toDateString() === new Date().toDateString()).length), color: "text-mint" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between p-3 rounded-xl border border-pink-soft bg-peach/30">
                  <span className="text-sm text-ink-soft">{s.label}</span>
                  <span className={`font-display text-lg ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-glass border border-pink-soft rounded-3xl p-5">
            <h3 className="font-display text-base text-ink mb-3">Jenis aktivitas</h3>
            <ul className="flex flex-col gap-2">
              {[
                { icon: CircleDollarSign, color: "text-mint", bg: "bg-mint/10", label: "Kontribusi", count: notifications.filter((n) => n.type === "member_contributed").length },
                { icon: UserPlus, color: "text-pink-deep", bg: "bg-pink-soft/60", label: "Anggota bergabung", count: notifications.filter((n) => n.type === "member_joined").length },
                { icon: Trophy, color: "text-amber", bg: "bg-amber-soft", label: "Target tercapai", count: notifications.filter((n) => n.type === "target_reached").length },
                { icon: AlarmClock, color: "text-amber", bg: "bg-amber-soft", label: "Pengingat", count: notifications.filter((n) => n.type === "reminder").length },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label} className="flex items-center gap-2.5">
                    <div className={`size-7 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`size-3.5 ${item.color}`} />
                    </div>
                    <span className="text-sm text-ink flex-1">{item.label}</span>
                    <span className="text-sm font-semibold text-ink-soft">{item.count}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}