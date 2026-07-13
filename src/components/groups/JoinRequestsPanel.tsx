"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Clock } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { JoinRequest, Profile } from "@/types/database";

interface RequestWithProfile extends JoinRequest {
  profile?: Profile;
}

export default function JoinRequestsPanel({
  groupId,
  onUpdated,
}: {
  groupId: string;
  onUpdated: () => void;
}) {
  const [requests, setRequests] = useState<RequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("join_requests")
      .select("*, profile:profiles(id, full_name, avatar_url, email)")
      .eq("group_id", groupId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setRequests((data ?? []) as RequestWithProfile[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [groupId]);

  async function handleApprove(requestId: string) {
    setProcessing(requestId);
    const supabase = createClient();
    await supabase.rpc("approve_join_request", { p_request_id: requestId });
    await load();
    setProcessing(null);
    onUpdated();
  }

  async function handleReject(requestId: string) {
    setProcessing(requestId);
    const supabase = createClient();
    await supabase.rpc("reject_join_request", { p_request_id: requestId });
    await load();
    setProcessing(null);
  }

  if (loading || requests.length === 0) return null;

  return (
    <div className="bg-amber-soft/40 border border-amber/30 rounded-2xl p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="size-4 text-amber shrink-0" />
        <h3 className="text-sm font-semibold text-ink">
          {requests.length} permintaan bergabung menunggu
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {requests.map((req) => {
          const profile = req.profile;
          return (
            <div key={req.id} className="flex items-center gap-3 bg-glass rounded-xl p-3">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="" width={32} height={32} className="size-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="size-8 rounded-full bg-pink-soft flex items-center justify-center text-xs font-semibold text-pink-deep shrink-0">
                  {getInitials(profile?.full_name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{profile?.full_name ?? "Pengguna"}</p>
                {req.message && <p className="text-xs text-ink-soft truncate">"{req.message}"</p>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={processing === req.id}
                  className="size-8 flex items-center justify-center rounded-full bg-mint/10 text-mint hover:bg-mint/20 transition-colors disabled:opacity-50"
                  aria-label="Setujui"
                >
                  <Check className="size-4" />
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  disabled={processing === req.id}
                  className="size-8 flex items-center justify-center rounded-full bg-amber-soft text-amber hover:bg-amber/20 transition-colors disabled:opacity-50"
                  aria-label="Tolak"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}