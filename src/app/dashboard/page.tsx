import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard/DashboardClient";
import type { GroupWithStats, AppNotification, GroupMember } from "@/types/database";
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
          .select("amount, user_id, contributed_on, type")
          .eq("group_id", group.id),
        supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", group.id),
      ]);

      const totalSaved = (contributions ?? []).reduce((sum, c) => {
        return c.type === "withdrawal"
          ? sum - Number(c.amount)
          : sum + Number(c.amount);
      }, 0);

      const contributedTodayUsers = new Set(
        (contributions ?? [])
          .filter((c) => c.contributed_on === today && c.type !== "withdrawal")
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

async function getRecentActivity(): Promise<(AppNotification & { group_name?: string })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);
  return (data ?? []) as (AppNotification & { group_name?: string })[];
}

async function getAllMembers(groupIds: string[]): Promise<(GroupMember & { group_name?: string })[]> {
  if (groupIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("*, profile:profiles(id, full_name, avatar_url, email)")
    .in("group_id", groupIds);
  return (data ?? []) as (GroupMember & { group_name?: string })[];
}

export default async function DashboardPage() {
  const groups = await getGroupsWithStats();
  const groupIds = groups.map((g) => g.id);

  const [activity, members] = await Promise.all([
    getRecentActivity(),
    getAllMembers(groupIds),
  ]);

  // Attach group names to members
  const membersWithGroup = members.map((m) => ({
    ...m,
    group_name: groups.find((g) => g.id === m.group_id)?.name ?? "",
  }));

  return (
    <DashboardClient
      groups={groups}
      recentActivity={activity}
      allMembers={membersWithGroup}
    />
  );
}