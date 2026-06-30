"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Bell, BellOff, X, Share, SquarePlus } from "lucide-react";
import { isIOS, isStandalonePWA, supportsWebPush } from "@/lib/platform";
import type { ReminderFrequency, ReminderSetting } from "@/types/database";

const frequencyOptions: { value: ReminderFrequency; label: string }[] = [
  { value: "daily", label: "Setiap hari" },
  { value: "weekly", label: "Setiap minggu" },
  { value: "monthly", label: "Setiap bulan" },
  { value: "off", label: "Matikan" },
];

const weekdays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function ReminderSettingsModal({
  groupId,
  onClose,
}: {
  groupId: string;
  onClose: () => void;
}) {
  const [setting, setSetting] = useState<ReminderSetting | null>(null);
  const [frequency, setFrequency] = useState<ReminderFrequency>("daily");
  const [hour, setHour] = useState(19);
  const [weekday, setWeekday] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<
    "idle" | "unsupported" | "needs_install" | "denied" | "granted" | "requesting"
  >("idle");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from("reminder_settings")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (data) {
        setSetting(data);
        setFrequency(data.frequency);
        setHour(data.remind_hour);
        setWeekday(data.remind_weekday ?? 1);
        setDayOfMonth(data.remind_day_of_month ?? 1);
      }
      setLoading(false);

      if (typeof window === "undefined" || !("Notification" in window)) {
        setPushStatus("unsupported");
      } else if (Notification.permission === "granted" && supportsWebPush()) {
        setPushStatus("granted");
      } else if (isIOS() && !isStandalonePWA()) {
        // iOS hanya mendukung push jika web app sudah di-install ke Home Screen
        setPushStatus("needs_install");
      } else if (!supportsWebPush()) {
        setPushStatus("unsupported");
      } else {
        setPushStatus("idle");
      }
    }
    load();
  }, [groupId]);

  async function enablePushNotifications() {
    if (!supportsWebPush()) {
      setPushStatus(isIOS() && !isStandalonePWA() ? "needs_install" : "unsupported");
      return;
    }

    setPushStatus("requesting");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushStatus("denied");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY belum diatur.");
        setPushStatus("granted");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const subJson = subscription.toJSON();
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: userData.user.id,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh,
          auth: subJson.keys!.auth,
        },
        { onConflict: "endpoint" }
      );

      setPushStatus("granted");
    } catch (err) {
      console.error(err);
      setPushStatus("denied");
    }
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      return;
    }

    await supabase.from("reminder_settings").upsert(
      {
        id: setting?.id,
        user_id: userData.user.id,
        group_id: groupId,
        frequency,
        remind_hour: hour,
        remind_minute: 0,
        remind_weekday: frequency === "weekly" ? weekday : null,
        remind_day_of_month: frequency === "monthly" ? dayOfMonth : null,
        is_active: frequency !== "off",
      },
      { onConflict: "user_id,group_id" }
    );

    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="bg-glass rounded-3xl p-6 max-w-sm w-full animate-rise relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach transition-colors"
        >
          <X className="size-4" />
        </button>

        <h3 className="font-display text-xl text-ink mb-1">
          Pengingat nabung
        </h3>
        <p className="text-sm text-ink-soft mb-6">
          Atur kapan kamu mau diingatkan untuk menabung di pot ini.
        </p>

        {loading ? (
          <p className="text-sm text-ink-soft">Memuat…</p>
        ) : (
          <div className="flex flex-col gap-5">
            {pushStatus !== "granted" &&
              pushStatus !== "unsupported" &&
              pushStatus !== "needs_install" && (
                <button
                  onClick={enablePushNotifications}
                  disabled={pushStatus === "requesting"}
                  className="flex items-center gap-2.5 bg-pink-soft/40 border border-pink-strong/30 rounded-xl px-4 py-3 text-left hover:bg-pink-soft/60 transition-colors"
                >
                  <Bell className="size-4.5 text-pink-deep shrink-0" />
                  <span className="text-sm text-ink font-medium">
                    {pushStatus === "requesting"
                      ? "Meminta izin…"
                      : pushStatus === "denied"
                      ? "Izin ditolak — aktifkan lewat setelan browser"
                      : "Aktifkan notifikasi push di perangkat ini"}
                  </span>
                </button>
              )}

            {pushStatus === "needs_install" && (
              <div className="bg-pink-soft/40 border border-pink-strong/30 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Bell className="size-4.5 text-pink-deep shrink-0" />
                  <span className="text-sm text-ink font-semibold">
                    Aktifkan notifikasi di iPhone/iPad
                  </span>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed mb-2">
                  Di iPhone/iPad, notifikasi hanya bisa aktif setelah Potlucky
                  ditambahkan ke Layar Utama. Caranya:
                </p>
                <ol className="text-xs text-ink-soft leading-relaxed flex flex-col gap-1.5">
                  <li className="flex items-center gap-1.5">
                    <span className="font-semibold text-ink shrink-0">1.</span>
                    Ketuk ikon
                    <Share className="size-3.5 text-pink-deep inline shrink-0" />
                    Bagikan di Safari
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="font-semibold text-ink shrink-0">2.</span>
                    Pilih
                    <SquarePlus className="size-3.5 text-pink-deep inline shrink-0" />
                    &quot;Tambah ke Layar Utama&quot;
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="font-semibold text-ink shrink-0">3.</span>
                    Buka Potlucky dari ikon di Layar Utama
                  </li>
                </ol>
              </div>
            )}

            {pushStatus === "unsupported" && (
              <div className="flex items-center gap-2.5 bg-amber-soft rounded-xl px-4 py-3">
                <BellOff className="size-4.5 text-amber shrink-0" />
                <span className="text-sm text-ink">
                  Browser ini belum mendukung notifikasi push. Pengingat tetap
                  akan muncul sebagai notifikasi di dalam aplikasi.
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink">
                Frekuensi pengingat
              </label>
              <div className="grid grid-cols-2 gap-2">
                {frequencyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFrequency(opt.value)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                      frequency === opt.value
                        ? "border-pink-strong bg-pink-soft/50 text-ink"
                        : "border-pink-soft bg-glass text-ink-soft hover:bg-peach"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {frequency !== "off" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink">
                  Jam pengingat
                </label>
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="h-11 rounded-xl border border-pink-soft bg-glass px-4 text-[15px] text-ink outline-none focus:border-pink-strong"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
            )}

            {frequency === "weekly" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink">Hari</label>
                <select
                  value={weekday}
                  onChange={(e) => setWeekday(Number(e.target.value))}
                  className="h-11 rounded-xl border border-pink-soft bg-glass px-4 text-[15px] text-ink outline-none focus:border-pink-strong"
                >
                  {weekdays.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {frequency === "monthly" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink">
                  Tanggal (1–28)
                </label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="h-11 rounded-xl border border-pink-soft bg-glass px-4 text-[15px] text-ink outline-none focus:border-pink-strong"
                >
                  {Array.from({ length: 28 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tanggal {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button onClick={handleSave} loading={saving} size="lg">
              Simpan pengaturan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
