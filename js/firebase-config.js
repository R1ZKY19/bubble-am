// ============================================================
// GANTI nilai-nilai di bawah ini dengan config project Firebase
// milik Anda sendiri. Cara mendapatkannya ada di README.md
// (langkah "Setup Firebase").
//
// Firebase Console -> Project Settings -> General ->
// "Your apps" -> Web app -> firebaseConfig
// ============================================================
window.FIREBASE_CONFIG = {
  apiKey: "GANTI_DENGAN_API_KEY_ANDA",
  authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_PROJECT_ID.appspot.com",
  messagingSenderId: "GANTI_DENGAN_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};

// Bendera ini otomatis dipakai halaman login untuk menampilkan
// peringatan setup jika Anda belum mengganti config di atas.
window.FIREBASE_CONFIGURED =
  window.FIREBASE_CONFIG.apiKey !== "GANTI_DENGAN_API_KEY_ANDA";
