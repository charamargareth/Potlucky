import Link from "next/link";
import {
  ChevronLeft,
  Plus,
  UserPlus,
  PiggyBank,
  Minus,
  QrCode,
  Bell,
  Share2,
  Trophy,
  Pencil,
  Trash2,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Plus,
    color: "bg-pink-strong",
    title: "Buat pot tabungan",
    desc: "Klik tombol \"Pot baru\" di dashboard. Isi nama pot, deskripsi (opsional), target jumlah, dan pilih periode target (harian, mingguan, atau bulanan). Klik Buat Pot.",
    tips: [
      "Nama pot sebaiknya spesifik — misal \"Liburan Bali Des 2025\" bukan cuma \"Liburan\"",
      "Target dan periode bisa diubah kapan saja lewat tombol Edit Pot",
    ],
  },
  {
    number: "02",
    icon: UserPlus,
    color: "bg-mint",
    title: "Undang teman ke pot",
    desc: "Di halaman pot, klik \"Undang anggota\". Kamu akan dapat kode unik 7 karakter dan QR code. Bagikan ke teman lewat tombol Bagikan Undangan — bisa langsung ke WhatsApp, Line, atau media lain.",
    tips: [
      "QR code bisa didownload sebagai gambar dan dikirim manual",
      "Kode undangan bisa diketik langsung di halaman /groups/join — pastikan huruf kapital semua",
    ],
  },
  {
    number: "03",
    icon: QrCode,
    color: "bg-pink-deep",
    title: "Bergabung ke pot",
    desc: "Kalau kamu dapat kode undangan dari teman, buka aplikasi → klik \"Gabung\" di dashboard. Masukkan kode 7 karakter atau scan QR code. Kamu langsung masuk ke pot dan bisa mulai nabung.",
    tips: [
      "Kode tidak peka huruf besar/kecil dan spasi diabaikan otomatis",
      "Setelah join, pemilik pot dapat notifikasi bahwa kamu bergabung",
    ],
  },
  {
    number: "04",
    icon: PiggyBank,
    color: "bg-pink-strong",
    title: "Catat tabungan",
    desc: "Di halaman pot, klik \"Catat tabungan\". Masukkan jumlah yang kamu sisihkan hari ini, tambahkan catatan opsional (misal: sisa uang makan), lalu simpan. Semua anggota langsung bisa lihat kontribusimu.",
    tips: [
      "Kamu bisa edit atau hapus catatanmu sendiri lewat ikon pensil di Logbook",
      "Anggota lain otomatis dapat notifikasi setiap kamu nabung",
    ],
  },
  {
    number: "05",
    icon: Minus,
    color: "bg-amber",
    title: "Catat pemakaian uang",
    desc: "Kalau uang pot sudah dipakai untuk sesuatu, klik \"Catat pemakaian\" (tombol warna oranye). Masukkan jumlah yang dipakai dan keterangan penggunaan. Saldo pot otomatis berkurang dan tercatat di Logbook.",
    tips: [
      "Tidak bisa menarik lebih dari saldo yang ada — sistem otomatis menolak",
      "Di Logbook, pemakaian ditampilkan dengan warna oranye dan tanda minus",
    ],
  },
  {
    number: "06",
    icon: Bell,
    color: "bg-mint",
    title: "Atur pengingat",
    desc: "Klik \"Pengingat\" di halaman pot untuk mengatur jadwal notifikasi harian. Kamu bisa pilih jam berapa notifikasi dikirim sebagai pengingat untuk nabung. Aktifkan notifikasi browser saat diminta.",
    tips: [
      "Pengingat hanya dikirim ke kamu, bukan ke seluruh anggota",
      "Izin notifikasi perlu diaktifkan di browser — muncul otomatis saat pertama kali setup",
    ],
  },
  {
    number: "07",
    icon: Trophy,
    color: "bg-amber",
    title: "Tandai pot selesai",
    desc: "Kalau target sudah tercapai atau pot sudah selesai digunakan, pemilik pot bisa klik \"Tandai selesai\". Pot akan pindah ke bagian \"Tercapai\" di dashboard dan tidak bercampur dengan pot aktif.",
    tips: [
      "Pot yang ditandai selesai masih bisa dibuka dan dilihat riwayatnya",
      "Pemilik bisa klik \"Aktifkan lagi\" kalau mau melanjutkan pot",
    ],
  },
  {
    number: "08",
    icon: Share2,
    color: "bg-pink-deep",
    title: "Export riwayat",
    desc: "Di halaman pot, buka tab \"Logbook\", lalu klik tombol \"Export\" di kanan atas. Pilih format Excel (.xlsx) atau PDF (.pdf). File akan langsung terdownload ke perangkatmu.",
    tips: [
      "Excel cocok untuk rekap yang perlu diedit atau dihitung ulang",
      "PDF cocok untuk dicetak atau dibagikan ke anggota sebagai laporan",
    ],
  },
];

const faqs = [
  {
    q: "Siapa yang bisa melihat isi pot?",
    a: "Hanya anggota yang bergabung ke pot tersebut. Pot tidak bisa dilihat oleh orang luar tanpa kode undangan.",
  },
  {
    q: "Bisakah ada lebih dari satu pemilik?",
    a: "Belum bisa — saat ini hanya satu pemilik per pot (yang bikin pot). Pemilik punya hak edit, hapus pot, kick anggota, dan tandai selesai.",
  },
  {
    q: "Apa yang terjadi kalau pemilik hapus pot?",
    a: "Seluruh data pot termasuk catatan tabungan semua anggota akan terhapus permanen. Ada konfirmasi sebelum penghapusan dilakukan.",
  },
  {
    q: "Apakah uang sungguhan disimpan di Potlucky?",
    a: "Tidak. Potlucky adalah aplikasi pencatat tabungan — bukan dompet digital atau rekening bank. Uang tetap di tanganmu, aplikasi hanya membantu mencatat dan memantau progress bersama.",
  },
  {
    q: "Berapa banyak pot yang bisa dibuat?",
    a: "Tidak ada batasan jumlah pot. Kamu bisa buat pot sebanyak yang dibutuhkan dan bergabung ke pot milik orang lain sekaligus.",
  },
  {
    q: "Bisakah anggota keluar dari pot?",
    a: "Bisa. Anggota biasa bisa klik \"Keluar dari pot\" di halaman pot. Pemilik tidak bisa keluar — kalau ingin berhenti, pemilik perlu hapus pot atau transfer kepemilikan (fitur mendatang).",
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-5 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-pink-deep mb-8 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Kembali ke dashboard
        </Link>

        {/* Hero */}
        <div className="mb-12">
          <h1 className="font-display text-3xl text-ink mb-3">
            Cara pakai Potlucky
          </h1>
          <p className="text-ink-soft text-base max-w-xl">
            Panduan lengkap dari bikin pot pertama sampai export laporan tabungan. Tidak perlu baca semuanya — cukup cari bagian yang kamu butuhkan.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-6 mb-16">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="bg-glass border border-pink-soft rounded-3xl p-6 flex gap-5"
              >
                {/* Number + icon */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className={`size-11 rounded-2xl ${step.color} flex items-center justify-center`}>
                    <Icon className="size-5 text-white" />
                  </div>
                  <span className="font-display text-xs text-ink-soft/60 font-bold">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-lg text-ink mb-2">
                    {step.title}
                  </h2>
                  <p className="text-sm text-ink-soft leading-relaxed mb-3">
                    {step.desc}
                  </p>
                  {step.tips.length > 0 && (
                    <div className="bg-peach rounded-2xl px-4 py-3 flex flex-col gap-1.5">
                      {step.tips.map((tip, j) => (
                        <p key={j} className="text-xs text-ink-soft flex gap-2">
                          <span className="text-pink-strong font-bold mt-0.5 shrink-0">→</span>
                          {tip}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-display text-2xl text-ink mb-6">
            Pertanyaan umum
          </h2>
          <div className="flex flex-col gap-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-glass border border-pink-soft rounded-2xl px-5 py-4"
              >
                <p className="font-semibold text-ink text-sm mb-1.5">{faq.q}</p>
                <p className="text-sm text-ink-soft leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-pink-soft/40 border border-pink-soft rounded-3xl p-8 text-center">
          <h3 className="font-display text-xl text-ink mb-2">
            Siap mulai nabung?
          </h3>
          <p className="text-sm text-ink-soft mb-5">
            Buat pot pertamamu sekarang dan undang teman untuk nabung bareng.
          </p>
          <Link
            href="/groups/new"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-pink-strong text-white text-sm font-semibold hover:bg-pink-deep transition-colors"
          >
            <Plus className="size-4" />
            Buat pot sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}