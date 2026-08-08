# Blob Arena

Game kloning Agar.io dengan:
- Login / daftar akun online (email + kata sandi)
- Poin akun yang tersimpan permanen, bertambah tiap match sesuai pertumbuhan sel
- Skin sel dari foto pribadi (PNG/JPG), tersimpan ke akun
- Desain custom (bukan template) — bisa langsung dideploy lewat GitHub Pages

Karena GitHub Pages hanya hosting statis (tidak ada server), akun & database
memakai **Firebase** (gratis untuk skala kecil, cukup 1 akun Google).

> **Catatan:** project ini sengaja **tidak memakai Firebase Storage**, karena
> sejak akhir 2024 Storage mewajibkan paket berbayar (Blaze) walau cuma
> dipakai sedikit. Foto skin dikompres jadi gambar kecil (160×160) langsung
> di browser, lalu disimpan sebagai teks di Firestore — tetap 100% gratis.

---

## 1. Setup Firebase (sekali saja, ±5 menit)

1. Buka [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → beri nama bebas (mis. `blob-arena`) → lanjutkan sampai selesai.
2. Di sidebar kiri, buka **Build → Authentication** → tab **Sign-in method** → aktifkan **Email/Password**.
3. Buka **Build → Firestore Database** → **Create database** → pilih mode **production** → pilih region terdekat.
4. Buka **Project settings** (ikon gerigi di sidebar) → scroll ke **Your apps** → klik ikon **</>** (Web) → beri nama app → **Register app**.
   (Tidak perlu setup Storage — skin foto disimpan lewat Firestore.)
5. Firebase akan menampilkan blok `firebaseConfig` seperti ini:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "blob-arena-xxxx.firebaseapp.com",
     projectId: "blob-arena-xxxx",
     storageBucket: "blob-arena-xxxx.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
6. Salin nilai-nilai itu ke file **`js/firebase-config.js`** di project ini, gantikan placeholder `GANTI_DENGAN_...`.

### Aturan keamanan (disarankan)

Secara default mode "production" Firestore menolak semua akses. Buka
**Firestore Database → Rules**, lalu pakai aturan berikut supaya tiap
pemain hanya bisa mengubah datanya sendiri:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 2. Coba secara lokal

Buka folder ini dengan live server apa pun (mis. ekstensi "Live Server" di
VS Code, atau `npx serve`).

**Penting:** jangan buka `index.html` atau `game.html` dengan cara
*double-click* dari File Explorer (itu membuka lewat `file://...`).
Browser **memblokir script `type="module"`** kalau dibuka seperti itu —
akibatnya semua tombol di halaman diam, tidak merespons klik, tanpa
pesan error yang kelihatan. Selalu akses lewat `http://` (server lokal)
atau `https://` (GitHub Pages). Halaman sekarang juga akan menampilkan
peringatan otomatis kalau kamu membukanya lewat `file://`.

---

## 3. Deploy ke GitHub Pages

1. Buat repository baru di GitHub, lalu push seluruh isi folder ini:
   ```bash
   git init
   git add .
   git commit -m "Blob Arena"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
2. Di repo GitHub → **Settings → Pages** → bagian **Build and deployment**
   → Source: **Deploy from a branch** → Branch: **main**, folder **/(root)** → **Save**.
3. Tunggu ±1 menit, lalu situs akan aktif di:
   `https://USERNAME.github.io/NAMA-REPO/`
4. Di Firebase Console → **Authentication → Settings → Authorized domains**,
   tambahkan domain GitHub Pages kamu (`USERNAME.github.io`) supaya login
   diizinkan dari sana. Tanpa langkah ini, login akan gagal dengan error
   `auth/unauthorized-domain` walau config sudah benar.

---

## Struktur file

```
index.html        halaman login / daftar akun
game.html         halaman game (butuh login)
css/style.css     semua styling & desain
js/firebase-config.js   isi dengan config Firebase-mu
js/auth.js         logika daftar/login/logout
js/game.js          engine game + poin + upload skin
```

## Catatan

- Poin didapat dari selisih massa sel saat mati dibanding massa awal (26).
- Skin foto: format PNG/JPG, otomatis dikompres jadi 160×160 lalu disimpan
  sebagai teks base64 di field `skinData` pada dokumen Firestore pemain —
  jadi tiap akun cuma punya satu skin aktif, dan tidak butuh Firebase Storage.
- Semua teks antarmuka pakai Bahasa Indonesia; ganti langsung di file
  `.html` dan `.js` kalau mau bahasa lain.

## Troubleshooting cepat

| Gejala | Penyebab paling umum | Solusi |
|---|---|---|
| Tombol login/daftar tidak merespons klik | Halaman dibuka lewat `file://` | Jalankan lewat server lokal / GitHub Pages |
| Muncul banner kuning "Firebase belum dikonfigurasi" | `js/firebase-config.js` masih placeholder | Isi dengan config asli dari Firebase Console |
| Login gagal `auth/unauthorized-domain` | Domain belum di-whitelist | Tambahkan domain di Authentication → Settings → Authorized domains |
| Upload skin gagal / error izin | Firestore rules masih default (tolak semua) | Terapkan rules di bagian "Aturan keamanan" di atas |
