import GoogleLoginButton from "@/components/GoogleLoginButton";
import SavingsJar from "@/components/ui/SavingsJar";
import Card from "@/components/ui/Card";
import {
  Users,
  QrCode,
  Bell,
  Target,
  Calculator,
  NotebookPen,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Satu pot, banyak tangan",
    body: "Undang teman, pacar, atau keluarga ke satu pool tabungan yang sama. Semua kontribusi terlihat oleh semua orang.",
  },
  {
    icon: QrCode,
    title: "Gabung lewat kode atau QR",
    body: "Bagikan kode undangan atau pindai QR untuk langsung bergabung ke pot bersama.",
  },
  {
    icon: Target,
    title: "Target harian, mingguan, bulanan",
    body: "Atur target sesuai ritme kamu — mau dicicil tiap hari atau dikumpul tiap bulan, terserah kelompok.",
  },
  {
    icon: Calculator,
    title: "Rekomendasi nabung otomatis",
    body: "Sistem hitung berapa yang perlu disisihkan tiap periode berdasarkan target, tenggat, dan budget kamu.",
  },
  {
    icon: Bell,
    title: "Pengingat & notifikasi",
    body: "Dapat pengingat sebelum lupa nabung, dan tahu kapan anggota lain baru saja menabung.",
  },
  {
    icon: NotebookPen,
    title: "Logbook dari hari pertama",
    body: "Setiap kontribusi tercatat rapi — telusuri histori menabung dari awal sampai target tercapai.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="px-6 pt-14 pb-16 md:pt-20 md:pb-24 max-w-5xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-rise">
            <span className="inline-block text-xs font-semibold tracking-wide uppercase text-pink-deep bg-pink-soft/60 px-3 py-1 rounded-full mb-5">
              Nabung bareng, bukan sendirian
            </span>
            <h1 className="font-display text-4xl md:text-5xl leading-[1.1] text-ink mb-5">
              Satu pot,
              <br />
              diisi bersama.
            </h1>
            <p className="text-ink-soft text-[17px] leading-relaxed mb-8 max-w-md">
              Potlucky membantu kamu dan orang-orang terdekat mengumpulkan
              tabungan untuk satu tujuan bersama — liburan, kado, atau
              dana darurat keluarga. Tercatat rapi, terlihat semua orang.
            </p>
            <div className="max-w-xs">
              <GoogleLoginButton />
            </div>
            <p className="text-xs text-ink-soft mt-3">
              Gratis. Data tersimpan aman di akun Google kamu.
            </p>
          </div>
          <div className="flex justify-center animate-rise" style={{ animationDelay: "0.1s" }}>
            <SavingsJar fillPercent={62} className="w-56 md:w-72 drop-shadow-[0_20px_30px_rgba(224,71,106,0.18)]" />
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <h2 className="font-display text-2xl text-ink mb-8 text-center">
          Semua yang dibutuhkan untuk nabung rame-rame
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Card key={f.title} className="p-6 animate-rise" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="size-10 rounded-xl bg-pink-soft/60 flex items-center justify-center mb-4">
                <f.icon className="size-5 text-pink-deep" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-ink mb-1.5">{f.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-ink-soft border-t border-pink-soft/60">
        Potlucky — dibuat untuk yang lebih suka nabung berdua atau rame-rame.
      </footer>
    </main>
  );
}
