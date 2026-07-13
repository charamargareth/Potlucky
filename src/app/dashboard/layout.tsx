import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/TopNav";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import type { Profile } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (userData.user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();
    profile = data;
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopNav profile={profile} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-5 py-8">
        <PWAInstallPrompt />
        {children}
      </main>
    </div>
  );
}