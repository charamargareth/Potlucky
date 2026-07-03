"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import {
  Eye, EyeOff, User, Mail, Lock, AtSign, CheckCircle2, AlertCircle,
} from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "Min. 8 karakter", ok: password.length >= 8 },
    { label: "Huruf besar", ok: /[A-Z]/.test(password) },
    { label: "Huruf kecil", ok: /[a-z]/.test(password) },
    { label: "Angka", ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-pink-soft", "bg-amber", "bg-amber", "bg-mint", "bg-mint"];
  const labels = ["", "Lemah", "Sedang", "Kuat", "Sangat kuat"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-pink-soft"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-ink-soft">{labels[score]}</p>
        <div className="flex gap-2">
          {checks.map((c) => (
            <span key={c.label} className={`text-[10px] ${c.ok ? "text-mint" : "text-ink-soft/50"}`}>
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function checkUsername(val: string) {
    if (val.length < 3) return;
    setUsernameChecking(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("is_username_taken", { p_username: val });
    setUsernameTaken(!!data);
    setUsernameChecking(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) return setError("Nama lengkap wajib diisi.");
    if (username.length < 3) return setError("Username minimal 3 karakter.");
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return setError("Username hanya boleh huruf, angka, dan underscore.");
    if (usernameTaken) return setError("Username sudah digunakan, pilih yang lain.");
    if (!email) return setError("Email wajib diisi.");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirmPassword) return setError("Password dan konfirmasi tidak cocok.");
    if (!agree) return setError("Kamu harus menyetujui syarat & ketentuan.");

    setLoading(true);
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          username: username.toLowerCase().trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("Email ini sudah terdaftar. Coba masuk atau gunakan email lain.");
      } else {
        setError(signUpError.message);
      }
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-5">
        <div className="bg-glass border border-pink-soft rounded-3xl p-8 max-w-sm w-full text-center animate-rise">
          <div className="size-16 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="size-8 text-mint" />
          </div>
          <h2 className="font-display text-2xl text-ink mb-2">Cek email kamu!</h2>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            Kami kirim link konfirmasi ke <strong>{email}</strong>. Klik link itu untuk mengaktifkan akun dan mulai nabung.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center w-full h-11 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors"
          >
            Ke halaman masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md animate-rise">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl text-ink">
            Potlucky
          </Link>
          <p className="text-sm text-ink-soft mt-2">Buat akun baru</p>
        </div>

        <div className="bg-glass border border-pink-soft rounded-3xl p-7">
          {/* Google */}
          <GoogleLoginButton label="Daftar dengan Google" />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-pink-soft" />
            <span className="text-xs text-ink-soft font-medium">atau daftar dengan email</span>
            <div className="flex-1 h-px bg-pink-soft" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full name */}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama kamu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-soft bg-glass text-sm text-ink placeholder:text-ink-soft/60 outline-none focus:border-pink-strong transition-colors"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
                    setUsername(val);
                    setUsernameTaken(false);
                    if (val.length >= 3) {
                      const t = setTimeout(() => checkUsername(val), 600);
                      return () => clearTimeout(t);
                    }
                  }}
                  placeholder="contoh: bula_nabung"
                  className={`w-full pl-10 pr-9 py-2.5 rounded-xl border text-sm text-ink placeholder:text-ink-soft/60 outline-none transition-colors ${
                    usernameTaken ? "border-amber bg-amber-soft/20" : "border-pink-soft bg-glass focus:border-pink-strong"
                  }`}
                />
                {username.length >= 3 && (
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
              {usernameTaken && (
                <p className="text-[11px] text-amber mt-1 ml-1">Username sudah digunakan</p>
              )}
              {!usernameTaken && username.length >= 3 && !usernameChecking && (
                <p className="text-[11px] text-mint mt-1 ml-1">Username tersedia</p>
              )}
            </div>

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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-soft bg-glass text-sm text-ink placeholder:text-ink-soft/60 outline-none focus:border-pink-strong transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 karakter"
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
              <PasswordStrength password={password} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-ink placeholder:text-ink-soft/60 outline-none transition-colors ${
                    confirmPassword && confirmPassword !== password
                      ? "border-amber bg-amber-soft/20"
                      : "border-pink-soft bg-glass focus:border-pink-strong"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-amber mt-1 ml-1">Password tidak cocok</p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 accent-pink-strong shrink-0"
              />
              <span className="text-xs text-ink-soft leading-relaxed">
                Saya menyetujui{" "}
                <Link href="/guide" className="text-pink-deep hover:text-pink-strong underline">
                  syarat & ketentuan
                </Link>{" "}
                Potlucky
              </span>
            </label>

            {error && (
              <div className="flex items-start gap-2 bg-amber-soft/60 rounded-xl p-3">
                <AlertCircle className="size-4 text-amber shrink-0 mt-0.5" />
                <p className="text-xs text-amber font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || usernameTaken}
              className="w-full h-11 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Membuat akun…
                </>
              ) : "Buat akun"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-soft mt-5">
          Sudah punya akun?{" "}
          <Link href="/signin" className="text-pink-deep font-semibold hover:text-pink-strong transition-colors">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}