"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, PiggyBank, UserPlus, UserMinus, Pencil, Trash2, LogOut, Trophy, RotateCcw, Minus } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null };
}

const actionMeta: Record<string, { label: string; icon: typeof PiggyBank; color: string; bg: string }> = {
  contribution_added:    { label: "Menabung",            icon: PiggyBank,  color: "text-mint",      bg: "bg-mint/10" },
  contribution_edited:   { label: "Edit catatan",        icon: Pencil,     color: "text-pink-deep", bg: "bg-pink-soft/60" },
  contribution_deleted:  { label: "Hapus catatan",       icon: Trash2,     color: "text-amber",     bg: "bg-amber-soft" },
  withdrawal_added:      { label: "Memakai uang pot",    icon: Minus,      color: "text-amber",     bg: "bg-amber-soft" },
  member_joined:         { label: "Bergabung",           icon: UserPlus,   color: "text-mint",      bg: "bg-mint/10" },
  member_removed:        { label: "Dikeluarkan",         icon: UserMinus,  color: "text-amber",     bg: "bg-amber-soft" },
  member_left:           { label: "Keluar dari pot",     icon: LogOut,     color: "text-ink-soft",  bg: "bg-peach" },
  group_edited:          { label: "Edit pot",            icon: Pencil,     color: "text-pink-deep", bg: "bg-pink-soft/60" },
  group_completed:       { label: "Tandai selesai",      icon: Trophy,     color: "text-amber",     bg: "bg-amber-soft" },
  group_reactivated:     { label: "Aktifkan kembali",    icon: RotateCcw,  color: "text-mint",      bg: "bg-mint/10" },
  join_request_approved: { label: "Request disetujui",   icon: UserPlus,   color: "text-mint",      bg: "bg-mint/10" },
  join_request_rejected: { label: "Request ditolak",     icon: UserMinus,  color: "text-amber",     bg: "bg-amber-soft" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export default function AuditLog({ groupId }: { groupId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("audit_logs")
        .select("*, profile:profiles(full_name, avatar_url)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(50);
      setEntries((data ?? []) as AuditEntry[]);
      setLoading(false);
    }
    load();
  }, [groupId]);

  if (loading) return <p className="text-sm text-ink-soft text-center py-6">Memuat log…</p>;
  if (entries.length === 0) return (
    <div className="flex flex-col items-center text-center py-8">
      <Shield className="size-8 text-pink-soft mb-2" />
      <p className="text-sm text-ink-soft">Belum ada riwayat aktivitas tercatat.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => {
        const meta = actionMeta[entry.action] ?? { label: entry.action, icon: Shield, color: "text-ink-soft", bg: "bg-peach" };
        const Icon = meta.icon;
        return (
          <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl border border-pink-soft/40 bg-glass">
            <div className={`size-8 rounded-full ${meta.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`size-3.5 ${meta.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-ink">{entry.profile?.full_name ?? "Anggota"}</span>
                <span className="text-xs text-ink-soft">{meta.label}</span>
              </div>
              {entry.details && (
                <p className="text-xs text-ink-soft mt-0.5 truncate">
                  {Object.entries(entry.details).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                </p>
              )}
              <p className="text-[11px] text-ink-soft/60 mt-0.5">{timeAgo(entry.created_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}