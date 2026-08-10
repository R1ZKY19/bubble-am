// ============================================================
// BLOB ARENA — game.js
// Engine kanvas + integrasi akun (auth guard, poin, skin foto)
// Kontrol: mouse gerak, SPASI pecah sel (maks 12), W/E beri makan, ESC jeda
// ============================================================

// ============================================================
// 1. IMPORTS & KONFIGURASI
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================
// 2. KONSTANTA & KATALOG
// ============================================================
const SPECIAL_EMAILS = ['rizkykucuk19@gmail.com', 'rizkysmb888@gmail.com'];

const SKIN_CATALOG = [
  { id: 'default', name: 'Standar', price: 0, palette: ['#5eead4', '#f472b6'] },
  { id: 'glow', name: 'Glow', price: 250, palette: ['#facc15', '#fb923c'] },
  { id: 'neon', name: 'Neon', price: 500, palette: ['#38bdf8', '#a78bfa'] },
  { id: 'aurora', name: 'Aurora', price: 800, palette: ['#22c55e', '#14b8a6'] },
  { id: 'prism', name: 'Prism', price: 1200, palette: ['#f472b6', '#8b5cf6'] },
  { id: 'galaxy', name: 'Galaxy', price: 1800, palette: ['#60a5fa', '#ec4899'] },
  { id: 'lava', name: 'Lava', price: 2200, palette: ['#fb923c', '#ef4444'] },
  { id: 'ocean', name: 'Ocean', price: 2600, palette: ['#2dd4bf', '#0ea5e9'] },
  { id: 'shadow', name: 'Shadow', price: 3200, palette: ['#475569', '#94a3b8'] },
  { id: 'ember', name: 'Ember', price: 3800, palette: ['#fb923c', '#f59e0b'] },
  { id: 'frost', name: 'Frost', price: 4400, palette: ['#e0f2fe', '#93c5fd'] },
  { id: 'cosmic', name: 'Cosmic', price: 5200, palette: ['#a78bfa', '#34d399'] }
];

const EFFECT_CATALOG = [
  { id: 'pulse', name: 'Pulse', price: 350, color: '#45e6d1' },
  { id: 'halo', name: 'Halo', price: 700, color: '#f472b6' },
  { id: 'trail', name: 'Trail', price: 1000, color: '#facc15' },
  { id: 'shockwave', name: 'Shockwave', price: 1400, color: '#60a5fa' }
];

const FONT_CATALOG = [
  { id: 'Agar', name: 'Agar', price: 300, family: 'Space Grotesk' },
  { id: 'Retro', name: 'Retro', price: 600, family: 'Georgia' },
  { id: 'Mono', name: 'Mono', price: 900, family: 'JetBrains Mono' },
  { id: 'Neon', name: 'Neon', price: 1200, family: 'Impact' },
  { id: 'Cyber', name: 'Cyber', price: 1600, family: 'Trebuchet MS' },
  { id: 'Pixel', name: 'Pixel', price: 2000, family: 'Courier New' }
];

const FOOD_TYPES = [
  { r: 3.6, mass: 2, color: '#5eead4' },
  { r: 6.2, mass: 6, color: '#facc15' }
];

const BOT_NAMES = ['Cua', 'Sói', 'Bọt', 'Ma', 'Sấm', 'Lửa', 'Trăng', 'Sao', 'Gió', 'Bão'];
const COLORS = ['#5eead4', '#f472b6', '#facc15', '#818cf8', '#fb923c', '#4ade80', '#60a5fa', '#e879f9'];

// Aturan game
const MAX_CELLS = 20;
const AUTO_SPLIT_MASS = 400; // mass threshold to start auto-split timer
const AUTO_SPLIT_DELAY = 50; // seconds a cell must stay large before auto-split
const MIN_SPLIT_MASS = 28;
const RECOMBINE_TIME = 12;
const SPLIT_COOLDOWN = 0.08;
const MIN_EJECT_MASS = 20;
const EJECT_MASS_LOSS = 10;
const EJECT_PELLET_MASS = 8;
const EJECT_COOLDOWN = 0.06;

// ============================================================
// 3. DOM REFERENCES
// ============================================================
// Start overlay
const startOverlay = document.getElementById('startOverlay');
const startTitle = document.getElementById('startTitle');
const startSub = document.getElementById('startSub');
const startSummary = document.getElementById('startSummary');
const startBtn = document.getElementById('startBtn');
const startLevelVal = document.getElementById('startLevelVal');
const startPointsVal = document.getElementById('startPointsVal');
const startMassVal = document.getElementById('startMassVal');
const startNameDisplay = document.getElementById('startNameDisplay');
const startBestMassEl = document.getElementById('startBestMass');
const settingsOverlay = document.getElementById('settingsOverlay');
const applySettingsBtn = document.getElementById('applySettingsBtn');
const backSettingsBtn = document.getElementById('backSettingsBtn');
const skinRow = document.getElementById('skinRow');
const skinPreview = document.getElementById('skinPreview');
const skinFile = document.getElementById('skinFile');

// Game HUD
const massVal = document.getElementById('massVal');
const pointsVal = document.getElementById('pointsVal');
const levelVal = document.getElementById('levelVal');
const expVal = document.getElementById('expVal');
const expFill = document.getElementById('expFill');
const expText = document.getElementById('expText');
const rankVal = document.getElementById('rankVal');
const cellsVal = document.getElementById('cellsVal');
const nameChip = document.getElementById('nameChip');
const avatarChip = document.getElementById('avatarChip');
const avatarCard = document.getElementById('avatarCard');
const playerNameCard = document.getElementById('playerNameCard');

// Chat and leaderboard elements
const leaderboardEl = document.querySelector('.leaderboard');
  const chatBox = document.getElementById('chatBox');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatNick = document.getElementById('chatNick');
const liveWarning = document.getElementById('liveWarning');

// Death overlay
const deathOverlay = document.getElementById('deathOverlay');
const retryBtn = document.getElementById('retryBtn');
const finalMassEl = document.getElementById('finalMass');
const earnedPointsEl = document.getElementById('earnedPoints');
const deathMenuBtn = document.getElementById('deathMenuBtn');

// Pause overlay
const pauseOverlay = document.getElementById('pauseOverlay');
const pauseNameEl = document.getElementById('pauseName');
const pauseLevelEl = document.getElementById('pauseLevel');
const pausePointsEl = document.getElementById('pausePoints');
const pauseMassEl = document.getElementById('pauseMass');
const resumeBtn = document.getElementById('resumeBtn');
const pauseQuitBtn = document.getElementById('pauseQuitBtn');
const pauseSettingsPanel = document.getElementById('pauseSettingsPanel');
const pauseSettingsBtn = document.getElementById('pauseSettingsBtn');

// Buttons & modals
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
const openSkinBtn = document.getElementById('openSkinBtn');
const themeBtn = document.getElementById('themeBtn');
const shopBtn = document.getElementById('shopBtn');
const shopOverlay = document.getElementById('shopOverlay');
const closeShopBtn = document.getElementById('closeShopBtn');
const shopList = document.getElementById('shopList');
const colorPicker = document.getElementById('colorPicker');
const resetPassBtn = document.getElementById('resetPassBtn');
const lbList = document.getElementById('lbList');
const settingsBtn = document.getElementById('settingsBtn');

// Track origin for settings modal so we can restore correct overlay
let settingsOrigin = null; // 'start' | 'pause' | null

// ============================================================
// 4. UTILITY FUNCTIONS
// ============================================================
function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Math.max(0, Number(value || 0)));
}

function calcLevel(points) {
  return Math.max(1, Math.floor(1 + Math.sqrt(Math.max(0, points) / 22)));
}

function calcExp(points) {
  return Math.max(0, points);
}

function getDisplayLevel(points, levelOverride, email = '') {
  const lower = (email || '').toLowerCase();
  if (typeof levelOverride === 'number' && levelOverride > 0) return Math.max(1, levelOverride);
  if (SPECIAL_EMAILS.includes(lower)) return 999;
  return calcLevel(points);
}

function getLevelProgress(points, levelOverride, email = '') {
  const level = getDisplayLevel(points, levelOverride, email);
  if (level >= 999) return { level: 999, current: 999, next: 999, pct: 1 };
  const prev = Math.max(0, (level - 1) * (level - 1) * 22);
  const next = level * level * 22;
  const current = Math.max(0, points - prev);
  return { 
    level, 
    current, 
    next, 
    pct: Math.min(1, current / Math.max(1, next - prev)) 
  };
}

function rand(a, b) { 
  return Math.random() * (b - a) + a; 
}

function dist(a, b) { 
  return Math.hypot(a.x - b.x, a.y - b.y); 
}

function massToRadius(m) { 
  return 6 + Math.sqrt(m) * 3.2; 
}

function clamp(v, lo, hi) { 
  return Math.max(lo, Math.min(hi, v)); 
}

function lighten(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + 45);
  const g = Math.min(255, ((n >> 8) & 0xff) + 45);
  const b = Math.min(255, (n & 0xff) + 45);
  return `rgb(${r},${g},${b})`;
}

// ============================================================
// 5. CHECK FIREBASE CONFIG
// ============================================================
if (!window.FIREBASE_CONFIGURED) {
  startTitle.textContent = 'Firebase belum dikonfigurasi';
  startSub.innerHTML = 'Isi <code>js/firebase-config.js</code> dengan config project Firebase-mu dulu, lalu buka halaman ini lagi. Panduan ada di README.md.';
} else {
  runGame();
}

// ============================================================
// 6. MAIN GAME FUNCTION
// ============================================================
function runGame() {
  // ============================================================
  // 6a. Firebase Initialization
  // ============================================================
  const app = initializeApp(window.FIREBASE_CONFIG);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let currentUser = null;
  let playerDocRef = null;
  let accountPoints = 0;
  let accountExp = 0;
  let playerColor = '#5eead4';
  let activeSkin = 'default';
  let ownedSkins = ['default'];
  let activeEffect = 'pulse';
  let ownedEffects = ['pulse'];
  let activeFont = 'Agar';
  let ownedFonts = ['Agar'];
  let skinImage = null;

  // ============================================================
  // 6b. Settings
  // ============================================================
  const settings = {
    graphics: 'high',
    sound: true,
    music: true,
    showMass: true,
    showGrid: true,
    showNames: true,
    zoom: 1
  };

  let audioCtx = null;
  let nextAmbientPulse = 0;

  // ============================================================
  // 6c. Audio Functions
  // ============================================================
  function ensureAudio() {
    if (!audioCtx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioCtx = new AudioCtor();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playPulse(freq, duration, type = 'sine', gain = 0.025) {
    if (!settings.sound || !settings.music) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function playImpact(kind = 'eat') {
    if (!settings.sound) return;
    if (kind === 'split') {
      playPulse(620, 0.08, 'triangle', 0.015);
    } else if (kind === 'eject') {
      playPulse(460, 0.06, 'square', 0.012);
    } else if (kind === 'thorn') {
      playPulse(280, 0.1, 'sawtooth', 0.018);
    } else {
      playPulse(540, 0.06, 'sine', 0.012);
    }
  }

  // ============================================================
  // 6d. Skin Functions
  // ============================================================
  function getSkinPalette(skinId) {
    const skin = SKIN_CATALOG.find(item => item.id === skinId);
    return skin ? { base: skin.palette[0], accent: skin.palette[1] } : { base: '#5eead4', accent: '#f472b6' };
  }

  function getFontFamily(fontId) {
    const font = FONT_CATALOG.find(item => item.id === fontId);
    return font ? font.family : 'Space Grotesk';
  }

  function applySkinURL(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      skinImage = img;
      // Auto-select custom skin when a custom image is loaded
      activeSkin = 'custom';
      if (!ownedSkins.includes('custom')) ownedSkins.push('custom');
      if (skinPreview) skinPreview.style.backgroundImage = `url(${url})`;
      if (avatarChip) avatarChip.style.backgroundImage = `url(${url})`;
      if (avatarCard) avatarCard.style.backgroundImage = `url(${url})`;
    };
    img.src = url;
  }

  function compressImageToDataURL(file, size = 160, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvasEl = document.createElement('canvas');
        canvasEl.width = size;
        canvasEl.height = size;
        const cctx = canvasEl.getContext('2d');
        const s = Math.min(img.width, img.height);
        const sx = (img.width - s) / 2;
        const sy = (img.height - s) / 2;
        cctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
        resolve(canvasEl.toDataURL('image/jpeg', quality));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error('File gambar tidak valid.'));
      img.src = URL.createObjectURL(file);
    });
  }

  // ============================================================
  // 6e. UI Update Functions
  // ============================================================
  function updateExperienceUI(levelOverride = null) {
    const info = getLevelProgress(accountPoints, levelOverride, currentUser?.email);
    levelVal.textContent = info.level;
    expVal.textContent = formatNumber(accountExp);
    expText.textContent = `EXP ${formatNumber(info.current)} / ${formatNumber(info.next)}`;
    expFill.style.width = `${info.pct * 100}%`;
    startSummary.textContent = `Level ${info.level} • ${formatNumber(accountPoints)} poin`;
  }

  // ============================================================
  // 6f. Auth & Player Load
  // ============================================================
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // No signed-in user — enable guest mode so game is playable locally.
      console.info('No Firebase user detected — entering guest mode.');
      currentUser = null;
      playerDocRef = null;
      // Default guest profile values
      accountPoints = 0;
      playerColor = '#5eead4';
      activeSkin = 'default';
      ownedSkins = ['default'];
      ownedEffects = ['pulse'];
      activeEffect = 'pulse';
      ownedFonts = ['Agar'];
      activeFont = 'Agar';
      accountExp = calcExp(accountPoints);

      // Update visible HUD/start overlay
      nameChip.textContent = 'Tamu';
      playerNameCard.textContent = 'Tamu';
      pointsVal.textContent = formatNumber(accountPoints);
      expVal.textContent = formatNumber(accountExp);
      levelVal.textContent = getDisplayLevel(accountPoints, 1, null);
      updateExperienceUI(1);
      startSummary.textContent = `Level ${getDisplayLevel(accountPoints, 1, null)} • ${accountPoints} poin`;
      populateStartOverlay({ name: 'Tamu', bestMass: 0 });
      startTitle.textContent = 'Siap bertarung, Tamu?';
      startSub.textContent = 'Masuk atau lanjutkan sebagai tamu.';
      skinRow.style.display = 'flex';
      startBtn.style.display = 'block';
      startBtn.disabled = false;
      return;
    }
    
    currentUser = user;
    playerDocRef = doc(db, 'players', user.uid);

    try {
      const snap = await getDoc(playerDocRef);
      const data = snap.exists() ? snap.data() : { 
        name: user.displayName || 'Pemain', 
        points: 0, 
        skinData: null 
      };

      // Update UI
      nameChip.textContent = data.name || 'Pemain';
      playerNameCard.textContent = data.name || 'Pemain';
      
      const isSpecial = SPECIAL_EMAILS.includes((user.email || '').toLowerCase());
      
      if (isSpecial) {
        await setupSpecialUser(data);
      } else {
        setupNormalUser(data);
      }

      // Update UI elements
      accountExp = calcExp(accountPoints);
      pointsVal.textContent = formatNumber(accountPoints);
      expVal.textContent = formatNumber(accountExp);
      levelVal.textContent = getDisplayLevel(accountPoints, data.level, user.email);
      updateExperienceUI(data.level);
      startSummary.textContent = `Level ${getDisplayLevel(accountPoints, data.level, user.email)} • ${accountPoints} poin`;
      
      if (data.skinData) {
        applySkinURL(data.skinData);
      }

      // Populate start overlay stats
      populateStartOverlay(data);

      startTitle.textContent = 'Siap bertarung, ' + (data.name || 'Pemain') + '?';
      startSub.textContent = 'Gerakkan mouse untuk mengarahkan sel, spasi untuk pecah, W/E untuk beri makan.';
      skinRow.style.display = 'flex';
      startBtn.style.display = 'block';
      startBtn.disabled = false;

    } catch (err) {
      console.error('Gagal memuat profil pemain:', err);
      startTitle.textContent = 'Gagal memuat profil';
      if ((err.code || '').includes('permission-denied')) {
        startSub.innerHTML = 'Firestore menolak akses (permission-denied). Terapkan <b>Firestore Rules</b> dari README.md — Firestore Database → Rules di Firebase Console — lalu klik <b>Publish</b> dan muat ulang halaman ini.';
      } else {
        startSub.textContent = 'Error: ' + (err.message || err.code || 'tidak diketahui') + '. Coba muat ulang halaman.';
      }
    }
  });

  async function setupSpecialUser(data) {
    accountPoints = 9999999999;
    playerColor = data.preferredColor || '#5eead4';
    ownedSkins = Array.from(new Set([...(data.ownedSkins || []), ...SKIN_CATALOG.map(s => s.id)]));
    activeSkin = data.activeSkin || 'galaxy';
    ownedEffects = Array.from(new Set([...(data.ownedEffects || []), ...EFFECT_CATALOG.map(e => e.id)]));
    activeEffect = data.activeEffect || 'halo';
    ownedFonts = Array.from(new Set([...(data.ownedFonts || []), ...FONT_CATALOG.map(f => f.id)]));
    activeFont = data.activeFont || 'Neon';
    
    await setDoc(playerDocRef, {
      points: accountPoints,
      level: 999,
      bestMass: Math.max(data.bestMass || 0, 9999999999),
      ownedSkins,
      activeSkin,
      ownedEffects,
      activeEffect,
      ownedFonts,
      activeFont,
      preferredColor: playerColor,
      theme: document.body.dataset.theme || 'dark'
    }, { merge: true });
  }

  function setupNormalUser(data) {
    accountPoints = data.points || 0;
    playerColor = data.preferredColor || '#5eead4';
    activeSkin = data.activeSkin || 'default';
    ownedSkins = Array.isArray(data.ownedSkins) && data.ownedSkins.length ? data.ownedSkins : ['default'];
    ownedEffects = Array.isArray(data.ownedEffects) && data.ownedEffects.length ? data.ownedEffects : ['pulse'];
    activeEffect = data.activeEffect || 'pulse';
    ownedFonts = Array.isArray(data.ownedFonts) && data.ownedFonts.length ? data.ownedFonts : ['Agar'];
    activeFont = data.activeFont || 'Agar';
  }

  function populateStartOverlay(data) {
    if (startLevelVal) startLevelVal.textContent = getDisplayLevel(accountPoints, data.level, currentUser?.email);
    if (startPointsVal) startPointsVal.textContent = formatNumber(accountPoints);
    if (startMassVal) startMassVal.textContent = massVal?.textContent || '0';
    if (startNameDisplay) startNameDisplay.textContent = data.name || 'Pemain';
    if (startBestMassEl) startBestMassEl.textContent = data.bestMass || 0;
  }

  // ============================================================
  // 6g. Event Listeners - Auth & Profile
  // ============================================================
  logoutBtn.addEventListener('click', () => {
    logoutModal.classList.remove('hidden');
  });

  cancelLogoutBtn.addEventListener('click', () => {
    logoutModal.classList.add('hidden');
  });

  confirmLogoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = 'index.html';
    } catch (err) {
      console.error('Gagal logout:', err);
      window.location.href = 'index.html';
    }
  });

  resetPassBtn.addEventListener('click', async () => {
    if (!currentUser?.email) return;
    const ok = confirm('Kirim email reset kata sandi ke ' + currentUser.email + '?');
    if (!ok) return;
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      alert('Email reset kata sandi sudah dikirim.');
    } catch (err) {
      alert('Gagal mengirim reset password: ' + err.message);
    }
  });

  openSkinBtn.addEventListener('click', () => skinFile.click());

  skinFile.addEventListener('change', async () => {
    const file = skinFile.files[0];
    if (!file || !currentUser) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      alert('Hanya file PNG atau JPG yang didukung.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file maksimal 8MB (akan dikompres otomatis).');
      return;
    }
    try {
      const dataURL = await compressImageToDataURL(file);
      await updateDoc(playerDocRef, { skinData: dataURL });
      applySkinURL(dataURL);
    } catch (err) {
      alert('Gagal memproses skin: ' + err.message);
    }
  });

  // ============================================================
  // 6h. Settings & Theme
  // ============================================================
  settingsBtn.addEventListener('click', () => {
    // Open settings from start overlay
    settingsOrigin = 'start';
    if (startOverlay) startOverlay.classList.add('hidden');
    if (settingsOverlay) settingsOverlay.classList.remove('hidden');
    if (leaderboardEl) leaderboardEl.classList.add('hidden');
    if (chatBox) chatBox.style.display = 'none';
  });

  pauseSettingsBtn.addEventListener('click', () => {
    // Always open the unified settings modal from pause
    settingsOrigin = 'pause';
    if (pauseOverlay) pauseOverlay.classList.add('hidden');
    if (settingsOverlay) settingsOverlay.classList.remove('hidden');
    if (leaderboardEl) leaderboardEl.classList.add('hidden');
    if (chatBox) chatBox.style.display = 'none';
  });

  themeBtn.addEventListener('click', async () => {
    const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = next;
    themeBtn.textContent = next === 'light' ? '🌙 Tema' : '☀️ Tema';
    try { localStorage.setItem('ba_theme', next); } catch (e) {}
    if (playerDocRef) {
      await updateDoc(playerDocRef, { theme: next }).catch(() => {});
    }
  });

  colorPicker.addEventListener('input', async () => {
    playerColor = colorPicker.value;
    if (playerDocRef) {
      await updateDoc(playerDocRef, { preferredColor: playerColor });
    }
  });

  // ============================================================
  // 6i. Shop
  // ============================================================
  shopBtn.addEventListener('click', () => {
    renderShop();
    shopOverlay.classList.remove('hidden');
  });

  closeShopBtn.addEventListener('click', () => {
    shopOverlay.classList.add('hidden');
  });

  function renderShop() {
    const renderCard = (item, owned, active, type) => {
      let preview;
      let content = '';
      if (type === 'skin') {
        preview = `background: linear-gradient(135deg, ${item.palette[0]}, ${item.palette[1]});`;
      } else if (type === 'effect') {
        preview = `background: radial-gradient(circle at 40% 40%, ${item.color} 0%, rgba(255,255,255,0.05) 45%, transparent 70%);`;
      } else {
        preview = `background: linear-gradient(135deg, #0f172a, #1e293b);`;
        content = `<span class="font-sample" style="font-family:'${item.family}', sans-serif;">Aa</span>`;
      }
      const actionLabel = owned ? (active ? 'Aktif' : 'Gunakan') : 'Beli';
      const disabled = owned && active ? 'disabled' : '';
      return `<div class="skin-card ${active ? 'active' : ''}">
        <div class="skin-preview" style="${preview}">${content}</div>
        <div class="meta"><b>${item.name}</b><span>${item.price} pts</span></div>
        <button class="primary-btn" data-${type}="${item.id}" ${disabled}>
          ${actionLabel}
        </button>
      </div>`;
    };

    shopList.innerHTML = `
      <div class="shop-section">
        <div class="shop-section-title">Skin</div>
        <div class="shop-grid">${SKIN_CATALOG.map(item => renderCard(item, ownedSkins.includes(item.id), activeSkin === item.id, 'skin')).join('')}</div>
      </div>
      <div class="shop-section">
        <div class="shop-section-title">Efek</div>
        <div class="shop-grid">${EFFECT_CATALOG.map(item => renderCard(item, ownedEffects.includes(item.id), activeEffect === item.id, 'effect')).join('')}</div>
      </div>
      <div class="shop-section">
        <div class="shop-section-title">Font</div>
        <div class="shop-grid">${FONT_CATALOG.map(item => renderCard(item, ownedFonts.includes(item.id), activeFont === item.id, 'font')).join('')}</div>
      </div>
    `;

    // Skin buy handler
    shopList.querySelectorAll('button[data-skin]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const skinId = btn.getAttribute('data-skin');
        const item = SKIN_CATALOG.find(x => x.id === skinId);
        if (!item) return;
        
        if (ownedSkins.includes(skinId)) {
          activeSkin = skinId;
          if (playerDocRef) await updateDoc(playerDocRef, { activeSkin: skinId });
          shopOverlay.classList.add('hidden');
          return;
        }
        
        if (accountPoints < item.price) {
          alert('Poinmu belum cukup.');
          return;
        }
        
        accountPoints -= item.price;
        ownedSkins = Array.from(new Set([...ownedSkins, skinId]));
        activeSkin = skinId;
        pointsVal.textContent = formatNumber(accountPoints);
        if (playerDocRef) {
          await updateDoc(playerDocRef, { points: accountPoints, ownedSkins, activeSkin });
        }
        renderShop();
      });
    });

    // Effect buy handler
    shopList.querySelectorAll('button[data-effect]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const effectId = btn.getAttribute('data-effect');
        const item = EFFECT_CATALOG.find(x => x.id === effectId);
        if (!item) return;
        
        if (ownedEffects.includes(effectId)) {
          activeEffect = effectId;
          if (playerDocRef) await updateDoc(playerDocRef, { activeEffect: effectId });
          shopOverlay.classList.add('hidden');
          return;
        }
        
        if (accountPoints < item.price) {
          alert('Poinmu belum cukup.');
          return;
        }
        
        accountPoints -= item.price;
        ownedEffects = Array.from(new Set([...ownedEffects, effectId]));
        activeEffect = effectId;
        pointsVal.textContent = formatNumber(accountPoints);
        if (playerDocRef) {
          await updateDoc(playerDocRef, { points: accountPoints, ownedEffects, activeEffect });
        }
        renderShop();
      });
    });

    // Font buy handler
    shopList.querySelectorAll('button[data-font]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fontId = btn.getAttribute('data-font');
        const item = FONT_CATALOG.find(x => x.id === fontId);
        if (!item) return;
        
        if (ownedFonts.includes(fontId)) {
          activeFont = fontId;
          if (playerDocRef) await updateDoc(playerDocRef, { activeFont: fontId });
          shopOverlay.classList.add('hidden');
          return;
        }
        
        if (accountPoints < item.price) {
          alert('Poinmu belum cukup.');
          return;
        }
        
        accountPoints -= item.price;
        ownedFonts = Array.from(new Set([...ownedFonts, fontId]));
        activeFont = fontId;
        pointsVal.textContent = formatNumber(accountPoints);
        if (playerDocRef) {
          await updateDoc(playerDocRef, { points: accountPoints, ownedFonts, activeFont });
        }
        renderShop();
      });
    });
  }

  // ============================================================
  // 6j. Canvas & World Setup
  // ============================================================
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let W, H;
  
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const WORLD = { w: 3000, h: 3000 };
  let FOOD_COUNT = 260;
  let BOT_COUNT = 10;
  let THORN_COUNT = 34;
  let VIRUS_COUNT = 18;

  // ============================================================
  // 6k. Game State
  // ============================================================
  let food = [];
  let thorns = [];
  let viruses = [];
  let cells = [];
  let particles = [];
  let splitEffects = [];
  let camera = { x: WORLD.w / 2, y: WORLD.h / 2, zoom: 1 };
  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let zoomWheel = 0;
  let targetZoom = 1;
  let running = false;
  let paused = false;
  let player = null;
  let rafId = null;
  let lastT = 0;
  let sessionStartMass = 26;
  let lastKnownMass = 26;
  let gameTime = 0;
  let lastSplitTime = -10;
  let lastEjectTime = -10;
  let lbTimer = 0;

  // ============================================================
  // 6l. World Generation Functions
  // ============================================================
  function getGraphicsPreset() {
    switch (settings.graphics) {
      case 'medium': return { food: 180, bots: 8, spikes: 24, particles: 0.8 };
      case 'low': return { food: 120, bots: 5, spikes: 16, particles: 0.5 };
      default: return { food: 260, bots: 10, spikes: 34, particles: 1 };
    }
  }

  function applyGraphicsPreset() {
    const preset = getGraphicsPreset();
    FOOD_COUNT = preset.food;
    BOT_COUNT = preset.bots;
    THORN_COUNT = preset.spikes;
    if (food.length > FOOD_COUNT) food.length = FOOD_COUNT;
    if (thorns.length > THORN_COUNT) thorns.length = THORN_COUNT;
  }

  function spawnFood(n) {
    for (let i = 0; i < n; i++) {
      const type = FOOD_TYPES[Math.random() < 0.8 ? 0 : 1];
      food.push({
        x: rand(20, WORLD.w - 20),
        y: rand(20, WORLD.h - 20),
        r: type.r,
        mass: type.mass,
        color: type.color
      });
    }
  }

  function spawnThorns(n) {
    for (let i = 0; i < n; i++) {
      thorns.push({
        x: rand(80, WORLD.w - 80),
        y: rand(80, WORLD.h - 80),
        r: rand(8, 13),
        mass: 6,
        color: '#fb923c',
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.8, 0.8),
        alive: true
      });
    }
  }

  function spawnViruses(n) {
    for (let i = 0; i < n; i++) {
      viruses.push({
        x: rand(90, WORLD.w - 90),
        y: rand(90, WORLD.h - 90),
        r: rand(18, 24),
        mass: 0,
        color: '#22c55e',
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.7, 0.7),
        alive: true
      });
    }
  }

  function makeCell(name, isPlayer, x, y, mass, color, ownerId) {
    const id = Math.random().toString(36).slice(2);
    const m = mass ?? rand(18, 30);
    return {
      id,
      name,
      isPlayer,
      ownerId: ownerId || (isPlayer ? 'player' : id),
      x: x ?? rand(200, WORLD.w - 200),
      y: y ?? rand(200, WORLD.h - 200),
      mass: m,
      color: color ?? COLORS[Math.floor(rand(0, COLORS.length))],
      vx: 0,
      vy: 0,
      impulseX: 0,
      impulseY: 0,
      targetX: 0,
      targetY: 0,
      wanderT: rand(0, 10),
      alive: true,
      splitAt: 0,
      r: massToRadius(m)
    };
  }

  function resetWorld() {
    food = [];
    thorns = [];
    viruses = [];
    cells = [];
    particles = [];
    splitEffects = [];
    
    applyGraphicsPreset();
    spawnFood(FOOD_COUNT);
    spawnThorns(THORN_COUNT);
    spawnViruses(VIRUS_COUNT);
    
    // Cap the effective level used to compute start mass so new games don't start enormous
    const effectiveLevel = Math.min(calcLevel(accountPoints), 50);
    const startMass = Math.max(26, 24 + effectiveLevel * 2);
    player = makeCell(
      nameChip.textContent,
      true,
      WORLD.w / 2,
      WORLD.h / 2,
      startMass,
      playerColor,
      'player'
    );
    
    sessionStartMass = startMass;
    lastKnownMass = startMass;
    gameTime = 0;
    cells.push(player);
    
    for (let i = 0; i < BOT_COUNT; i++) {
      cells.push(makeCell(
        BOT_NAMES[i % BOT_NAMES.length] + (i >= BOT_NAMES.length ? i : ''),
        false,
        null,
        null,
        rand(16, 60)
      ));
    }
  }

  // ============================================================
  // 6m. Game Input
  // ============================================================
  function getWorldMouse() {
    return {
      x: camera.x + (mouse.x - W / 2) / camera.zoom,
      y: camera.y + (mouse.y - H / 2) / camera.zoom
    };
  }

  canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  canvas.addEventListener('touchmove', e => {
    const t = e.touches[0];
    if (t) {
      mouse.x = t.clientX;
      mouse.y = t.clientY;
    }
  }, { passive: true });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    // Smooth zoom target — don't set camera.zoom directly here
    zoomWheel = clamp(zoomWheel + (e.deltaY > 0 ? -0.1 : 0.1), -0.6, 0.6);
    targetZoom = clamp(1 + zoomWheel, 0.6, 1.45);
  }, { passive: false });

  function playerCellCount() {
    let n = 0;
    for (const c of cells) {
      if (c.alive && c.ownerId === 'player') n++;
    }
    return n;
  }

  function getSplitCooldown() {
    const mass = lastKnownMass;
    const base = SPLIT_COOLDOWN;
    const massFactor = clamp(1 - (mass - 120) / 700, 0.25, 1);
    const cellFactor = clamp(1 - (playerCellCount() - 1) * 0.1, 0.35, 1);
    return base * massFactor * cellFactor;
  }

  window.addEventListener('keydown', e => {
    if (e.code === 'Escape') {
      e.preventDefault();
      togglePause();
      return;
    }
    if (!running || paused) return;
    
    if (e.code === 'Space') {
      e.preventDefault();
      if (e.repeat) return;
      const cooldown = getSplitCooldown();
      if (gameTime - lastSplitTime < cooldown) return;
      lastSplitTime = gameTime;
      doSplit();
    } else if (e.code === 'KeyW') {
      if (gameTime - lastEjectTime < EJECT_COOLDOWN) return;
      lastEjectTime = gameTime;
      doEject();
    } else if (e.code === 'KeyE') {
      if (gameTime - lastEjectTime < EJECT_COOLDOWN) return;
      lastEjectTime = gameTime;
      doEjectAll();
    }
  });

  // ============================================================
  // 6n. Player Actions (Split, Eject)
  // ============================================================
  function addSplitEffect(x, y, color) {
    splitEffects.push({ x, y, r: 8, life: 0.35, color });
    for (let k = 0; k < 10; k++) {
      particles.push({
        x, y,
        r: rand(2, 5),
        life: 0.35,
        color: 'rgba(255,255,255,0.9)'
      });
    }
    playImpact('split');
  }

  function splitCell(c, dirX, dirY) {
    const newMass = c.mass / 2;
    c.mass = newMass;
    c.splitAt = gameTime;
    
    const child = makeCell(
      c.name,
      true,
      c.x + dirX * 4,
      c.y + dirY * 4,
      newMass,
      playerColor,
      'player'
    );
    child.splitAt = gameTime;
    
    const impulse = 720;
    c.impulseX = -dirX * impulse * 0.3;
    c.impulseY = -dirY * impulse * 0.3;
    child.impulseX = dirX * impulse;
    child.impulseY = dirY * impulse;
    
    cells.push(child);
    addSplitEffect(c.x, c.y, c.color);
  }

  function doSplit() {
    if (playerCellCount() >= MAX_CELLS) return;
    
    const wm = getWorldMouse();
    let target = cells
      .filter(c => c.alive && c.ownerId === 'player')
      .sort((a, b) => b.mass - a.mass)
      .find(c => c.mass >= MIN_SPLIT_MASS);
    
    if (!target) return;
    
    const dx = wm.x - target.x;
    const dy = wm.y - target.y;
    const len = Math.hypot(dx, dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;
    
    splitCell(target, dirX, dirY);
    
    // Extra splits if mass is large enough
    if (playerCellCount() < MAX_CELLS && target.mass > MIN_SPLIT_MASS * 2.2) {
      let extraSplits = Math.min(MAX_CELLS - playerCellCount(), Math.floor(target.mass / 90));
      while (extraSplits > 0 && playerCellCount() < MAX_CELLS) {
        target = cells
          .filter(c => c.alive && c.ownerId === 'player')
          .sort((a, b) => b.mass - a.mass)[0];
        if (!target || target.mass < MIN_SPLIT_MASS * 1.8) break;
        const dx2 = wm.x - target.x;
        const dy2 = wm.y - target.y;
        const len2 = Math.hypot(dx2, dy2) || 1;
        splitCell(target, dx2 / len2, dy2 / len2);
        extraSplits--;
      }
    }
  }

  function ejectFromCell(c, dirX, dirY) {
    if (c.mass < MIN_EJECT_MASS) return;
    c.mass -= EJECT_MASS_LOSS;
    playImpact('eject');
    
    const r = massToRadius(c.mass);
    const startDist = r + 10;
    const speed = 920;
    
    food.push({
      x: c.x + dirX * startDist,
      y: c.y + dirY * startDist,
      r: 7.5,
      color: c.color,
      vx: dirX * speed,
      vy: dirY * speed,
      mass: EJECT_PELLET_MASS
    });
    
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: c.x + dirX * r,
        y: c.y + dirY * r,
        r: rand(2.2, 4.6),
        life: 0.24,
        color: c.color
      });
    }
  }

  function doEject() {
    const wm = getWorldMouse();
    const target = cells
      .filter(c => c.alive && c.ownerId === 'player')
      .sort((a, b) => b.mass - a.mass)
      .find(c => c.mass >= MIN_EJECT_MASS);
    
    if (!target) return;
    
    const dx = wm.x - target.x;
    const dy = wm.y - target.y;
    const len = Math.hypot(dx, dy) || 1;
    ejectFromCell(target, dx / len, dy / len);
  }

  function doEjectAll() {
    const wm = getWorldMouse();
    const owned = cells.filter(c => c.alive && c.ownerId === 'player' && c.mass >= MIN_EJECT_MASS);
    if (!owned.length) return;
    
    for (const c of owned) {
      const dx = wm.x - c.x;
      const dy = wm.y - c.y;
      const len = Math.hypot(dx, dy) || 1;
      ejectFromCell(c, dx / len, dy / len);
    }
  }

  // ============================================================
  // 6o. Pause
  // ============================================================
  function togglePause() {
    if (!running) return;
    paused = !paused;
    
    if (paused) {
      pauseNameEl.textContent = nameChip.textContent;
      pauseLevelEl.textContent = calcLevel(accountPoints);
      pausePointsEl.textContent = accountPoints;
      pauseMassEl.textContent = Math.round(lastKnownMass);
      pauseOverlay.classList.remove('hidden');
      cancelAnimationFrame(rafId);
      // liveWarning suppressed (hidden)
    } else {
      pauseOverlay.classList.add('hidden');
      lastT = performance.now();
      rafId = requestAnimationFrame(loop);
      // liveWarning suppressed (hidden)
    }
  }

  resumeBtn.addEventListener('click', togglePause);
  pauseQuitBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // ============================================================
  // 6p. Game Loop Functions
  // ============================================================
  function handlePlayerSelfCollisions() {
    const pc = cells.filter(c => c.alive && c.ownerId === 'player');
    for (let i = 0; i < pc.length; i++) {
      const a = pc[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < pc.length; j++) {
        const b = pc[j];
        if (!b.alive) continue;
        const ra = massToRadius(a.mass);
        const rb = massToRadius(b.mass);
        const d = dist(a, b) || 0.001;
        const canMerge = (gameTime - a.splitAt > RECOMBINE_TIME) && (gameTime - b.splitAt > RECOMBINE_TIME);
        
        if (canMerge && d < Math.max(ra, rb) * 0.7) {
          a.mass += b.mass;
          b.alive = false;
        } else {
          const minD = (ra + rb) * 0.92;
          if (d < minD) {
            const overlap = (minD - d) / 2;
            const nx = (a.x - b.x) / d;
            const ny = (a.y - b.y) / d;
            a.x += nx * overlap;
            a.y += ny * overlap;
            b.x -= nx * overlap;
            b.y -= ny * overlap;
          }
        }
      }
    }
  }

  function update(dt) {
    if (!running) return;
    gameTime += dt;
    const wm = getWorldMouse();

    // Ambient music
    if (settings.music && gameTime > nextAmbientPulse) {
      playPulse(180, 0.18, 'triangle', 0.008);
      nextAmbientPulse = gameTime + 2.4;
    }

    // Move cells
    for (const c of cells) {
      if (!c.alive) continue;
      
      let dx, dy;
      if (c.ownerId === 'player') {
        dx = wm.x - c.x;
        dy = wm.y - c.y;
      } else {
        // Bot AI
        c.wanderT -= dt;
        let threat = null, prey = null;
        let threatD = Infinity, preyD = Infinity;
        
        for (const o of cells) {
          if (o === c || !o.alive) continue;
          const d = dist(c, o);
          if (d < 400) {
            if (o.mass > c.mass * 1.15 && d < threatD) {
              threat = o;
              threatD = d;
            } else if (c.mass > o.mass * 1.15 && d < preyD) {
              prey = o;
              preyD = d;
            }
          }
        }
        
        if (threat) {
          dx = c.x - threat.x;
          dy = c.y - threat.y;
        } else if (prey) {
          dx = prey.x - c.x;
          dy = prey.y - c.y;
        } else {
          if (c.wanderT <= 0) {
            c.targetX = rand(-1, 1);
            c.targetY = rand(-1, 1);
            c.wanderT = rand(2, 5);
          }
          dx = c.targetX;
          dy = c.targetY;
        }
      }
      
      const len = Math.hypot(dx, dy) || 1;
      const speed = clamp(270 / Math.sqrt(c.mass), 70, 270);
      c.vx = (dx / len) * speed;
      c.vy = (dy / len) * speed;
      
      c.impulseX = (c.impulseX || 0) * Math.exp(-dt * 6);
      c.impulseY = (c.impulseY || 0) * Math.exp(-dt * 6);
      
      const r = massToRadius(c.mass);
      c.x = clamp(c.x + (c.vx + c.impulseX) * dt, r, WORLD.w - r);
      c.y = clamp(c.y + (c.vy + c.impulseY) * dt, r, WORLD.h - r);
      c.r = c.r === undefined ? r : c.r + (r - c.r) * clamp(dt * 10, 0, 1);
    }

    // Move ejected food
      for (let fi = food.length - 1; fi >= 0; fi--) {
        const f = food[fi];
      if (f.vx || f.vy) {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        const decay = Math.exp(-dt * 3.2);
        f.vx *= decay;
        f.vy *= decay;
        f.x = clamp(f.x, f.r, WORLD.w - f.r);
        f.y = clamp(f.y, f.r, WORLD.h - f.r);
        if (Math.abs(f.vx) < 3 && Math.abs(f.vy) < 3) {
          f.vx = 0;
          f.vy = 0;
        }
          // Check pellet collision with viruses: if pellet hits virus, split virus into two launched viruses
          for (let vi = viruses.length - 1; vi >= 0; vi--) {
            const v = viruses[vi];
            if (!v.alive) continue;
            const d = Math.hypot(f.x - v.x, f.y - v.y);
            if (d < (v.r + (f.r || 6))) {
              // consume pellet
              food.splice(fi, 1);
              // destroy original virus
              v.alive = false;
              playImpact('thorn');
              // create two new viruses launched in directions based on pellet velocity
              const speed = Math.hypot(f.vx || 0, f.vy || 0) || 280;
              const baseAngle = Math.atan2(f.vy || 0, f.vx || 0) || 0;
              for (let k = -1; k <= 1; k += 2) {
                const angle = baseAngle + k * 0.35 + rand(-0.12, 0.12);
                viruses.push({
                  x: v.x + Math.cos(angle) * (v.r + 8),
                  y: v.y + Math.sin(angle) * (v.r + 8),
                  r: rand(12, 18),
                  mass: 0,
                  color: '#22c55e',
                  rot: rand(0, Math.PI * 2),
                  spin: rand(-0.8, 0.8),
                  alive: true,
                  vx: Math.cos(angle) * speed * 0.9,
                  vy: Math.sin(angle) * speed * 0.9
                });
              }
              break;
            }
          }
        }
    }

    // Cell eats food
    for (const c of cells) {
      if (!c.alive) continue;
      const r = massToRadius(c.mass);
      
      for (let i = food.length - 1; i >= 0; i--) {
        const f = food[i];
        if (Math.hypot(c.x - f.x, c.y - f.y) < r) {
          c.mass += (f.mass !== undefined ? f.mass : f.r * 0.9);
          food.splice(i, 1);
          playImpact('eat');
        }
      }
      
      // Cell eats thorns
      for (let i = thorns.length - 1; i >= 0; i--) {
        const t = thorns[i];
        if (!t.alive) continue;
        if (Math.hypot(c.x - t.x, c.y - t.y) < r + t.r) {
          c.mass += 2.2;
          burstThorn(t.x, t.y, t.color);
          t.alive = false;
        }
      }
      
      // Cell hits virus
      for (let i = viruses.length - 1; i >= 0; i--) {
        const v = viruses[i];
        if (!v.alive) continue;
        const d = Math.hypot(c.x - v.x, c.y - v.y);
        if (d < r + v.r - 2) {
          if (c.mass > 140 && playerCellCount() < MAX_CELLS) {
            const splits = Math.min(MAX_CELLS - playerCellCount() + 1, 2);
            for (let s = 0; s < splits; s++) {
              const angle = rand(0, Math.PI * 2);
              const child = makeCell(
                c.name,
                true,
                c.x + Math.cos(angle) * 12,
                c.y + Math.sin(angle) * 12,
                c.mass / (splits + 1),
                playerColor,
                'player'
              );
              child.impulseX = Math.cos(angle) * 520;
              child.impulseY = Math.sin(angle) * 520;
              child.splitAt = gameTime;
              cells.push(child);
            }
            c.mass *= 0.7;
          }
          burstVirus(v.x, v.y);
          v.alive = false;
        }
      }
    }

    // Cleanup dead objects and respawn
    thorns = thorns.filter(t => t.alive);
    viruses = viruses.filter(v => v.alive);
    while (food.length < FOOD_COUNT) spawnFood(1);
    while (thorns.length < THORN_COUNT) spawnThorns(1);
    while (viruses.length < VIRUS_COUNT) spawnViruses(1);

    // Cell vs Cell combat
    for (let i = 0; i < cells.length; i++) {
      const a = cells[i];
      if (!a.alive) continue;
      for (let j = 0; j < cells.length; j++) {
        if (i === j) continue;
        const b = cells[j];
        if (!b.alive) continue;
        if (a.ownerId === b.ownerId) continue;
        if (a.mass > b.mass * 1.15) {
          const ra = massToRadius(a.mass);
          if (dist(a, b) < ra * 0.85) {
            a.mass += b.mass * 0.8;
            b.alive = false;
            if (!b.isPlayer) {
              setTimeout(() => {
                if (!running) return;
                const idx = cells.indexOf(b);
                const nb = makeCell(b.name, false, null, null, rand(16, 40));
                if (idx >= 0) cells[idx] = nb;
                else cells.push(nb);
              }, rand(1500, 3500));
            }
          }
        }
      }
    }

    handlePlayerSelfCollisions();
    cells = cells.filter(c => c.alive);

    // Update camera and HUD
    const alivePlayerCells = cells.filter(c => c.alive && c.ownerId === 'player');
    if (alivePlayerCells.length) {
      // Auto-split logic: if largest player cell stays above threshold for long, auto-split toward big target
      const largest = alivePlayerCells.reduce((a,b) => a.mass > b.mass ? a : b);
      if (largest.mass > AUTO_SPLIT_MASS) {
        if (!largest.largeSince) largest.largeSince = gameTime;
        else if (gameTime - largest.largeSince > AUTO_SPLIT_DELAY && playerCellCount() < MAX_CELLS) {
          // find biggest non-player cell as target
          const target = cells.filter(c => c.alive && c.ownerId !== 'player').sort((a,b) => b.mass - a.mass)[0];
          let dx = rand(-1,1), dy = 0;
          if (target) { dx = target.x - largest.x; dy = target.y - largest.y; }
          const len = Math.hypot(dx, dy) || 1;
          splitCell(largest, dx / len, dy / len);
          largest.largeSince = null;
        }
      } else {
        largest.largeSince = null;
      }
      let totalMass = 0, cx = 0, cy = 0;
      for (const c of alivePlayerCells) {
        totalMass += c.mass;
        cx += c.x * c.mass;
        cy += c.y * c.mass;
      }
      cx /= totalMass;
      cy /= totalMass;
      
      camera.x += (cx - camera.x) * 0.18;
      camera.y += (cy - camera.y) * 0.18;
      const tz = clamp(1.15 - (totalMass - 26) / 550, 0.28, 1.15);
      camera.zoom += (tz - camera.zoom) * 0.08;
      lastKnownMass = totalMass;

      // Update HUD
      const roundedMass = Math.round(totalMass);
      if (massVal.textContent !== String(roundedMass)) massVal.textContent = roundedMass;
      const cellLabel = alivePlayerCells.length + '/' + MAX_CELLS;
      if (cellsVal.textContent !== cellLabel) cellsVal.textContent = cellLabel;
      const info = getLevelProgress(accountPoints + roundedMass);
      levelVal.textContent = info.level;
      expVal.textContent = accountPoints + roundedMass;
      rankVal.textContent = `#${Math.max(1, Math.floor((roundedMass + accountPoints) / 80))}`;
      updateExperienceUI();
    } else if (running) {
      onPlayerDeath();
    }

    // Update particles and effects
    particles.forEach(p => p.life -= dt);
    particles = particles.filter(p => p.life > 0);
    splitEffects.forEach(s => {
      s.life -= dt;
      s.r += dt * 120;
    });
    splitEffects = splitEffects.filter(s => s.life > 0);
    
    // Animate thorns and viruses
    for (const t of thorns) {
      t.rot += (t.spin || 0) * dt;
      t.x += Math.sin(gameTime + t.x * 0.003) * 0.16;
      t.y += Math.cos(gameTime + t.y * 0.003) * 0.16;
    }
    for (const v of viruses) {
      v.rot += (v.spin || 0) * dt;
      if (v.vx || v.vy) {
        // moving virus (launched) — apply velocity and decay
        v.x += (v.vx || 0) * dt;
        v.y += (v.vy || 0) * dt;
        // decay velocities gradually
        v.vx *= Math.exp(-dt * 1.5);
        v.vy *= Math.exp(-dt * 1.5);
      } else {
        // idle wobble
        v.x += Math.sin(gameTime + v.x * 0.002) * 0.1;
        v.y += Math.cos(gameTime + v.y * 0.002) * 0.1;
      }
    }
  }

  // ============================================================
  // 6q. Death & Visual Effects
  // ============================================================
  function burstThorn(x, y, color) {
    for (let i = 0; i < 16; i++) {
      particles.push({
        x, y,
        r: rand(2, 4.6),
        life: 0.38,
        color: i % 2 === 0 ? color : '#fde68a'
      });
    }
    splitEffects.push({ x, y, r: 10, life: 0.4, color: '#fbbf24' });
    playImpact('thorn');
  }

  function burstVirus(x, y) {
    for (let i = 0; i < 18; i++) {
      particles.push({
        x, y,
        r: rand(2.8, 5.2),
        life: 0.42,
        color: i % 2 ? '#22c55e' : '#86efac'
      });
    }
    splitEffects.push({ x, y, r: 14, life: 0.42, color: '#22c55e' });
    playImpact('thorn');
  }

  async function onPlayerDeath() {
    running = false;
    paused = false;
    cancelAnimationFrame(rafId);
    pauseOverlay.classList.add('hidden');
    
    const earned = Math.max(0, Math.round(lastKnownMass - sessionStartMass));
    const expGain = Math.max(2, earned + Math.round(lastKnownMass / 8));
    finalMassEl.textContent = Math.round(lastKnownMass);
    earnedPointsEl.textContent = '+' + earned;
    deathOverlay.classList.remove('hidden');

    if (playerDocRef) {
      try {
        await updateDoc(playerDocRef, {
          points: increment(earned),
          bestMass: Math.max(Math.round(lastKnownMass), 0),
          preferredColor: playerColor,
          theme: document.body.dataset.theme || 'dark'
        });
        accountPoints += earned;
        accountExp = calcExp(accountPoints);
        pointsVal.textContent = accountPoints;
        expVal.textContent = accountExp;
        updateExperienceUI();
      } catch (err) {
        console.warn('Gagal menyimpan poin:', err.message);
      }
    }
  }

  // ============================================================
  // 6r. Drawing Functions
  // ============================================================
  function drawVirus(v) {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.rot || 0);
    
    const spikes = 14;
    ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2;
      const outer = v.r + 5;
      const inner = v.r - 6;
      const radius = i % 2 === 0 ? outer : inner;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(34,197,94,0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(166,255,194,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, v.r * 0.68, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(166,255,194,0.22)';
    ctx.fill();
    ctx.restore();
  }

  function drawThorn(t) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rot || 0);
    ctx.beginPath();
    ctx.arc(0, 0, t.r, 0, Math.PI * 2);
    ctx.fillStyle = '#fb923c';
    ctx.fill();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, t.r * 0.54, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.restore();
  }

  function drawCell(c) {
    const r = c.r || massToRadius(c.mass);
    const justSplit = (gameTime - (c.splitAt || -999)) < 0.6;
    
    ctx.save();
    if (justSplit) {
      ctx.shadowBlur = 22;
      ctx.shadowColor = 'rgba(94,234,212,0.6)';
    }
    
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.closePath();
    
    // Support per-cell custom skin images (c.skinImage / c.skinSrc) and player custom skin
    let imgToUse = null;
    if (c.skinImage) imgToUse = c.skinImage;
    else if (c.skinSrc && !c.skinImage) {
      // lazy-load cell skin
      const tmp = new Image(); tmp.crossOrigin = 'anonymous';
      tmp.onload = () => { c.skinImage = tmp; };
      tmp.src = c.skinSrc;
    } else if (c.isPlayer && skinImage && activeSkin === 'custom') {
      imgToUse = skinImage;
    }

    if (imgToUse) {
      ctx.clip();
      const size = r * 2;
      ctx.drawImage(imgToUse, c.x - r, c.y - r, size, size);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(94,234,212,0.9)';
      ctx.stroke();
    } else {
      const palette = getSkinPalette(c.isPlayer ? activeSkin : 'default');
      const grad = ctx.createRadialGradient(
        c.x - r * 0.3, c.y - r * 0.3, r * 0.1,
        c.x, c.y, r
      );
      grad.addColorStop(0, lighten(palette.base));
      grad.addColorStop(1, palette.accent);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.stroke();
      ctx.restore();
    }
    
    // Effects
    if (c.isPlayer) {
      const pulse = 0.7 + 0.3 * Math.sin(gameTime * 6);
      if (activeEffect === 'pulse') {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(69,230,209,${0.2 + pulse * 0.18})`;
        ctx.lineWidth = 2 + pulse;
        ctx.arc(c.x, c.y, r + 4 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeEffect === 'halo') {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(244,114,182,0.36)';
        ctx.lineWidth = 3;
        ctx.arc(c.x, c.y, r + 8, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeEffect === 'trail') {
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x - (c.vx || 0) * 0.12, c.y - (c.vy || 0) * 0.12);
        ctx.strokeStyle = 'rgba(250,204,21,0.34)';
        ctx.lineWidth = 2.4;
        ctx.stroke();
      } else if (activeEffect === 'shockwave') {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(96,165,250,${0.24 + pulse * 0.16})`;
        ctx.lineWidth = 2;
        ctx.arc(c.x, c.y, r + 10 + pulse * 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    // Labels
    const fontSize = clamp(r * 0.32, 10, 22);
    const fontFamily = getFontFamily(activeFont);
    
    if (settings.showNames) {
      const displayName = c.name || (c.ownerId === 'player' ? (nameChip?.textContent || 'Pemain') : (c.ownerId || 'Player'));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${fontSize}px ${fontFamily}, sans-serif`;
      const nameY = c.y - (r > 26 ? 4 : 0);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(5,10,18,0.55)';
      ctx.strokeText(displayName, c.x, nameY);
      ctx.fillStyle = '#fff';
      ctx.fillText(displayName, c.x, nameY);
    }
    
    if (settings.showMass && r > 26) {
      ctx.font = `500 ${clamp(fontSize * 0.62, 9, 14)}px ${fontFamily}, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(Math.round(c.mass), c.x, c.y + fontSize * 0.85);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Grid
    if (settings.showGrid) {
      ctx.strokeStyle = 'rgba(94,234,212,0.06)';
      ctx.lineWidth = 1;
      const gs = 100;
      const sx = Math.floor((camera.x - W) / gs) * gs;
      const sy = Math.floor((camera.y - H) / gs) * gs;
      for (let x = sx; x < camera.x + W; x += gs) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD.h);
        ctx.stroke();
      }
      for (let y = sy; y < camera.y + H; y += gs) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD.w, y);
        ctx.stroke();
      }
    }

    // World border
    ctx.strokeStyle = 'rgba(244,114,182,0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, WORLD.w, WORLD.h);

    // Draw objects
    for (const v of viruses) {
      if (v.alive) drawVirus(v);
    }
    for (const t of thorns) {
      if (t.alive) drawThorn(t);
    }
    for (const f of food) {
      ctx.beginPath();
      ctx.fillStyle = f.color;
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Particles
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / 0.4, 0, 1);
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    // Split effects
    for (const s of splitEffects) {
      ctx.globalAlpha = clamp(s.life / 0.35, 0, 1);
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.2;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    
    // Cells (sorted by mass for depth)
    const sorted = [...cells].filter(c => c.alive).sort((a, b) => a.mass - b.mass);
    for (const c of sorted) drawCell(c);

    ctx.restore();
  }

  // ============================================================
  // 6s. Leaderboard
  // ============================================================
  function updateLB() {
    const groups = new Map();
    for (const c of cells) {
      if (!c.alive) continue;
      const key = c.ownerId;
      const g = groups.get(key) || { name: c.name, mass: 0, isPlayer: c.ownerId === 'player' };
      g.mass += c.mass;
      groups.set(key, g);
    }
    const ranked = [...groups.values()].sort((a, b) => b.mass - a.mass).slice(0, 6);
    lbList.innerHTML = ranked.map((g, index) => 
      `<li class="${g.isPlayer ? 'me' : ''}">${index + 1}. ${g.name} — ${Math.round(g.mass)}</li>`
    ).join('');
  }

  // ============================================================
  // 6t. Main Loop
  // ============================================================
  function loop(now) {
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    gameTime += dt;
    
    update(dt);
    draw();
    
    const gtd = document.getElementById('gameTimeDisplay');
    if (gtd) gtd.textContent = `${Math.floor(gameTime)}s`;
    
    lbTimer += dt;
    if (lbTimer > 0.25) {
      updateLB();
      lbTimer = 0;
    }
    
    if (running && !paused) {
        // Smoothly interpolate camera.zoom toward targetZoom for nicer scroll feel
        camera.zoom += (targetZoom - camera.zoom) * clamp(dt * 8, 0, 1);
        rafId = requestAnimationFrame(loop);
    }
  }

  // ============================================================
  // 6u. Start / Restart
  // ============================================================
  function beginMatch() {
    resetWorld();
    startOverlay.classList.add('hidden');
    deathOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    paused = false;
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(loop);
    // Show only leaderboard on right and enable chat
    if (leaderboardEl) leaderboardEl.classList.remove('hidden');
    if (chatBox) chatBox.style.display = 'flex';
    // liveWarning suppressed (hidden)
  }

  startBtn.addEventListener('click', beginMatch);
  retryBtn.addEventListener('click', beginMatch);
  deathMenuBtn.addEventListener('click', () => {
    deathOverlay.classList.add('hidden');
    startOverlay.classList.remove('hidden');
    if (leaderboardEl) leaderboardEl.classList.add('hidden');
    if (chatBox) chatBox.style.display = 'none';
  });

  // Fallback: ensure start overlay visible on load and start button enabled
  try {
    if (startOverlay && startOverlay.classList.contains('hidden')) startOverlay.classList.remove('hidden');
    if (startBtn) { startBtn.style.display = 'block'; startBtn.disabled = false; }
  } catch (e) { /* ignore */ }

  // Debug helpers: log key elements and ensure click triggers beginMatch
  try {
    console.log('UI debug:', { startOverlay, startBtn, settingsOverlay, settingsBtn });
    if (startBtn && !startBtn._debugBound) {
      startBtn.addEventListener('click', () => { console.log('DEBUG: startBtn clicked'); });
      startBtn._debugBound = true;
    }
  } catch (e) { console.warn('Debug attach failed', e); }

  // Chat send handler (local echo)
  // initialize chat nickname from profile
  if (chatNick && nameChip) chatNick.value = nameChip.textContent || 'Pemain';

  chatSend?.addEventListener('click', () => {
    const txt = chatInput?.value?.trim();
    if (!txt) return;
    const nick = (chatNick?.value || nameChip?.textContent || 'Pemain').trim();
    const wrapper = document.createElement('div'); wrapper.className = 'msg-wrapper';
    const label = document.createElement('div'); label.className = 'msg-nick'; label.textContent = nick;
    const el = document.createElement('div'); el.className = 'msg-bubble you'; el.textContent = txt;
    wrapper.appendChild(label);
    wrapper.appendChild(el);
    chatMessages?.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (chatInput) chatInput.value = '';

    // update local nameChip and playerNameCard if nickname changed
    if (nameChip && playerNameCard && nick && nick !== nameChip.textContent) {
      nameChip.textContent = nick;
      playerNameCard.textContent = nick;
      if (playerDocRef) {
        updateDoc(playerDocRef, { name: nick }).catch(() => {});
      }
    }
  });
  chatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') chatSend?.click(); });

  // ============================================================
  // 6v. Settings Sync
  // ============================================================
  const startSettingsControls = [
    document.getElementById('graphicsSelect'),
    document.getElementById('soundToggle'),
    document.getElementById('musicToggle'),
    document.getElementById('showMassToggle'),
    document.getElementById('showGridToggle'),
    document.getElementById('showNamesToggle'),
    document.getElementById('zoomRange')
  ];
  
  const pauseSettingsControls = [
    document.getElementById('pauseGraphicsSelect'),
    document.getElementById('pauseSoundToggle'),
    document.getElementById('pauseMusicToggle'),
    document.getElementById('pauseShowMassToggle'),
    document.getElementById('pauseShowGridToggle'),
    document.getElementById('pauseShowNamesToggle'),
    document.getElementById('pauseZoomRange')
  ];

  const syncSettings = () => {
    const zoom = parseFloat(
      (document.getElementById('zoomRange')?.value || 
       document.getElementById('pauseZoomRange')?.value || 
       '1')
    );
    settings.graphics = (document.getElementById('graphicsSelect')?.value || 
                         document.getElementById('pauseGraphicsSelect')?.value || 
                         'high');
    settings.sound = (document.getElementById('soundToggle')?.checked ?? 
                      document.getElementById('pauseSoundToggle')?.checked ?? 
                      true);
    settings.music = (document.getElementById('musicToggle')?.checked ?? 
                      document.getElementById('pauseMusicToggle')?.checked ?? 
                      true);
    settings.showMass = (document.getElementById('showMassToggle')?.checked ?? 
                         document.getElementById('pauseShowMassToggle')?.checked ?? 
                         true);
    settings.showGrid = (document.getElementById('showGridToggle')?.checked ?? 
                         document.getElementById('pauseShowGridToggle')?.checked ?? 
                         true);
    settings.showNames = (document.getElementById('showNamesToggle')?.checked ?? 
                          document.getElementById('pauseShowNamesToggle')?.checked ?? 
                          true);
    settings.zoom = clamp(zoom, 0.6, 1.45);
    camera.zoom = settings.zoom;
    zoomWheel = settings.zoom - 1;
    applyGraphicsPreset();
  };

  startSettingsControls.forEach(el => el?.addEventListener('change', syncSettings));
  pauseSettingsControls.forEach(el => el?.addEventListener('change', syncSettings));
  document.getElementById('zoomRange')?.addEventListener('input', syncSettings);
  document.getElementById('pauseZoomRange')?.addEventListener('input', syncSettings);

  // Settings overlay actions
  applySettingsBtn?.addEventListener('click', async () => {
    syncSettings();
    // persist minimal settings to player doc if available
    if (playerDocRef) {
      try {
        await updateDoc(playerDocRef, {
          settings: {
            graphics: document.getElementById('graphicsSelect')?.value || 'high',
            showMass: !!document.getElementById('showMassToggle')?.checked,
            showGrid: !!document.getElementById('showGridToggle')?.checked,
            showNames: !!document.getElementById('showNamesToggle')?.checked,
            zoom: parseFloat(document.getElementById('zoomRange')?.value || '1')
          }
        });
      } catch (err) { console.warn('Gagal menyimpan pengaturan:', err); }
    }
    // Close settings and restore previous overlay depending on origin
    if (settingsOverlay) settingsOverlay.classList.add('hidden');
    if (settingsOrigin === 'pause') {
      if (pauseOverlay) pauseOverlay.classList.remove('hidden');
      paused = true;
      // keep leaderboard hidden while paused
      if (leaderboardEl) leaderboardEl.classList.add('hidden');
    } else {
      // default: return to start/main overlay
      if (startOverlay) startOverlay.classList.remove('hidden');
      if (leaderboardEl) leaderboardEl.classList.add('hidden');
      if (chatBox) chatBox.style.display = 'none';
    }
    settingsOrigin = null;
  });

  backSettingsBtn?.addEventListener('click', () => {
    if (settingsOverlay) settingsOverlay.classList.add('hidden');
    if (settingsOrigin === 'pause') {
      if (pauseOverlay) pauseOverlay.classList.remove('hidden');
      paused = true;
      if (leaderboardEl) leaderboardEl.classList.add('hidden');
    } else {
      if (startOverlay) startOverlay.classList.remove('hidden');
      if (leaderboardEl) leaderboardEl.classList.add('hidden');
      if (chatBox) chatBox.style.display = 'none';
    }
    settingsOrigin = null;
  });

  // ============================================================
  // 6w. Initial Setup
  // ============================================================
  // Restore theme from localStorage (default dark)
  try {
    const saved = localStorage.getItem('ba_theme') || 'dark';
    document.body.dataset.theme = saved;
    themeBtn.textContent = saved === 'light' ? '🌙 Tema' : '☀️ Tema';
  } catch (e) {
    document.body.dataset.theme = 'dark';
    themeBtn.textContent = '🌙 Tema';
  }
  colorPicker.value = playerColor;
  syncSettings();

  // Timeout untuk loading state
  setTimeout(() => {
    if (startBtn.style.display !== 'block' && !startOverlay.classList.contains('hidden')) {
      startTitle.textContent = 'Masih memuat...';
      startSub.innerHTML = 'Kalau ini terus muncul, cek: (1) Firestore Database sudah dibuat di Firebase Console, (2) Firestore Rules sudah di-Publish, (3) buka Console browser (F12) untuk lihat pesan error persis.';
    }
  }, 8000);
}

// ============================================================
// END OF FILE
// ============================================================