// ============================================================
// BLOB ARENA — auth.js
// Menangani daftar akun, login, dan redirect ke game.html
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const configured = window.FIREBASE_CONFIGURED;
const setupBanner = document.getElementById('setupBanner');
const authCardBody = document.getElementById('authCardBody');

if (!configured) {
  setupBanner.classList.add('show');
  authCardBody.style.opacity = '0.35';
  authCardBody.style.pointerEvents = 'none';
} else {
  const app = initializeApp(window.FIREBASE_CONFIG);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // If already logged in, skip straight to the game.
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = 'game.html';
  });

  // ---------- tab switching ----------
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const formLogin = document.getElementById('formLogin');
  const formRegister = document.getElementById('formRegister');

  function showTab(which){
    const isLogin = which === 'login';
    tabLogin.classList.toggle('active', isLogin);
    tabRegister.classList.toggle('active', !isLogin);
    formLogin.classList.toggle('active', isLogin);
    formRegister.classList.toggle('active', !isLogin);
    clearMsg();
  }
  tabLogin.addEventListener('click', () => showTab('login'));
  tabRegister.addEventListener('click', () => showTab('register'));

  // ---------- message helper ----------
  const msgEl = document.getElementById('authMsg');
  function showMsg(text, type){
    msgEl.textContent = text;
    msgEl.className = `msg show ${type}`;
  }
  function clearMsg(){
    msgEl.className = 'msg';
    msgEl.textContent = '';
  }

  function friendlyError(err){
    const code = err.code || '';
    if (code.includes('email-already-in-use')) return 'Email ini sudah terdaftar. Coba login.';
    if (code.includes('weak-password')) return 'Kata sandi minimal 6 karakter.';
    if (code.includes('invalid-email')) return 'Format email tidak valid.';
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential'))
      return 'Email atau kata sandi salah.';
    return 'Terjadi kesalahan: ' + (err.message || code);
  }

  // ---------- register ----------
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();
    const name = document.getElementById('regName').value.trim() || 'Pemain';
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const btn = document.getElementById('regBtn');
    btn.disabled = true; btn.textContent = 'Membuat akun…';
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, 'players', cred.user.uid), {
        name,
        points: 0,
        bestMass: 0,
        skinData: null,
        createdAt: serverTimestamp()
      });
      showMsg('Akun dibuat! Mengalihkan ke arena…', 'ok');
      setTimeout(() => window.location.href = 'game.html', 600);
    } catch (err) {
      showMsg(friendlyError(err), 'error');
      btn.disabled = false; btn.textContent = 'Daftar & mulai main';
    }
  });

  // ---------- login ----------
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const btn = document.getElementById('loginBtn');
    btn.disabled = true; btn.textContent = 'Masuk…';
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      // make sure a player doc exists (in case it was created before this field existed)
      const ref = doc(db, 'players', cred.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          name: cred.user.displayName || 'Pemain',
          points: 0, bestMass: 0, skinData: null, createdAt: serverTimestamp()
        });
      }
      window.location.href = 'game.html';
    } catch (err) {
      showMsg(friendlyError(err), 'error');
      btn.disabled = false; btn.textContent = 'Masuk';
    }
  });
}
