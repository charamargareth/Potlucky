"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { ChevronLeft, Camera, CheckCircle2 } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/database";

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      if (data) {
        setProfile(data);
        setName(data.full_name ?? "");
      }
    }
    load();
  }, [router]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran foto maksimal 2MB.");
      return;
    }

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

    if (updateError) {
      setError("Gagal menyimpan: " + updateError.message);
      return;
    }

    setProfile((p) => p ? { ...p, full_name: name.trim() } : p);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-soft text-sm">
        Memuat profil…
      </div>
    );
  }

  return (
    <div className="animate-rise max-w-md mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-pink-deep mb-6 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Kembali ke dashboard
      </Link>

      <h1 className="font-display text-2xl text-ink mb-6">Profil kamu</h1>

      <Card className="p-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Avatar"
                width={96}
                height={96}
                className="size-24 rounded-full object-cover"
              />
            ) : (
              <div className="size-24 rounded-full bg-pink-soft flex items-center justify-center text-2xl font-semibold text-pink-deep">
                {getInitials(profile.full_name)}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 size-8 rounded-full bg-pink-strong text-white flex items-center justify-center shadow-md hover:bg-pink-deep transition-colors disabled:opacity-60"
              aria-label="Ganti foto profil"
            >
              {uploading ? (
                <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="size-3.5" />
              )}
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <p className="text-xs text-ink-soft mt-3">
            JPG, PNG, atau WebP · maks. 2MB
          </p>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-4">
          <Input
            label="Nama tampilan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama yang ditampilkan ke anggota lain"
          />

          <Input
            label="Email"
            value={profile.email ?? ""}
            disabled
            hint="Email tidak bisa diubah — diatur oleh Google"
          />

          {error && <p className="text-sm text-amber font-medium">{error}</p>}

          <Button onClick={handleSaveName} loading={saving}>
            {saved ? (
              <>
                <CheckCircle2 className="size-4" />
                Tersimpan
              </>
            ) : "Simpan nama"}
          </Button>
        </div>
      </Card>
    </div>
  );
}