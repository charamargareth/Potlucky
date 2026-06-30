"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SavingsJar from "@/components/ui/SavingsJar";
import RecommendationCard from "@/components/groups/RecommendationCard";
import InviteModal from "@/components/groups/InviteModal";
import MemberList from "@/components/groups/MemberList";
import ReminderSettingsModal from "@/components/groups/ReminderSettingsModal";
import AddContributionModal from "@/components/contributions/AddContributionModal";
import SavingsChart from "@/components/contributions/SavingsChart";
import Logbook from "@/components/contributions/Logbook";
import {
  ChevronLeft,
  UserPlus,
  Plus,
  BellRing,
  TrendingUp,
  NotebookPen,
} from "lucide-react";
import { formatCurrency, formatDateID, todayISO } from "@/lib/utils";
import type {
  SavingsGroup,
  GroupMember,
  Contribution,
  Profile,
} from "@/types/database";

const periodLabelMap = { daily: "Harian", weekly: "Mingguan", monthly: "Bulanan" };

export default function GroupDetailView({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<SavingsGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"overview" | "logbook">("overview");

  const [showInvite, setShowInvite] = useState(false);
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    setCurrentUserId(userData.user.id);

    const [{ data: groupData }, { data: membersData }, { data: contribData }, { data: profileData }] =
      await Promise.all([
        supabase.from("savings_groups").select("*").eq("id", groupId).single(),
        supabase
          .from("group_members")
          .select("*, profile:profiles(*)")
          .eq("group_id", groupId)
          .order("joined_at"),
        supabase
          .from("contributions")
          .select("*, profile:profiles(*)")
          .eq("group_id", groupId)
          .order("contributed_on", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", userData.user.id).single(),
      ]);

    setGroup(groupData);
    setMembers((membersData as unknown as GroupMember[]) ?? []);
    setContributions((contribData as unknown as Contribution[]) ?? []);
    setProfile(profileData);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    let active = true;

    (async () => {
      await loadData();
    })();

    const supabase = createClient();
    const channel = supabase
      .channel(`group-${groupId}-contributions`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contributions", filter: `group_id=eq.${groupId}` },
        () => {
          if (active) loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` },
        () => {
          if (active) loadData();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [groupId, loadData]);

  if (loading || !group || !currentUserId) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-soft text-sm">
        Memuat pot…
      </div>
    );
  }

  const totalSaved = contributions.reduce((s, c) => s + Number(c.amount), 0);
  const pct = group.target_amount > 0 ? Math.min(100, (totalSaved / group.target_amount) * 100) : 0;
  const today = todayISO();
  const contributedTodayUserIds = new Set(
    contributions.filter((c) => c.contributed_on === today).map((c) => c.user_id)
  );
  const memberStats = members.map((member) => ({
    member,
    totalContributed: contributions
      .filter((c) => c.user_id === member.user_id)
      .reduce((s, c) => s + Number(c.amount), 0),
    contributedToday: contributedTodayUserIds.has(member.user_id),
  }));

  return (
    <div className="animate-rise">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-pink-deep mb-5 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Semua pot
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <Card className="flex-1 p-6 flex flex-col md:flex-row gap-6 items-center">
          <SavingsJar fillPercent={pct} className="w-28 shrink-0" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-display text-2xl text-ink mb-1">{group.name}</h1>
            {group.description && (
              <p className="text-sm text-ink-soft mb-3">{group.description}</p>
            )}
            <div className="flex flex-wrap items-baseline gap-2 justify-center md:justify-start mb-3">
              <span className="font-display text-3xl text-pink-deep">
                {formatCurrency(totalSaved)}
              </span>
              <span className="text-sm text-ink-soft">
                dari target {formatCurrency(group.target_amount)}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-peach overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-pink-strong transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center md:justify-start text-xs text-ink-soft">
              <span>Periode {periodLabelMap[group.period_type]}</span>
              {group.target_date && (
                <span>Tenggat {formatDateID(group.target_date)}</span>
              )}
              <span>{Math.round(pct)}% tercapai</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        <Button onClick={() => setShowAddContribution(true)}>
          <Plus className="size-4" />
          Catat tabungan
        </Button>
        <Button variant="outline" onClick={() => setShowInvite(true)}>
          <UserPlus className="size-4" />
          Undang anggota
        </Button>
        <Button variant="outline" onClick={() => setShowReminderSettings(true)}>
          <BellRing className="size-4" />
          Pengingat
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 border-b border-pink-soft/60">
        <button
          onClick={() => setView("overview")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            view === "overview"
              ? "border-pink-strong text-ink"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <TrendingUp className="size-4" />
          Ringkasan
        </button>
        <button
          onClick={() => setView("logbook")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            view === "logbook"
              ? "border-pink-strong text-ink"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <NotebookPen className="size-4" />
          Logbook
        </button>
      </div>

      {view === "overview" ? (
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-5">
          <div className="flex flex-col gap-5">
            <Card className="p-5">
              <h3 className="font-semibold text-ink text-[15px] mb-3">
                Pertumbuhan tabungan
              </h3>
              <SavingsChart contributions={contributions} />
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-ink text-[15px] mb-3">
                Anggota ({members.length})
              </h3>
              <MemberList
                groupId={groupId}
                memberStats={memberStats}
                currentUserId={currentUserId}
                onUpdated={loadData}
              />
            </Card>
          </div>

          <div className="flex flex-col gap-5">
            <RecommendationCard
              targetAmount={group.target_amount}
              totalSaved={totalSaved}
              targetDate={group.target_date}
              periodType={group.period_type}
              initialDailyBudget={profile?.daily_budget ?? 0}
            />
          </div>
        </div>
      ) : (
        <Card className="p-5">
          <Logbook contributions={contributions} />
        </Card>
      )}

      {showInvite && (
        <InviteModal inviteCode={group.invite_code} onClose={() => setShowInvite(false)} />
      )}
      {showAddContribution && (
        <AddContributionModal
          groupId={groupId}
          onClose={() => setShowAddContribution(false)}
          onSuccess={() => {
            setShowAddContribution(false);
            loadData();
          }}
        />
      )}
      {showReminderSettings && (
        <ReminderSettingsModal groupId={groupId} onClose={() => setShowReminderSettings(false)} />
      )}
    </div>
  );
}
