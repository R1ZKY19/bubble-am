# Blob Arena

Game kloning Agar.io dengan:
- Login / daftar akun online (email + kata sandi)
- Poin akun yang tersimpan permanen, bertambah tiap match sesuai pertumbuhan sel
- Skin sel dari foto pribadi (PNG/JPG), tersimpan ke akun
- Desain custom (bukan template) — bisa langsung dideploy lewat GitHub Pages

Karena GitHub Pages hanya hosting statis (tidak ada server), akun & database
memakai **Firebase** (gratis untuk skala kecil, cukup 1 akun Google).

---

## 1. Setup Firebase (sekali saja, ±5 menit)

1. Buka [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → beri nama bebas (mis. `blob-arena`) → lanjutkan sampai selesai.
2. Di sidebar kiri, buka **Build → Authentication** → tab **Sign-in method** → aktifkan **Email/Password**.
3. Buka **Build → Firestore Database** → **Create database** → pilih mode **production** → pilih region terdekat.
4. Buka **Build → Storage** → **Get started** → lanjutkan dengan pengaturan default.
5. Buka **Project settings** (ikon gerigi di sidebar) → scroll ke **Your apps** → klik ikon **</>** (Web) → beri nama app → **Register app**.
6. Firebase akan menampilkan blok `firebaseConfig` seperti ini:
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
7. Salin nilai-nilai itu ke file **`js/firebase-config.js`** di project ini, gantikan placeholder `GANTI_DENGAN_...`.

### Aturan keamanan (disarankan)

Secara default mode "production" Firestore/Storage menolak semua akses. Buka
**Firestore → Rules** dan **Storage → Rules**, lalu pakai aturan berikut supaya
tiap pemain hanya bisa mengubah datanya sendiri:

**Firestore rules:**
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

**Storage rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /skins/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 2. Coba secara lokal

Buka folder ini dengan live server apa pun (mis. ekstensi "Live Server" di
VS Code, atau `npx serve`). Jangan buka `index.html` langsung lewat `file://`
— modul JavaScript butuh server HTTP.

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
   diizinkan dari sana.

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
- Skin foto dibatasi 2MB, format PNG/JPG, disimpan di Firebase Storage
  path `skins/{uid}.png` — jadi tiap akun cuma punya satu skin aktif.
- Semua teks antarmuka pakai Bahasa Indonesia; ganti langsung di file
  `.html` dan `.js` kalau mau bahasa lain.
