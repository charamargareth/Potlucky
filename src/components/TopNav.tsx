"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { LogOut, Activity, BookOpen } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import type { Profile } from "@/types/database";

export default function TopNav({ profile }: { profile: Profile | null }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-sm border-b border-pink-soft/60">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="font-display text-2xl text-ink">
          Potlucky
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/guide"
            aria-label="Panduan"
            className="size-9 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors"
          >
            <BookOpen className="size-5" />
          </Link>

          <Link
            href="/activity"
            aria-label="Aktivitas"
            className="size-9 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors"
          >
            <Activity className="size-5" />
          </Link>

          <NotificationBell />

          <div className="flex items-center gap-2.5 pl-3 border-l border-pink-soft/60">
            <Link href="/profile" aria-label="Profil kamu" className="shrink-0">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name ?? "Avatar"}
                  width={32}
                  height={32}
                  className="size-8 rounded-full object-cover hover:ring-2 hover:ring-pink-strong transition-all"
                />
              ) : (
                <div className="size-8 rounded-full bg-pink-soft flex items-center justify-center text-xs font-semibold text-pink-deep hover:ring-2 hover:ring-pink-strong transition-all">
                  {getInitials(profile?.full_name)}
                </div>
              )}
            </Link>
            <span className="hidden sm:block text-sm font-medium text-ink max-w-[120px] truncate">
              {profile?.full_name ?? "Pengguna"}
            </span>
            <button
              onClick={handleSignOut}
              aria-label="Keluar"
              title="Keluar"
              className="size-8 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}