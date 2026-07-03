"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, CheckCircle2, AlertCircle, ChevronLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return setError("Masukkan email kamu.");
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError("Gagal mengirim email: " + resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5">
      <div className="w-full max-w-md animate-rise">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl text-ink">Potlucky</Link>
        </div>

        <div className="bg-glass border border-pink-soft rounded-3xl p-7">
          <Link
            href="/signin"
            className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-pink-deep transition-colors mb-6"
          >
            <ChevronLeft className="size-3.5" /> Kembali ke masuk
          </Link>

          {sent ? (
            <div className="text-center py-4">
              <div className="size-14 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="size-7 text-mint" />
              </div>
              <h2 className="font-display text-xl text-ink mb-2">Email terkirim!</h2>
              <p className="text-sm text-ink-soft leading-relaxed">
                Kami kirim link reset password ke <strong>{email}</strong>. Cek inbox (dan folder spam) kamu.
              </p>
              <p className="text-xs text-ink-soft mt-3">
                Link berlaku selama 1 jam.
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl text-ink mb-1">Lupa password?</h2>
              <p className="text-sm text-ink-soft mb-6">
                Masukkan email yang terdaftar dan kami akan kirim link untuk reset password.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@contoh.com"
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-soft bg-glass text-sm text-ink placeholder:text-ink-soft/60 outline-none focus:border-pink-strong transition-colors"
                    />
                  </div>
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
                      Mengirim…
                    </>
                  ) : "Kirim link reset"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}