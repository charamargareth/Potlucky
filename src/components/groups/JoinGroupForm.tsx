"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import jsQR from "jsqr";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ChevronLeft, Camera, X } from "lucide-react";

export default function JoinGroupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(() => searchParams.get("code")?.toUpperCase() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  async function joinWithCode(inviteCode: string) {
    setError("");
    const trimmed = inviteCode.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError("Kode undangan tidak valid.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Sesi berakhir, silakan masuk ulang.");
      setLoading(false);
      return;
    }

    const { data: group, error: groupError } = await supabase
      .from("savings_groups")
      .select("id")
      .eq("invite_code", trimmed)
      .maybeSingle();

    if (groupError || !group) {
      setError("Kode undangan tidak ditemukan. Periksa kembali kodenya.");
      setLoading(false);
      return;
    }

    const { error: joinError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: userData.user.id,
      role: "member",
    });

    if (joinError && !joinError.message.includes("duplicate")) {
      setError("Gagal bergabung: " + joinError.message);
      setLoading(false);
      return;
    }

    router.push(`/groups/${group.id}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    joinWithCode(code);
  }

  async function startScan() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        tick();
      }
    } catch {
      setError(
        "Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan, atau masukkan kode manual."
      );
    }
  }

  function stopScan() {
    setScanning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function tick() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height);

    if (result?.data) {
      stopScan();
      // QR berisi invite code langsung, atau URL berisi ?code=XXXXX
      let extracted = result.data.trim();
      try {
        const url = new URL(extracted);
        extracted = url.searchParams.get("code") ?? extracted;
      } catch {
        // bukan URL, anggap sebagai kode langsung
      }
      setCode(extracted.toUpperCase());
      joinWithCode(extracted);
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }

  return (
    <div className="max-w-lg mx-auto animate-rise">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-pink-deep mb-5 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Kembali
      </Link>

      <h1 className="font-display text-2xl text-ink mb-1">
        Gabung ke pot
      </h1>
      <p className="text-sm text-ink-soft mb-6">
        Masukkan kode undangan dari teman, atau pindai QR code-nya.
      </p>

      <Card className="p-6">
        {scanning ? (
          <div className="flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-ink aspect-square">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              <div className="absolute inset-8 border-2 border-pink-soft rounded-2xl" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <Button
              type="button"
              variant="outline"
              onClick={stopScan}
              className="w-full"
            >
              <X className="size-4" />
              Batalkan pindai
            </Button>
          </div>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={startScan}
              className="w-full mb-5"
              size="lg"
            >
              <Camera className="size-5" />
              Pindai QR code
            </Button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-pink-soft" />
              <span className="text-xs text-ink-soft">atau</span>
              <div className="flex-1 h-px bg-pink-soft" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Kode undangan"
                placeholder="Misal: A7K2P9X"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="uppercase tracking-widest font-semibold text-center"
              />

              {error && (
                <p className="text-sm text-amber font-medium">{error}</p>
              )}

              <Button type="submit" loading={loading} size="lg">
                Gabung sekarang
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
