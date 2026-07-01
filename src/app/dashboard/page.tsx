import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard/DashboardClient";
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
  return <DashboardClient groups={groups} />;
}