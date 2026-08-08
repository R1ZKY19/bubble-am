// ============================================================
// GANTI nilai-nilai di bawah ini dengan config project Firebase
// milik Anda sendiri. Cara mendapatkannya ada di README.md
// (langkah "Setup Firebase").
//
// Firebase Console -> Project Settings -> General ->
// "Your apps" -> Web app -> firebaseConfig
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyC5N9Mk6Wx50Pyioitxj1Br2VaIJCNM4hY",
  authDomain: "blob-arena-14cc4.firebaseapp.com",
  projectId: "blob-arena-14cc4",
  storageBucket: "blob-arena-14cc4.firebasestorage.app",
  messagingSenderId: "1020274004717",
  appId: "1:1020274004717:web:92deaaa456a7199e4932e4",
  measurementId: "G-XMEW05ZZXS"
};

// Bendera ini otomatis dipakai halaman login untuk menampilkan
// peringatan setup jika Anda belum mengganti config di atas.
window.FIREBASE_CONFIGURED =
  window.FIREBASE_CONFIG.apiKey !== "GANTI_DENGAN_API_KEY_ANDA";
