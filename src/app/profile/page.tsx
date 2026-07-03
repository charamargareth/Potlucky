"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getInitials, formatCurrency } from "@/lib/utils";
import {
  ChevronLeft, Camera, CheckCircle2, User, Mail, Calendar,
  Shield, Bell, LogOut, PiggyBank, Users, TrendingUp, Pencil, X, AtSign, AlertCircle,
} from "lucide-react";
import type { Profile } from "@/types/database";

interface Stats {
  totalPots: number;
  totalSaved: number;
  totalContributions: number;
  memberSince: string;
}

function Avatar({
  profile,
  size = 96,
  uploading,
  onClick,
}: {
  profile: Profile;
  size?: number;
  uploading?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="relative inline-block">
      {profile.avatar_url ? (
        <Image
          src={profile.avatar_url}
          alt={profile.full_name ?? "Avatar"}
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full bg-gradient-to-br from-pink-soft to-pink-strong flex items-center justify-center font-semibold text-white"
          style={{ width: size, height: size, fontSize: size * 0.3 }}
        >
          {getInitials(profile.full_name)}
        </div>
      )}
      {onClick && (
        <button
          onClick={onClick}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 size-8 rounded-full bg-pink-strong text-white flex items-center justify-center shadow-lg hover:bg-pink-deep transition-colors disabled:opacity-60 border-2 border-white"
          aria-label="Ganti foto"
        >
          {uploading ? (
            <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="size-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof PiggyBank;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-glass border border-pink-soft rounded-2xl p-4 flex items-center gap-3">
      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="size-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="font-display text-base text-ink leading-none mb-0.5">{value}</p>
        <p className="text-[11px] text-ink-soft truncate">{label}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedUsername, setSavedUsername] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/"); return; }

      const [{ data: profileData }, { data: memberships }, { data: contributions }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userData.user.id).single(),
        supabase.from("group_members").select("group_id").eq("user_id", userData.user.id),
        supabase.from("contributions").select("amount, type").eq("user_id", userData.user.id),
      ]);

      if (profileData) {
        setProfile(profileData);
        setName(profileData.full_name ?? "");
        setUsername(profileData.username ?? "");
      }

      const totalSaved = (contributions ?? []).reduce((s, c) => {
        return c.type === "withdrawal" ? s - Number(c.amount) : s + Number(c.amount);
      }, 0);

      setStats({
        totalPots: memberships?.length ?? 0,
        totalSaved,
        totalContributions: contributions?.length ?? 0,
        memberSince: profileData?.created_at ?? "",
      });
    }
    load();
  }, [router]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Ukuran foto maksimal 2MB."); return; }

    setError("");
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userData.user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase.rpc("update_profile_avatar", { p_avatar_url: publicUrl });
      setProfile((p) => p ? { ...p, avatar_url: publicUrl } : p);
    } catch (err) {
      setError("Gagal upload foto: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveName() {
    if (!name.trim()) { setError("Nama tidak boleh kosong."); return; }
    setError("");
    setSaving(true);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), updated_at: new Date().toISOString() })
      .eq("id", userData.user.id);

    setSaving(false);
    if (updateError) { setError("Gagal menyimpan: " + updateError.message); return; }

    setProfile((p) => p ? { ...p, full_name: name.trim() } : p);
    setEditingName(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function checkUsername(val: string) {
    if (val.length < 3) return;
    setUsernameChecking(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("is_username_taken", { p_username: val });
    setUsernameTaken(!!data);
    setUsernameChecking(false);
  }

  async function handleSaveUsername() {
    if (!username.trim()) { setError("Username tidak boleh kosong."); return; }
    if (username.length < 3) { setError("Username minimal 3 karakter."); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Username hanya boleh huruf, angka, dan underscore."); return; }
    if (usernameTaken) { setError("Username sudah digunakan."); return; }

    setError("");
    setSavingUsername(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.rpc("update_username", { p_username: username.toLowerCase().trim() });

    setSavingUsername(false);
    if (updateError) { setError("Gagal menyimpan username: " + updateError.message); return; }

    setProfile((p) => p ? { ...p, username: username.toLowerCase().trim() } : p);
    setEditingUsername(false);
    setSavedUsername(true);
    setTimeout(() => setSavedUsername(false), 2500);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-2 border-pink-strong border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-soft">Memuat profil…</p>
        </div>
      </div>
    );
  }

  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="animate-rise">
      {/* Breadcrumb */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-pink-deep mb-8 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Kembali ke dashboard
      </Link>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Left sidebar ── */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-4">

          {/* Profile card */}
          <div className="bg-glass border border-pink-soft rounded-3xl p-6 flex flex-col items-center text-center">
            <div className="mb-4">
              <Avatar
                profile={profile}
                size={88}
                uploading={uploading}
                onClick={() => fileRef.current?.click()}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <h2 className="font-display text-xl text-ink mb-0.5">
              {profile.full_name ?? "Pengguna"}
            </h2>
            <p className="text-sm text-ink-soft mb-4">{profile.email}</p>

            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-mint bg-mint/10 px-3 py-1 rounded-full mb-5">
              <CheckCircle2 className="size-3.5" />
              Akun Aktif
            </span>

            <p className="text-[11px] text-ink-soft">
              JPG, PNG, WebP · maks. 2MB
            </p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 gap-3">
              <StatCard
                icon={Users}
                label="Pot yang diikuti"
                value={String(stats.totalPots)}
                color="bg-pink-strong"
              />
              <StatCard
                icon={PiggyBank}
                label="Total kontribusi kamu"
                value={formatCurrency(stats.totalSaved)}
                color="bg-mint"
              />
              <StatCard
                icon={TrendingUp}
                label="Jumlah catatan"
                value={`${stats.totalContributions}x`}
                color="bg-amber"
              />
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-2xl border border-pink-soft text-sm text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors"
          >
            <LogOut className="size-4" />
            Keluar dari akun
          </button>
        </aside>

        {/* ── Main area ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* Section: Informasi Pribadi */}
          <div className="bg-glass border border-pink-soft rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-pink-soft/60 flex items-center justify-center">
                  <User className="size-4 text-pink-deep" />
                </div>
                <h3 className="font-display text-lg text-ink">Informasi Pribadi</h3>
              </div>
              {saved && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-mint">
                  <CheckCircle2 className="size-3.5" />
                  Tersimpan
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* Nama */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">
                  Nama Tampilan
                </label>
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      className="flex-1 rounded-xl border border-pink-soft bg-glass px-4 py-2.5 text-sm text-ink outline-none focus:border-pink-strong transition-colors"
                      placeholder="Nama tampilan kamu"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="h-10 px-4 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors disabled:opacity-60"
                    >
                      {saving ? "…" : "Simpan"}
                    </button>
                    <button
                      onClick={() => { setEditingName(false); setName(profile.full_name ?? ""); }}
                      className="size-10 flex items-center justify-center rounded-xl border border-pink-soft text-ink-soft hover:bg-peach transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-pink-soft bg-peach/30">
                    <span className="text-sm text-ink font-medium">{profile.full_name ?? "—"}</span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="size-7 flex items-center justify-center rounded-lg text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">
                  Username
                </label>
                {editingUsername ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                        <input
                          autoFocus
                          value={username}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
                            setUsername(val);
                            setUsernameTaken(false);
                            if (val.length >= 3 && val !== profile.username) {
                              setTimeout(() => checkUsername(val), 600);
                            }
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
                          className={`w-full pl-10 pr-9 py-2.5 rounded-xl border text-sm text-ink outline-none transition-colors ${
                            usernameTaken ? "border-amber bg-amber-soft/20" : "border-pink-soft bg-glass focus:border-pink-strong"
                          }`}
                          placeholder="username_kamu"
                        />
                        {username.length >= 3 && username !== profile.username && (
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                            {usernameChecking ? (
                              <span className="size-3.5 border-2 border-pink-soft border-t-pink-strong rounded-full animate-spin block" />
                            ) : usernameTaken ? (
                              <AlertCircle className="size-4 text-amber" />
                            ) : (
                              <CheckCircle2 className="size-4 text-mint" />
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleSaveUsername}
                        disabled={savingUsername || usernameTaken}
                        className="h-10 px-4 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors disabled:opacity-60"
                      >
                        {savingUsername ? "…" : "Simpan"}
                      </button>
                      <button
                        onClick={() => { setEditingUsername(false); setUsername(profile.username ?? ""); setUsernameTaken(false); }}
                        className="size-10 flex items-center justify-center rounded-xl border border-pink-soft text-ink-soft hover:bg-peach transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    {usernameTaken && (
                      <p className="text-[11px] text-amber ml-1">Username sudah digunakan, coba yang lain.</p>
                    )}
                    {!usernameTaken && username.length >= 3 && !usernameChecking && username !== profile.username && (
                      <p className="text-[11px] text-mint ml-1">Username tersedia!</p>
                    )}
                    <p className="text-[11px] text-ink-soft ml-1">Hanya huruf, angka, dan underscore. Min. 3 karakter.</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-pink-soft bg-peach/30">
                    <div className="flex items-center gap-2">
                      <AtSign className="size-3.5 text-ink-soft" />
                      <span className="text-sm text-ink font-medium">
                        {profile.username ?? <span className="text-ink-soft italic">Belum diset</span>}
                      </span>
                    </div>
                    <button
                      onClick={() => setEditingUsername(true)}
                      className="size-7 flex items-center justify-center rounded-lg text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>
                )}
                {savedUsername && (
                  <p className="text-[11px] text-mint mt-1.5 ml-1 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Username berhasil disimpan
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">
                  Email
                </label>
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-pink-soft bg-peach/30">
                  <Mail className="size-4 text-ink-soft shrink-0" />
                  <span className="text-sm text-ink truncate">{profile.email ?? "—"}</span>
                </div>
                <p className="text-[11px] text-ink-soft mt-1.5 ml-1">Diatur oleh Google, tidak bisa diubah</p>
              </div>

              {/* Bergabung sejak */}
              <div>
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">
                  Bergabung Sejak
                </label>
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-pink-soft bg-peach/30">
                  <Calendar className="size-4 text-ink-soft shrink-0" />
                  <span className="text-sm text-ink">{joinDate}</span>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-amber font-medium mt-4">{error}</p>
            )}
          </div>

          {/* Section: Keamanan Akun */}
          <div className="bg-glass border border-pink-soft rounded-3xl p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="size-8 rounded-xl bg-amber-soft flex items-center justify-center">
                <Shield className="size-4 text-amber" />
              </div>
              <h3 className="font-display text-lg text-ink">Keamanan Akun</h3>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-pink-soft bg-peach/20">
                <div>
                  <p className="text-sm font-semibold text-ink">Login dengan Google</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Akun kamu terhubung dengan {profile.email}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-mint bg-mint/10 px-2.5 py-1 rounded-full shrink-0">
                  <CheckCircle2 className="size-3" />
                  Terhubung
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-pink-soft bg-peach/20">
                <div>
                  <p className="text-sm font-semibold text-ink">Password</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Login pakai Google tidak memerlukan password
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-ink-soft bg-peach px-2.5 py-1 rounded-full shrink-0">
                  Tidak berlaku
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center justify-between p-4 rounded-2xl border border-amber/30 bg-amber-soft/30 hover:bg-amber-soft/60 transition-colors text-left w-full"
              >
                <div>
                  <p className="text-sm font-semibold text-amber">Keluar dari semua perangkat</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Sesi aktif akan dihentikan di semua browser
                  </p>
                </div>
                <LogOut className="size-4 text-amber shrink-0" />
              </button>
            </div>
          </div>

          {/* Section: Preferensi Notifikasi */}
          <div className="bg-glass border border-pink-soft rounded-3xl p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="size-8 rounded-xl bg-pink-soft/60 flex items-center justify-center">
                <Bell className="size-4 text-pink-deep" />
              </div>
              <h3 className="font-display text-lg text-ink">Notifikasi</h3>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { label: "Anggota menabung ke pot kamu", desc: "Notifikasi saat ada kontribusi baru", active: true },
                { label: "Anggota bergabung ke pot", desc: "Notifikasi saat ada anggota baru", active: true },
                { label: "Target pot tercapai", desc: "Notifikasi saat 100% progress tercapai", active: true },
                { label: "Pengingat nabung harian", desc: "Atur jadwal di halaman masing-masing pot", active: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl border border-pink-soft bg-peach/20">
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.label}</p>
                    <p className="text-xs text-ink-soft mt-0.5">{item.desc}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    item.active ? "text-mint bg-mint/10" : "text-ink-soft bg-peach"
                  }`}>
                    {item.active ? "Aktif" : "Per pot"}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-soft mt-4 ml-1">
              Pengaturan notifikasi push bisa diatur per pot lewat tombol "Pengingat" di halaman pot.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}