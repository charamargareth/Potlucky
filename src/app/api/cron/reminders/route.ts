import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToSubscription } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Endpoint ini dipanggil oleh scheduler eksternal (Vercel Cron / cron-job.org)
 * setiap jam, lalu mengecek siapa saja yang reminder-nya jatuh pada jam ini
 * dan belum menabung hari ini, lalu mengirim push notification + log notifikasi in-app.
 *
 * Lindungi endpoint ini dengan header Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const currentHour = now.getUTCHours(); // sesuaikan dengan timezone server cron jika perlu
  const currentWeekday = now.getUTCDay();
  const currentDayOfMonth = now.getUTCDate();
  const today = now.toISOString().slice(0, 10);

  const { data: reminders, error } = await supabase
    .from("reminder_settings")
    .select("*, group:savings_groups(name)")
    .eq("is_active", true)
    .eq("remind_hour", currentHour);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dueReminders = (reminders ?? []).filter((r) => {
    if (r.frequency === "daily") return true;
    if (r.frequency === "weekly") return r.remind_weekday === currentWeekday;
    if (r.frequency === "monthly") return r.remind_day_of_month === currentDayOfMonth;
    return false;
  });

  let sentCount = 0;

  for (const reminder of dueReminders) {
    // Skip jika user sudah menabung hari ini di grup ini
    const { data: existing } = await supabase
      .from("contributions")
      .select("id")
      .eq("group_id", reminder.group_id)
      .eq("user_id", reminder.user_id)
      .eq("contributed_on", today)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const groupName =
      (reminder as unknown as { group?: { name: string } }).group?.name ?? "potmu";

    // Log notifikasi in-app
    await supabase.from("notifications").insert({
      user_id: reminder.user_id,
      group_id: reminder.group_id,
      type: "reminder",
      title: "Waktunya nabung",
      body: `Jangan lupa nabung di ${groupName} hari ini.`,
    });

    // Kirim push notification ke semua device user
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", reminder.user_id);

    for (const sub of subs ?? []) {
      const result = await sendPushToSubscription(sub, {
        title: "Waktunya nabung",
        body: `Jangan lupa nabung di ${groupName} hari ini.`,
        url: `/groups/${reminder.group_id}`,
        tag: `reminder-${reminder.group_id}`,
      });

      if (!result.success && result.expired) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }

    sentCount += 1;
  }

  return NextResponse.json({ checked: dueReminders.length, sent: sentCount });
}
