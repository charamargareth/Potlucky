"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, getInitials } from "@/lib/utils";
import { CheckCircle2, Pencil, UserX } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { GroupMember } from "@/types/database";

interface MemberStat {
  member: GroupMember;
  totalContributed: number;
  contributedToday: boolean;
}

export default function MemberList({
  groupId,
  memberStats,
  currentUserId,
  isOwner,
  onUpdated,
}: {
  groupId: string;
  memberStats: MemberStat[];
  currentUserId: string;
  isOwner: boolean;
  onUpdated: () => void;
}) {
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [kickingId, setKickingId] = useState<string | null>(null);

  async function savePersonalTarget() {
    const value = Number(targetInput.replace(/\D/g, "")) || null;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("group_members")
      .update({ personal_target: value })
      .eq("group_id", groupId)
      .eq("user_id", currentUserId);
    setSaving(false);
    setEditingTarget(false);
    onUpdated();
  }

  async function kickMember(memberUserId: string, memberName: string) {
    if (
      !window.confirm(
        `Keluarkan ${memberName} dari pot ini? Riwayat tabungannya tetap tersimpan.`
      )
    ) {
      return;
    }
    setKickingId(memberUserId);
    const supabase = createClient();
    const { error } = await supabase.rpc("remove_group_member", {
      p_group_id: groupId,
      p_member_user_id: memberUserId,
    });
    setKickingId(null);
    if (error) {
      alert("Gagal mengeluarkan anggota: " + error.message);
      return;
    }
    onUpdated();
  }

  return (
    <div className="flex flex-col gap-2.5">
      {memberStats.map(({ member, totalContributed, contributedToday }) => {
        const isMe = member.user_id === currentUserId;
        const target = member.personal_target;
        const pct = target ? Math.min(100, (totalContributed / target) * 100) : null;

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 bg-glass border border-pink-soft/60 rounded-xl px-4 py-3"
          >
            {member.profile?.avatar_url ? (
              <Image
                src={member.profile.avatar_url}
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="size-9 rounded-full bg-pink-soft flex items-center justify-center text-xs font-semibold text-pink-deep shrink-0">
                {getInitials(member.profile?.full_name)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-ink truncate">
                  {member.profile?.full_name ?? "Anggota"}
                  {isMe && (
                    <span className="text-ink-soft font-normal"> (kamu)</span>
                  )}
                </p>
                {member.role === "owner" && (
                  <span className="text-[10px] uppercase font-semibold text-pink-deep bg-pink-soft/60 px-1.5 py-0.5 rounded-full">
                    Pembuat
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-soft">
                {formatCurrency(totalContributed)}
                {target ? ` dari target ${formatCurrency(target)}` : ""}
              </p>
              {pct !== null && (
                <div className="h-1.5 w-full rounded-full bg-peach overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full bg-pink-strong"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>

            {contributedToday && (
              <span title="Sudah nabung hari ini" className="shrink-0">
                <CheckCircle2 className="size-5 text-mint" />
              </span>
            )}

            {isOwner && !isMe && member.role !== "owner" && (
              <button
                onClick={() => kickMember(member.user_id, member.profile?.full_name ?? "anggota ini")}
                disabled={kickingId === member.user_id}
                aria-label="Keluarkan anggota"
                className="shrink-0 size-7 flex items-center justify-center rounded-full text-ink-soft hover:bg-amber-soft hover:text-amber transition-colors"
              >
                <UserX className="size-3.5" />
              </button>
            )}

            {isMe && (
              <button
                onClick={() => {
                  setTargetInput(String(target ?? ""));
                  setEditingTarget(true);
                }}
                aria-label="Atur target pribadi"
                className="shrink-0 size-7 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
          </div>
        );
      })}

      {editingTarget && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-5"
          onClick={() => setEditingTarget(false)}
        >
          <div
            className="bg-glass rounded-3xl p-6 max-w-sm w-full animate-rise"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg text-ink mb-1">
              Target pribadimu
            </h3>
            <p className="text-sm text-ink-soft mb-5">
              Atur target kontribusimu sendiri dalam pot ini. Kosongkan
              jika tidak ingin pakai target pribadi.
            </p>
            <div className="flex flex-col gap-4">
              <Input
                label="Target (Rp)"
                inputMode="numeric"
                value={targetInput}
                onChange={(e) =>
                  setTargetInput(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Misal: 1000000"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingTarget(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1"
                  loading={saving}
                  onClick={savePersonalTarget}
                >
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}