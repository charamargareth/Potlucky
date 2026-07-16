"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useToast } from "@/components/ToastContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SavingsJar from "@/components/ui/SavingsJar";
import RecommendationCard from "@/components/groups/RecommendationCard";
import InviteModal from "@/components/groups/InviteModal";
import MemberList from "@/components/groups/MemberList";
import ReminderSettingsModal from "@/components/groups/ReminderSettingsModal";
import EditGroupModal from "@/components/groups/EditGroupModal";
import AddContributionModal from "@/components/contributions/AddContributionModal";
import WithdrawalModal from "@/components/contributions/WithdrawalModal";
import EditContributionModal from "@/components/contributions/EditContributionModal";
import ExportButton from "@/components/contributions/ExportButton";
import SavingsChart from "@/components/contributions/SavingsChart";
import Logbook from "@/components/contributions/Logbook";
import AuditLog from "@/components/groups/AuditLog";
import JoinRequestsPanel from "@/components/groups/JoinRequestsPanel";
import {
  ChevronLeft,
  UserPlus,
  Plus,
  Minus,
  BellRing,
  TrendingUp,
  NotebookPen,
  Pencil,
  Trash2,
  LogOut,
  Trophy,
  RotateCcw,
  Shield,
  Lock,
  Globe,
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
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const [group, setGroup] = useState<SavingsGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"overview" | "logbook" | "audit">("overview");

  const [showInvite, setShowInvite] = useState(false);
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Contribution | null>(null);
  const [busy, setBusy] = useState(false);

  useKeyboardShortcuts({
    onContribute: () => setShowAddContribution(true),
    onWithdraw: () => setShowWithdrawal(true),
  });

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
    (async () => { await loadData(); })();

    const supabase = createClient();
    const channel = supabase
      .channel(`group-${groupId}-contributions`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contributions", filter: `group_id=eq.${groupId}` }, () => { if (active) loadData(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` }, () => { if (active) loadData(); })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [groupId, loadData]);

  if (loading || !group || !currentUserId) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-soft text-sm">
        Memuat pot…
      </div>
    );
  }

  const totalDeposit = contributions.filter((c) => c.type !== "withdrawal").reduce((s, c) => s + Number(c.amount), 0);
  const totalWithdrawal = contributions.filter((c) => c.type === "withdrawal").reduce((s, c) => s + Number(c.amount), 0);
  const totalSaved = totalDeposit - totalWithdrawal;
  const pct = group.target_amount > 0 ? Math.min(100, (totalSaved / group.target_amount) * 100) : 0;
  const today = todayISO();
  const contributedTodayUserIds = new Set(contributions.filter((c) => c.contributed_on === today).map((c) => c.user_id));
  const memberStats = members.map((member) => ({
    member,
    totalContributed: contributions.filter((c) => c.user_id === member.user_id).reduce((s, c) => s + Number(c.amount), 0),
    contributedToday: contributedTodayUserIds.has(member.user_id),
  }));

  const isOwner = currentUserId === group.created_by;
  const isCompleted = group.status === "completed";
  const isPrivate = group.visibility === "private";

  async function handleToggleVisibility() {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("update_group_visibility", {
      p_group_id: groupId,
      p_visibility: isPrivate ? "public" : "private",
    });
    setBusy(false);
    if (error) {
      toastError("Gagal mengubah visibilitas", error.message);
      return;
    }
    if (data) setGroup(data as SavingsGroup);
    success(
      isPrivate ? "Pot dijadikan publik" : "Pot dijadikan privat",
      isPrivate ? "Siapapun bisa bergabung dengan kode undangan" : "Anggota baru perlu persetujuanmu dulu"
    );
  }

  async function handleDeleteGroup() {
    if (!window.confirm(`Hapus pot "${group!.name}" secara permanen? Semua catatan tabungan dan anggota di dalamnya akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_savings_group", { p_group_id: groupId });
    setBusy(false);
    if (error) {
      toastError("Gagal menghapus pot", error.message);
      return;
    }
    success("Pot dihapus", `"${group!.name}" telah dihapus secara permanen`);
    router.push("/dashboard");
  }

  async function handleLeaveGroup() {
    if (!window.confirm(`Keluar dari pot "${group!.name}"?`)) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("leave_group", { p_group_id: groupId });
    setBusy(false);
    if (error) {
      toastError("Gagal keluar dari pot", error.message);
      return;
    }
    info("Kamu telah keluar dari pot", `Kamu tidak lagi menjadi anggota "${group!.name}"`);
    router.push("/dashboard");
  }

  async function handleToggleStatus() {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("set_group_status", {
      p_group_id: groupId,
      p_status: isCompleted ? "active" : "completed",
    });
    setBusy(false);
    if (error) {
      toastError("Gagal mengubah status pot", error.message);
      return;
    }
    setGroup(data as SavingsGroup);
    success(
      isCompleted ? "Pot diaktifkan kembali" : "Pot ditandai selesai!",
      isCompleted ? "Pot kembali ke status aktif" : "Selamat! Target tabungan berhasil dicapai 🎉"
    );
  }

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
            <div className="flex items-center gap-2 justify-center md:justify-start mb-1 flex-wrap">
              <h1 className="font-display text-2xl text-ink">{group.name}</h1>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber bg-amber-soft px-2.5 py-1 rounded-full">
                  <Trophy className="size-3.5" />Tercapai
                </span>
              )}
              {isPrivate && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft bg-peach px-2.5 py-1 rounded-full">
                  <Lock className="size-3" />Privat
                </span>
              )}
            </div>
            {group.description && <p className="text-sm text-ink-soft mb-3">{group.description}</p>}
            <div className="flex flex-wrap items-baseline gap-2 justify-center md:justify-start mb-3">
              <span className="font-display text-3xl text-pink-deep">{formatCurrency(totalSaved)}</span>
              <span className="text-sm text-ink-soft">dari target {formatCurrency(group.target_amount)}</span>
            </div>
            {totalWithdrawal > 0 && (
              <div className="flex gap-3 mb-2 text-xs justify-center md:justify-start">
                <span className="text-mint font-semibold">+{formatCurrency(totalDeposit)} ditabung</span>
                <span className="text-amber font-semibold">-{formatCurrency(totalWithdrawal)} dipakai</span>
              </div>
            )}
            <div className="h-3 w-full rounded-full bg-peach overflow-hidden mb-2">
              <div className="h-full rounded-full bg-pink-strong transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center md:justify-start text-xs text-ink-soft">
              <span>Periode {periodLabelMap[group.period_type]}</span>
              {group.target_date && <span>Tenggat {formatDateID(group.target_date)}</span>}
              <span>{Math.round(pct)}% tercapai</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        <Button onClick={() => setShowAddContribution(true)}>
          <Plus className="size-4" />Catat tabungan
        </Button>
        <Button variant="outline" onClick={() => setShowWithdrawal(true)} className="border-amber/40 text-amber hover:bg-amber-soft">
          <Minus className="size-4" />Catat pemakaian
        </Button>
        <Button variant="outline" onClick={() => setShowInvite(true)}>
          <UserPlus className="size-4" />Undang anggota
        </Button>
        <Button variant="outline" onClick={() => setShowReminderSettings(true)}>
          <BellRing className="size-4" />Pengingat
        </Button>
        {isOwner && (
          <Button variant="outline" onClick={() => setShowEditGroup(true)}>
            <Pencil className="size-4" />Edit pot
          </Button>
        )}
        {isOwner && (
          <Button variant="outline" onClick={handleToggleStatus} disabled={busy}>
            {isCompleted ? (<><RotateCcw className="size-4" />Aktifkan lagi</>) : (<><Trophy className="size-4" />Tandai selesai</>)}
          </Button>
        )}
        {isOwner && (
          <Button variant="outline" onClick={handleToggleVisibility} disabled={busy}>
            {isPrivate ? (<><Globe className="size-4" />Jadikan Publik</>) : (<><Lock className="size-4" />Jadikan Privat</>)}
          </Button>
        )}
        {isOwner ? (
          <Button variant="outline" onClick={handleDeleteGroup} disabled={busy} className="text-amber hover:bg-amber-soft border-amber/30">
            <Trash2 className="size-4" />Hapus pot
          </Button>
        ) : (
          <Button variant="outline" onClick={handleLeaveGroup} disabled={busy} className="text-amber hover:bg-amber-soft border-amber/30">
            <LogOut className="size-4" />Keluar dari pot
          </Button>
        )}
      </div>

      {/* Join requests panel */}
      {isOwner && isPrivate && <JoinRequestsPanel groupId={groupId} onUpdated={loadData} />}

      {/* Tabs */}
      <div className="flex items-center justify-between mb-5 border-b border-pink-soft/60">
        <div className="flex gap-1.5">
          <button
            onClick={() => setView("overview")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${view === "overview" ? "border-pink-strong text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
          >
            <TrendingUp className="size-4" />Ringkasan
          </button>
          <button
            onClick={() => setView("logbook")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${view === "logbook" ? "border-pink-strong text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
          >
            <NotebookPen className="size-4" />Logbook
          </button>
          {isOwner && (
            <button
              onClick={() => setView("audit")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${view === "audit" ? "border-pink-strong text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
            >
              <Shield className="size-4" />Audit Log
            </button>
          )}
        </div>
        {view === "logbook" && (
          <div className="pb-1">
            <ExportButton group={group} contributions={contributions} />
          </div>
        )}
      </div>

      {view === "overview" ? (
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-5">
          <div className="flex flex-col gap-5">
            <Card className="p-5">
              <h3 className="font-semibold text-ink text-[15px] mb-3">Pertumbuhan tabungan</h3>
              <SavingsChart contributions={contributions} />
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-ink text-[15px] mb-3">Anggota ({members.length})</h3>
              <MemberList
                groupId={groupId}
                memberStats={memberStats}
                currentUserId={currentUserId}
                isOwner={isOwner}
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
              initialDailyBudget={0}
            />
          </div>
        </div>
      ) : view === "logbook" ? (
        <Card className="p-5">
          <Logbook
            contributions={contributions}
            currentUserId={currentUserId}
            onEditEntry={(entry) => setEditingEntry(entry)}
          />
        </Card>
      ) : (
        <Card className="p-5">
          <AuditLog groupId={groupId} />
        </Card>
      )}

      {showInvite && (
        <InviteModal inviteCode={group.invite_code} groupName={group.name} onClose={() => setShowInvite(false)} />
      )}
      {showAddContribution && (
        <AddContributionModal
          groupId={groupId}
          onClose={() => setShowAddContribution(false)}
          onSuccess={() => {
            setShowAddContribution(false);
            loadData();
            success("Tabungan tercatat!", "Kontribusimu berhasil ditambahkan ke pot");
          }}
        />
      )}
      {showWithdrawal && (
        <WithdrawalModal
          groupId={groupId}
          currentSaldo={totalSaved}
          onClose={() => setShowWithdrawal(false)}
          onSuccess={() => {
            setShowWithdrawal(false);
            loadData();
            success("Pemakaian tercatat!", "Pengeluaran dari pot berhasil dicatat");
          }}
        />
      )}
      {showReminderSettings && (
        <ReminderSettingsModal groupId={groupId} onClose={() => setShowReminderSettings(false)} />
      )}
      {showEditGroup && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditGroup(false)}
          onSaved={(updated) => {
            setGroup(updated);
            success("Pot berhasil diupdate", "Perubahan pada pot telah disimpan");
          }}
        />
      )}
      {editingEntry && (
        <EditContributionModal
          contribution={editingEntry}
          canDelete={editingEntry.user_id === currentUserId || currentUserId === group.created_by}
          onClose={() => setEditingEntry(null)}
          onSaved={() => {
            setEditingEntry(null);
            loadData();
            success("Catatan diupdate", "Perubahan catatan tabungan berhasil disimpan");
          }}
          onDeleted={() => {
            setEditingEntry(null);
            loadData();
            success("Catatan dihapus", "Catatan tabungan berhasil dihapus");
          }}
        />
      )}
    </div>
  );
}