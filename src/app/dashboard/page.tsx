import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GroupCard from "@/components/groups/GroupCard";
import SavingsJar from "@/components/ui/SavingsJar";
import { Plus, QrCode } from "lucide-react";
import type { GroupWithStats } from "@/types/database";
import { todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getGroupsWithStats(): Promise<GroupWithStats[]> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userData.user.id);

  if (!memberships || memberships.length === 0) return [];
  const groupIds = memberships.map((m) => m.group_id);

  const { data: groups } = await supabase
    .from("savings_groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (!groups) return [];

  const today = todayISO();

  const results = await Promise.all(
    groups.map(async (group) => {
      const [{ data: contributions }, { count: memberCount }] = await Promise.all([
        supabase
          .from("contributions")
          .select("amount, user_id, contributed_on")
          .eq("group_id", group.id),
        supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", group.id),
      ]);

      const totalSaved =
        contributions?.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;

      const contributedTodayUsers = new Set(
        (contributions ?? [])
          .filter((c) => c.contributed_on === today)
          .map((c) => c.user_id)
      );

      return {
        ...group,
        total_saved: totalSaved,
        member_count: memberCount ?? 0,
        members_contributed_today: contributedTodayUsers.size,
        progress_pct:
          group.target_amount > 0 ? (totalSaved / group.target_amount) * 100 : 0,
      } as GroupWithStats;
    })
  );

  return results;
}

export default async function DashboardPage() {
  const groups = await getGroupsWithStats();

  return (
    <div className="animate-rise">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Pot kamu</h1>
          <p className="text-sm text-ink-soft mt-0.5">
            {groups.length === 0
              ? "Belum ada pot tabungan. Mulai satu sekarang."
              : `${groups.length} pot sedang berjalan`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/groups/join"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-pink-soft text-ink text-sm font-semibold hover:bg-peach transition-colors"
          >
            <QrCode className="size-4" />
            Gabung
          </Link>
          <Link
            href="/groups/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors"
          >
            <Plus className="size-4" />
            Pot baru
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-6">
          <SavingsJar fillPercent={5} className="w-40 mb-6 opacity-90" />
          <h2 className="font-display text-xl text-ink mb-2">
            Potnya masih kosong
          </h2>
          <p className="text-ink-soft text-sm max-w-sm mb-6">
            Buat pot tabungan baru untuk mulai nabung bareng, atau gabung
            ke pot teman dengan kode undangan.
          </p>
          <div className="flex gap-3">
            <Link
              href="/groups/join"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-pink-soft text-ink text-sm font-semibold hover:bg-peach transition-colors"
            >
              <QrCode className="size-4" />
              Gabung pot
            </Link>
            <Link
              href="/groups/new"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors"
            >
              <Plus className="size-4" />
              Buat pot
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
