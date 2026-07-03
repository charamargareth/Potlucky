"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase handles token from URL hash automatically
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirmPassword) return setError("Password tidak cocok.");

    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Gagal update password: " + updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-5">
        <div className="bg-glass border border-pink-soft rounded-3xl p-8 max-w-sm w-full text-center animate-rise">
          <div className="size-14 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="size-7 text-mint" />
          </div>
          <h2 className="font-display text-xl text-ink mb-2">Password berhasil diubah!</h2>
          <p className="text-sm text-ink-soft">Kamu akan diarahkan ke dashboard…</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-5">
        <div className="bg-glass border border-pink-soft rounded-3xl p-8 max-w-sm w-full text-center animate-rise">
          <div className="size-10 border-2 border-pink-strong border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-ink-soft">Memvalidasi link reset…</p>
          <p className="text-xs text-ink-soft mt-3">
            Kalau lama, coba klik link di email lagi atau{" "}
            <Link href="/forgot-password" className="text-pink-deep underline">minta link baru</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5">
      <div className="w-full max-w-md animate-rise">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl text-ink">Potlucky</Link>
          <p className="text-sm text-ink-soft mt-2">Buat password baru</p>
        </div>

        <div className="bg-glass border border-pink-soft rounded-3xl p-7">
          <h2 className="font-display text-xl text-ink mb-1">Reset password</h2>
          <p className="text-sm text-ink-soft mb-6">Masukkan password baru kamu di bawah ini.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Password Baru</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 karakter"
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-pink-soft bg-glass text-sm text-ink placeholder:text-ink-soft/60 outline-none focus:border-pink-strong transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-ink placeholder:text-ink-soft/60 outline-none transition-colors ${
                    confirmPassword && confirmPassword !== password
                      ? "border-amber bg-amber-soft/20"
                      : "border-pink-soft bg-glass focus:border-pink-strong"
                  }`}
                />
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-amber mt-1 ml-1">Password tidak cocok</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-amber-soft/60 rounded-xl p-3">
                <AlertCircle className="size-4 text-amber shrink-0 mt-0.5" />
                <p className="text-xs text-amber font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan…
                </>
              ) : "Simpan password baru"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}