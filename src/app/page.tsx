import Link from "next/link";
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
  Minus,
  Share2,
  FileSpreadsheet,
  Trophy,
  ChevronDown,
  ShieldCheck,
  Zap,
  HeartHandshake,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Satu pot, banyak tangan",
    body: "Undang teman, pacar, atau keluarga ke satu pot tabungan. Semua kontribusi terlihat oleh semua orang.",
  },
  {
    icon: QrCode,
    title: "Gabung lewat kode atau QR",
    body: "Bagikan kode 7 karakter atau QR code — teman langsung bisa join dalam hitungan detik.",
  },
  {
    icon: Target,
    title: "Target fleksibel",
    body: "Atur target harian, mingguan, atau bulanan. Sistem otomatis hitung berapa yang perlu disisihkan tiap periode.",
  },
  {
    icon: Minus,
    title: "Catat pemakaian",
    body: "Uang sudah dipakai? Catat pengeluaran langsung di pot. Saldo otomatis berkurang dan tercatat rapi di logbook.",
  },
  {
    icon: Bell,
    title: "Pengingat & notifikasi",
    body: "Dapat pengingat sebelum lupa nabung, dan notifikasi real-time saat anggota lain menabung atau menarik uang.",
  },
  {
    icon: NotebookPen,
    title: "Logbook lengkap",
    body: "Setiap tabungan dan pemakaian tercatat — telusuri histori dari hari pertama sampai target tercapai.",
  },
  {
    icon: Share2,
    title: "Share undangan mudah",
    body: "Satu klik untuk bagikan link atau QR code undangan langsung ke WhatsApp, Line, atau media apapun.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export Excel & PDF",
    body: "Download riwayat tabungan sebagai file Excel atau PDF — cocok untuk rekap bersama keluarga atau arsip pribadi.",
  },
  {
    icon: Trophy,
    title: "Tandai target tercapai",
    body: "Pot yang sudah selesai bisa ditandai \"Tercapai\" — terpisah dari yang masih aktif di dashboard.",
  },
];

const benefits = [
  {
    icon: HeartHandshake,
    color: "bg-pink-soft/60",
    iconColor: "text-pink-deep",
    title: "Transparan ke semua anggota",
    body: "Tidak ada yang bisa menyembunyikan kontribusi atau pemakaian — semua tercatat dan terlihat oleh seluruh anggota pot.",
  },
  {
    icon: Zap,
    color: "bg-mint-soft",
    iconColor: "text-mint",
    title: "Langsung bisa dipakai",
    body: "Daftar dengan akun Google, buat pot, undang teman — semuanya selesai dalam 2 menit. Tidak perlu setup rumit.",
  },
  {
    icon: ShieldCheck,
    color: "bg-amber-soft",
    iconColor: "text-amber",
    title: "Uangmu tetap di tanganmu",
    body: "Potlucky hanya mencatat — tidak menyentuh uangmu. Tidak ada transfer, tidak ada dompet digital, tidak ada biaya tersembunyi.",
  },
];

const faqs = [
  {
    q: "Apakah Potlucky gratis?",
    a: "Ya, sepenuhnya gratis. Tidak ada biaya berlangganan, tidak ada iklan, tidak ada biaya tersembunyi.",
  },
  {
    q: "Apakah uang saya disimpan di Potlucky?",
    a: "Tidak. Potlucky adalah aplikasi pencatat tabungan — bukan dompet digital atau rekening bank. Uang tetap di tanganmu, aplikasi hanya membantu mencatat dan memantau progress bersama.",
  },
  {
    q: "Berapa banyak orang yang bisa join satu pot?",
    a: "Tidak ada batasan jumlah anggota per pot. Mau berdua, bertiga, atau satu keluarga besar — semua bisa.",
  },
  {
    q: "Apakah data saya aman?",
    a: "Data disimpan di Supabase dengan enkripsi standar industri. Login menggunakan akun Google kamu — kami tidak menyimpan password.",
  },
  {
    q: "Bisakah satu orang ikut banyak pot?",
    a: "Bisa. Kamu bisa buat pot sendiri sekaligus bergabung ke pot milik orang lain sebanyak yang dibutuhkan.",
  },
  {
    q: "Bagaimana kalau saya salah input jumlah?",
    a: "Tenang — setiap catatan tabungan atau pemakaian bisa diedit atau dihapus oleh orang yang membuatnya, lewat ikon pensil di Logbook.",
  },
  {
    q: "Apa bedanya \"Catat tabungan\" dan \"Catat pemakaian\"?",
    a: "Catat tabungan menambah saldo pot (hijau, tanda +). Catat pemakaian mengurangi saldo pot (oranye, tanda −) dan mencatat uang yang sudah digunakan dari pot.",
  },
  {
    q: "Apakah ada aplikasi mobile-nya?",
    a: "Potlucky adalah Progressive Web App (PWA) — bisa ditambahkan ke homescreen HP kamu langsung dari browser, dan bekerja seperti aplikasi native.",
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
              Satu pot,<br />diisi bersama.
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
              Gratis selamanya · Login dengan akun Google · Tidak perlu kartu kredit
            </p>
          </div>
          <div className="flex justify-center animate-rise" style={{ animationDelay: "0.1s" }}>
            <SavingsJar
              fillPercent={62}
              className="w-56 md:w-72 drop-shadow-[0_20px_30px_rgba(224,71,106,0.18)]"
            />
          </div>
        </div>
      </section>

      {/* Keunggulan / why Potlucky */}
      <section className="px-6 pb-16 max-w-5xl mx-auto w-full">
        <div className="grid sm:grid-cols-3 gap-4">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="flex gap-4 bg-glass border border-pink-soft rounded-2xl p-5">
                <div className={`size-10 rounded-xl ${b.color} flex items-center justify-center shrink-0`}>
                  <Icon className={`size-5 ${b.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm mb-1">{b.title}</h3>
                  <p className="text-xs text-ink-soft leading-relaxed">{b.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fitur grid */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl text-ink mb-2">
            Semua yang dibutuhkan untuk nabung rame-rame
          </h2>
          <p className="text-ink-soft text-sm max-w-md mx-auto">
            Dari catat tabungan sampai export laporan — semuanya ada, gratis, dan bisa langsung dipakai.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Card
              key={f.title}
              className="p-6 animate-rise"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="size-10 rounded-xl bg-pink-soft/60 flex items-center justify-center mb-4">
                <f.icon className="size-5 text-pink-deep" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-ink mb-1.5">{f.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works — singkat */}
      <section className="px-6 pb-20 bg-peach/50 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl text-ink mb-10 text-center">
            Mulai dalam 3 langkah
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: "1", title: "Login dengan Google", desc: "Tidak perlu daftar manual. Satu klik dengan akun Google kamu." },
              { n: "2", title: "Buat atau gabung pot", desc: "Buat pot baru dan atur targetnya, atau gabung ke pot milik teman lewat kode undangan." },
              { n: "3", title: "Mulai catat bersama", desc: "Setiap anggota catat tabungan masing-masing. Progress terpantau bersama secara real-time." },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="size-12 rounded-full bg-pink-strong text-white font-display text-xl flex items-center justify-center mx-auto mb-4">
                  {step.n}
                </div>
                <h3 className="font-semibold text-ink mb-2">{step.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <GoogleLoginButton />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 max-w-3xl mx-auto w-full">
        <h2 className="font-display text-2xl text-ink mb-8 text-center">
          Pertanyaan yang sering ditanyakan
        </h2>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group bg-glass border border-pink-soft rounded-2xl overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
                <span className="font-semibold text-ink text-sm">{faq.q}</span>
                <ChevronDown className="size-4 text-ink-soft shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4">
                <p className="text-sm text-ink-soft leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-ink-soft mb-2">
            Masih ada pertanyaan lain?
          </p>
          <Link
            href="/guide"
            className="text-sm font-semibold text-pink-deep hover:text-pink-strong transition-colors"
          >
            Baca panduan lengkap cara pakai →
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto w-full text-center">
        <div className="bg-pink-strong rounded-3xl px-8 py-12">
          <h2 className="font-display text-2xl text-white mb-3">
            Siap nabung bareng?
          </h2>
          <p className="text-white/80 text-sm mb-7 max-w-sm mx-auto">
            Gratis, tanpa kartu kredit, langsung bisa dipakai. Ajak teman kamu sekarang.
          </p>
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-1.5 inline-block">
              <GoogleLoginButton />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-pink-soft/60">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-soft">
          <span className="font-display text-sm text-ink">Potlucky</span>
          <div className="flex gap-5">
            <Link href="/guide" className="hover:text-pink-deep transition-colors">Panduan</Link>
            <a href="mailto:bantuan@potlucky.app" className="hover:text-pink-deep transition-colors">Hubungi kami</a>
          </div>
          <span>Dibuat dengan ♥ untuk yang suka nabung bareng.</span>
        </div>
      </footer>
    </main>
  );
}