"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CircleDollarSign, UserPlus, Trophy, AlarmClock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification, NotificationType } from "@/types/database";

const iconMap: Record<NotificationType, typeof Bell> = {
  reminder: AlarmClock,
  member_contributed: CircleDollarSign,
  target_reached: Trophy,
  member_joined: UserPlus,
  milestone: Trophy,
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      setNotifications(data ?? []);
      setLoading(false);

      channel = supabase
        .channel("notifications-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userData.user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as AppNotification, ...prev]);
          }
        )
        .subscribe();
    }

    load();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    if (unreadCount === 0) return;
    const supabase = createClient();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markAllRead();
        }}
        aria-label="Notifikasi"
        className="relative size-9 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-2.5 rounded-full bg-pink-strong ring-2 ring-cream" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-glass border border-pink-soft rounded-2xl shadow-lg shadow-pink-strong/10 animate-rise z-40">
          <div className="px-4 py-3 border-b border-pink-soft/60">
            <h3 className="font-semibold text-ink text-sm">Notifikasi</h3>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-ink-soft text-center">Memuat…</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-sm text-ink-soft text-center">
              Belum ada notifikasi. Yuk mulai nabung dulu.
            </div>
          ) : (
            <ul>
              {notifications.map((n) => {
                const Icon = iconMap[n.type] ?? Bell;
                return (
                  <li
                    key={n.id}
                    className={`px-4 py-3 border-b border-pink-soft/30 last:border-0 flex gap-3 ${
                      !n.is_read ? "bg-peach/50" : ""
                    }`}
                  >
                    <div className="size-8 rounded-full bg-pink-soft/60 flex items-center justify-center shrink-0">
                      <Icon className="size-4 text-pink-deep" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-ink-soft mt-0.5 leading-snug">
                        {n.body}
                      </p>
                      <p className="text-[11px] text-ink-soft/70 mt-1">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
