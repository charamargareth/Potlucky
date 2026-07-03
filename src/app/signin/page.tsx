"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email) return setError("Email wajib diisi.");
    if (!password) return setError("Password wajib diisi.");

    setLoading(true);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Email atau password salah. Coba lagi atau gunakan Lupa Password.");
      } else if (signInError.message.includes("Email not confirmed")) {
        setError("Email belum dikonfirmasi. Cek inbox kamu dan klik link konfirmasi.");
      } else {
        setError(signInError.message);
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md animate-rise">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl text-ink">
            Potlucky
          </Link>
          <p className="text-sm text-ink-soft mt-2">Masuk ke akun kamu</p>
        </div>

        <div className="bg-glass border border-pink-soft rounded-3xl p-7">
          {/* Google */}
          <GoogleLoginButton label="Masuk dengan Google" />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-pink-soft" />
            <span className="text-xs text-ink-soft font-medium">atau masuk dengan email</span>
            <div className="flex-1 h-px bg-pink-soft" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-soft bg-glass text-sm text-ink placeholder:text-ink-soft/60 outline-none focus:border-pink-strong transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink-soft">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-pink-deep hover:text-pink-strong transition-colors font-semibold"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password kamu"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-pink-soft bg-glass text-sm text-ink placeholder:text-ink-soft/60 outline-none focus:border-pink-strong transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-pink-strong"
              />
              <span className="text-xs text-ink-soft">Ingat saya di perangkat ini</span>
            </label>

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
                  Masuk…
                </>
              ) : "Masuk"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-soft mt-5">
          Belum punya akun?{" "}
          <Link href="/signup" className="text-pink-deep font-semibold hover:text-pink-strong transition-colors">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}