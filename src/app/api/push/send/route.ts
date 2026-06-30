import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToSubscription } from "@/lib/push";

/**
 * Dipanggil dari client setelah insert kontribusi berhasil, untuk mem-push
 * notifikasi real-time ke device anggota grup lain (selain si penabung).
 * Notifikasi in-app (tabel notifications) sudah otomatis dibuat oleh DB trigger;
 * endpoint ini hanya menangani pengiriman Web Push ke perangkat yang subscribe.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { groupId, amount } = body as { groupId: string; amount: number };

  if (!groupId || !amount) {
    return NextResponse.json({ error: "groupId dan amount wajib diisi" }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: profile }, { data: group }, { data: members }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", userData.user.id).single(),
    admin.from("savings_groups").select("name").eq("id", groupId).single(),
    admin.from("group_members").select("user_id").eq("group_id", groupId),
  ]);

  const otherUserIds = (members ?? [])
    .map((m) => m.user_id)
    .filter((id) => id !== userData.user.id);

  if (otherUserIds.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("*")
    .in("user_id", otherUserIds);

  let sentCount = 0;
  const name = profile?.full_name ?? "Seseorang";
  const groupName = group?.name ?? "pot";

  for (const sub of subs ?? []) {
    const result = await sendPushToSubscription(sub, {
      title: `${name} baru menabung`,
      body: `Rp ${Number(amount).toLocaleString("id-ID")} ditambahkan ke ${groupName}.`,
      url: `/groups/${groupId}`,
      tag: `contribution-${groupId}`,
    });

    if (result.success) sentCount += 1;
    if (!result.success && result.expired) {
      await admin.from("push_subscriptions").delete().eq("id", sub.id);
    }
  }

  return NextResponse.json({ sent: sentCount });
}
