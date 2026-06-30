# Potlucky — Nabung Bareng

Web app untuk menabung bersama teman, pacar, atau keluarga dalam satu "pot" bersama.  
Dibangun dengan **Next.js 16 + Supabase + Tailwind v4**, siap deploy ke **Vercel** (gratis).

---

## Fitur

- Login dengan Google (OAuth via Supabase)
- Buat & kelola grup tabungan bersama (pool)
- Undang anggota lewat kode unik atau QR code
- Logbook catatan menabung dari hari pertama sampai target
- Target harian / mingguan / bulanan
- Rekomendasi jumlah nabung otomatis sesuai sisa target, tenggat, dan budget
- Target pribadi per anggota dalam satu grup
- Notifikasi realtime saat anggota lain nabung
- Push notification ke HP/browser (Web Push API)
- Pengingat jadwal nabung (cron via Vercel)
- Grafik pertumbuhan tabungan kumulatif
- Kompatibel penuh di Safari & Chrome, iPhone maupun Android
- PWA — bisa "install" ke homescreen HP

---

## Prasyarat

- Node.js 18+
- Akun [Supabase](https://supabase.com) (gratis)
- Akun [Vercel](https://vercel.com) (gratis)

---

## Setup Langkah demi Langkah

### 1. Clone & install

```bash
git clone <repo-kamu>
cd nabung-bareng
npm install
```

### 2. Buat project Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Catat `Project URL` dan `anon key` dari **Settings → API**
3. Catat juga `service_role key` (simpan aman, jangan commit ke Git)

### 3. Jalankan migration database

Di **Supabase Dashboard → SQL Editor**, jalankan kedua file migration secara berurutan:

```
supabase/migrations/0001_init.sql
supabase/migrations/0002_rls_policies.sql
```

Paste isi file tersebut dan klik **Run**.

### 4. Aktifkan Google OAuth di Supabase

1. **Authentication → Providers → Google** → Enable
2. Daftarkan OAuth App di [Google Cloud Console](https://console.cloud.google.com):
   - Buat project baru → **APIs & Services → Credentials → Create OAuth Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://<project>.supabase.co/auth/v1/callback`
3. Copy **Client ID** dan **Client Secret** ke Supabase Google provider

### 5. Generate VAPID keys (push notification)

```bash
npx web-push generate-vapid-keys
```

Simpan outputnya — kamu butuh `Public Key` dan `Private Key`.

### 6. Buat file `.env.local`

```bash
cp .env.local.example .env.local
```

Isi nilainya:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_VAPID_PUBLIC_KEY=<output dari web-push, bagian Public Key>
VAPID_PRIVATE_KEY=<output dari web-push, bagian Private Key>
VAPID_SUBJECT=mailto:kamu@domain.com

CRON_SECRET=<string acak, misal: openssl rand -hex 32>
```

### 7. Jalankan lokal

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

### 2. Import ke Vercel

1. Buka [vercel.com](https://vercel.com) → **New Project** → Import dari GitHub
2. Biarkan framework terdeteksi otomatis (Next.js)
3. Di bagian **Environment Variables**, masukkan semua variabel dari `.env.local`
4. Klik **Deploy**

### 3. Update Authorized redirect URI di Google

Setelah deploy, tambahkan URL Vercel ke Authorized redirect URIs di Google Cloud Console:
```
https://<nama-project>.vercel.app/auth/callback
```

Dan di Supabase: **Authentication → URL Configuration → Redirect URLs**, tambahkan:
```
https://<nama-project>.vercel.app/auth/callback
```

### 4. Aktifkan Vercel Cron (pengingat nabung)

File `vercel.json` sudah menyertakan konfigurasi cron yang menjalankan `/api/cron/reminders` setiap jam.  
Vercel otomatis mengirim header `Authorization: Bearer <CRON_SECRET>` ke endpoint ini — pastikan `CRON_SECRET` sudah diset di Environment Variables Vercel.

> **Catatan:** Vercel Cron tersedia di plan Hobby (gratis), tapi hanya 1 cron job & frekuensi minimum 1x/hari. Untuk pengingat per jam, upgrade ke Pro, atau gunakan layanan eksternal seperti [cron-job.org](https://cron-job.org) (gratis) yang memanggil endpoint cron kamu dengan header yang sama.

---

## Struktur Project

```
src/
├── app/
│   ├── api/
│   │   ├── cron/reminders/    — endpoint cron pengingat nabung
│   │   └── push/send/         — kirim push notification ke anggota lain
│   ├── auth/callback/         — handler OAuth redirect
│   ├── dashboard/             — halaman utama setelah login
│   └── groups/
│       ├── [id]/              — detail grup (logbook, grafik, anggota)
│       ├── join/              — gabung via kode / scan QR
│       └── new/               — buat grup baru
├── components/
│   ├── contributions/         — AddContributionModal, Logbook, SavingsChart
│   ├── groups/                — GroupCard, GroupDetailView, MemberList, dll
│   ├── notifications/         — NotificationBell (realtime)
│   └── ui/                    — Button, Card, Input, SavingsJar
├── lib/
│   ├── supabase/              — client, server, admin
│   ├── push.ts                — helper Web Push
│   └── utils.ts               — format currency, kalkulasi rekomendasi
└── types/
    └── database.ts            — semua tipe TypeScript

supabase/
└── migrations/
    ├── 0001_init.sql          — skema tabel + trigger otomatis
    └── 0002_rls_policies.sql  — Row Level Security per tabel

public/
├── sw.js                      — Service Worker untuk push notification
├── manifest.json              — PWA manifest
└── icons/                     — icon PWA 192px & 512px
```

---

## Cara Kerja Push Notification

1. User klik **Aktifkan notifikasi** di halaman Pengingat → browser minta izin
2. Jika diizinkan, browser mendaftarkan *push subscription* (endpoint unik per device)
3. Subscription disimpan ke tabel `push_subscriptions` di Supabase
4. Saat ada kontribusi baru → client memanggil `/api/push/send` → server menggunakan Web Push API untuk mengirim ke semua device anggota lain
5. Cron job `/api/cron/reminders` berjalan setiap jam, mengecek siapa yang reminder-nya jatuh sekarang dan belum nabung hari ini, lalu mengirim push + notifikasi in-app

---

## Kompatibilitas Browser (Safari & Chrome, iOS & Android)

**Semua fitur utama** — login Google, catat tabungan, lihat logbook, undang anggota lewat kode/QR, grafik histori, rekomendasi nabung — berjalan normal di:
- Safari & Chrome di iPhone/iPad
- Chrome di Android
- Safari & Chrome di desktop (Mac/Windows)

Tidak ada fitur dasar yang bergantung pada API khusus satu browser.

### Khusus push notification: ada batasan dari Apple, bukan dari aplikasi ini

Ini bukan keterbatasan kode, tapi kebijakan Apple sendiri:

| Platform | Buka langsung di browser | Setelah "Add to Home Screen" |
|---|---|---|
| Android (Chrome) | Notifikasi langsung bisa diaktifkan | Sama saja, tidak wajib install |
| iPhone/iPad (Safari **atau** Chrome) | Notifikasi **tidak tersedia** | Notifikasi bisa diaktifkan normal |

Alasannya: di iOS, **semua** browser (termasuk Chrome) memakai mesin Safari (WebKit) di baliknya, dan Apple membatasi akses ke Push API hanya untuk web app yang sudah ditambahkan ke Layar Utama (Home Screen) — baik dibuka lewat Safari maupun Chrome.

**Yang sudah ditangani otomatis di aplikasi ini:**
- Aplikasi mendeteksi apakah user memakai iPhone/iPad dan belum install ke Home Screen → menampilkan banner & instruksi "Tambah ke Layar Utama" alih-alih tombol yang tidak akan berfungsi
- Setelah user meng-install lewat Share → Add to Home Screen, dan membuka dari ikon di Layar Utama, tombol "Aktifkan notifikasi" otomatis muncul normal
- Notifikasi in-app (lonceng di pojok kanan atas) tetap berfungsi penuh di semua platform tanpa syarat apapun — jadi user tetap tahu ada aktivitas baru meski belum mengaktifkan push

---

## Teknologi

| Layer | Stack |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database & Auth | Supabase (Postgres + OAuth) |
| Styling | Tailwind CSS v4 |
| Push Notification | Web Push API + `web-push` |
| QR Code | `qrcode.react` + `jsqr` |
| Charts | Recharts |
| Date Utils | date-fns |
| Deploy | Vercel |
