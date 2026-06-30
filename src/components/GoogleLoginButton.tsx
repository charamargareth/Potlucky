"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function GoogleLoginButton({
  label = "Masuk dengan Google",
}: {
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setLoading(false);
      alert("Gagal masuk: " + error.message);
    }
  }

  return (
    <Button
      onClick={handleLogin}
      loading={loading}
      size="lg"
      className="w-full"
    >
      {!loading && (
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            fill="#FFFFFF"
            d="M21.35 11.1h-9.17v2.92h5.4c-.23 1.45-1.65 4.25-5.4 4.25-3.25 0-5.9-2.69-5.9-6s2.65-6 5.9-6c1.85 0 3.09.79 3.8 1.47l2.59-2.5C16.95 3.45 14.7 2.5 12.18 2.5c-5.27 0-9.55 4.28-9.55 9.5s4.28 9.5 9.55 9.5c5.52 0 9.17-3.88 9.17-9.34 0-.63-.07-1.11-.15-1.56Z"
          />
        </svg>
      )}
      {label}
    </Button>
  );
}
