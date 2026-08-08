// ============================================================
// BLOB ARENA — game.js
// Engine kanvas + integrasi akun (auth guard, poin, skin foto)
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, increment, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Catatan: skin foto TIDAK memakai Firebase Storage (butuh paket berbayar Blaze).
// Foto dikompres jadi gambar kecil di browser lalu disimpan sebagai teks base64
// langsung di dokumen Firestore pemain — tetap gratis.

const startOverlay = document.getElementById('startOverlay');
const startTitle = document.getElementById('startTitle');
const startSub = document.getElementById('startSub');
const startBtn = document.getElementById('startBtn');
const skinRow = document.getElementById('skinRow');
const skinPreview = document.getElementById('skinPreview');
const skinFile = document.getElementById('skinFile');
const deathOverlay = document.getElementById('deathOverlay');
const retryBtn = document.getElementById('retryBtn');
const finalMassEl = document.getElementById('finalMass');
const earnedPointsEl = document.getElementById('earnedPoints');
const massVal = document.getElementById('massVal');
const pointsVal = document.getElementById('pointsVal');
const nameChip = document.getElementById('nameChip');
const avatarChip = document.getElementById('avatarChip');
const logoutBtn = document.getElementById('logoutBtn');
const openSkinBtn = document.getElementById('openSkinBtn');
const lbList = document.getElementById('lbList');

if (!window.FIREBASE_CONFIGURED) {
  startTitle.textContent = 'Firebase belum dikonfigurasi';
  startSub.innerHTML = 'Isi <code>js/firebase-config.js</code> dengan config project Firebase-mu dulu, lalu buka halaman ini lagi. Panduan ada di README.md.';
} else {
  runGame();
}

function runGame(){
  const app = initializeApp(window.FIREBASE_CONFIG);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let currentUser = null;
  let playerDocRef = null;
  let accountPoints = 0;
  let skinImage = null; // HTMLImageElement, ready to draw

  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = 'index.html'; return; }
    currentUser = user;
    playerDocRef = doc(db, 'players', user.uid);

    try {
      const snap = await getDoc(playerDocRef);
      const data = snap.exists() ? snap.data() : { name: user.displayName || 'Pemain', points: 0, skinData: null };

      nameChip.textContent = data.name || 'Pemain';
      accountPoints = data.points || 0;
      pointsVal.textContent = accountPoints;

      if (data.skinData) {
        applySkinURL(data.skinData);
      }

      startTitle.textContent = 'Siap bertarung, ' + (data.name || 'Pemain') + '?';
      startSub.textContent = 'Gerakkan mouse untuk mengarahkan sel, tekan spasi untuk boost.';
      skinRow.style.display = 'flex';
      startBtn.style.display = 'block';
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

  // Kalau pemeriksaan akun tidak selesai sama sekali (mis. Firestore Database
  // belum dibuat di Firebase Console), jangan biarkan macet tanpa keterangan.
  setTimeout(() => {
    if (startBtn.style.display !== 'block' && !startOverlay.classList.contains('hidden')) {
      startTitle.textContent = 'Masih memuat...';
      startSub.innerHTML = 'Kalau ini terus muncul, cek: (1) Firestore Database sudah dibuat di Firebase Console, (2) Firestore Rules sudah di-Publish, (3) buka Console browser (F12) untuk lihat pesan error persis.';
    }
  }, 8000);

  function applySkinURL(url){
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      skinImage = img;
      skinPreview.style.backgroundImage = `url(${url})`;
      avatarChip.style.backgroundImage = `url(${url})`;
    };
    img.src = url;
  }

  openSkinBtn.addEventListener('click', () => skinFile.click());

  // Kompres foto jadi gambar bulat kecil (160x160 JPEG) di browser, lalu
  // simpan sebagai base64 langsung ke Firestore — tidak butuh Storage.
  function compressImageToDataURL(file, size = 160, quality = 0.82){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvasEl = document.createElement('canvas');
        canvasEl.width = size; canvasEl.height = size;
        const cctx = canvasEl.getContext('2d');
        // crop-to-square (cover) so the photo fills the circle nicely
        const s = Math.min(img.width, img.height);
        const sx = (img.width - s) / 2, sy = (img.height - s) / 2;
        cctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
        resolve(canvasEl.toDataURL('image/jpeg', quality));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error('File gambar tidak valid.'));
      img.src = URL.createObjectURL(file);
    });
  }

  skinFile.addEventListener('change', async () => {
    const file = skinFile.files[0];
    if (!file || !currentUser) return;
    if (!['image/png','image/jpeg'].includes(file.type)) {
      alert('Hanya file PNG atau JPG yang didukung.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file maksimal 8MB (akan dikompres otomatis).');
      return;
    }
    try {
      const dataURL = await compressImageToDataURL(file);
      // dokumen Firestore dibatasi ~1MB; hasil kompresi 160x160 JPEG jauh di bawah itu
      await updateDoc(playerDocRef, { skinData: dataURL });
      applySkinURL(dataURL);
    } catch (err) {
      alert('Gagal memproses skin: ' + err.message);
    }
  });

  // ================= GAME ENGINE =================
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize);
  resize();

  const WORLD = { w: 3000, h: 3000 };
  const FOOD_COUNT = 260;
  const BOT_COUNT = 10;
  const COLORS = ['#5eead4','#f472b6','#facc15','#818cf8','#fb923c','#4ade80','#60a5fa','#e879f9'];
  const BOT_NAMES = ['Cua','Sói','Bọt','Ma','Sấm','Lửa','Trăng','Sao','Gió','Bão'];

  function rand(a,b){ return Math.random()*(b-a)+a; }
  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
  function massToRadius(m){ return 6 + Math.sqrt(m)*3.2; }
  function clamp(v,lo,hi){ return Math.max(lo, Math.min(hi, v)); }

  let food = [], cells = [], particles = [];
  let camera = { x: WORLD.w/2, y: WORLD.h/2, zoom: 1 };
  let mouse = { x: innerWidth/2, y: innerHeight/2 };
  let boosting = false, running = false, player = null, rafId = null, lastT = 0;
  let sessionStartMass = 26;

  function spawnFood(n){
    for(let i=0;i<n;i++){
      food.push({ x: rand(20,WORLD.w-20), y: rand(20,WORLD.h-20), r: rand(3,5.5), color: COLORS[Math.floor(rand(0,COLORS.length))] });
    }
  }
  function makeCell(name, isPlayer, x, y, mass, color){
    return {
      id: Math.random().toString(36).slice(2), name, isPlayer,
      x: x ?? rand(200, WORLD.w-200), y: y ?? rand(200, WORLD.h-200),
      mass: mass ?? rand(18,30), color: color ?? COLORS[Math.floor(rand(0,COLORS.length))],
      vx:0, vy:0, targetX:0, targetY:0, wanderT: rand(0,10), alive:true
    };
  }

  function resetWorld(){
    food = []; cells = []; particles = [];
    spawnFood(FOOD_COUNT);
    player = makeCell(nameChip.textContent, true, WORLD.w/2, WORLD.h/2, 26, '#5eead4');
    sessionStartMass = player.mass;
    cells.push(player);
    for(let i=0;i<BOT_COUNT;i++){
      cells.push(makeCell(BOT_NAMES[i % BOT_NAMES.length] + (i>=BOT_NAMES.length?i:''), false, null, null, rand(16,60)));
    }
  }

  canvas.addEventListener('mousemove', e=>{ mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('keydown', e=>{ if(e.code==='Space'){ boosting = true; e.preventDefault(); } });
  window.addEventListener('keyup', e=>{ if(e.code==='Space') boosting = false; });
  canvas.addEventListener('touchmove', e=>{ const t=e.touches[0]; if(t){ mouse.x=t.clientX; mouse.y=t.clientY; } }, {passive:true});

  function update(dt){
    if(!player || !player.alive) return;
    for(const c of cells){
      if(!c.alive) continue;
      let dx, dy;
      if(c.isPlayer){
        dx = mouse.x - W/2; dy = mouse.y - H/2;
      } else {
        c.wanderT -= dt;
        let threat=null, prey=null, threatD=Infinity, preyD=Infinity;
        for(const o of cells){
          if(o===c || !o.alive) continue;
          const d = dist(c,o);
          if(d < 400){
            if(o.mass > c.mass*1.15 && d<threatD){ threat=o; threatD=d; }
            else if(c.mass > o.mass*1.15 && d<preyD){ prey=o; preyD=d; }
          }
        }
        if(threat){ dx=c.x-threat.x; dy=c.y-threat.y; }
        else if(prey){ dx=prey.x-c.x; dy=prey.y-c.y; }
        else {
          if(c.wanderT<=0){ c.targetX=rand(-1,1); c.targetY=rand(-1,1); c.wanderT=rand(2,5); }
          dx=c.targetX; dy=c.targetY;
        }
      }
      const len = Math.hypot(dx,dy) || 1;
      const speed = (c.isPlayer && boosting ? 1.6:1) * clamp(220/Math.sqrt(c.mass), 40, 200);
      c.vx = (dx/len)*speed; c.vy = (dy/len)*speed;
      if(c.isPlayer && boosting && c.mass>20){
        c.mass -= dt*4;
        if(Math.random()<0.4) particles.push({x:c.x,y:c.y,r:massToRadius(c.mass)*0.3,life:0.4,color:c.color});
      }
      c.x = clamp(c.x + c.vx*dt, massToRadius(c.mass), WORLD.w-massToRadius(c.mass));
      c.y = clamp(c.y + c.vy*dt, massToRadius(c.mass), WORLD.h-massToRadius(c.mass));
    }

    for(const c of cells){
      if(!c.alive) continue;
      const r = massToRadius(c.mass);
      for(let i=food.length-1;i>=0;i--){
        const f = food[i];
        if(Math.hypot(c.x-f.x, c.y-f.y) < r){ c.mass += f.r*0.9; food.splice(i,1); }
      }
    }
    while(food.length < FOOD_COUNT) spawnFood(1);

    for(let i=0;i<cells.length;i++){
      const a = cells[i];
      if(!a.alive) continue;
      for(let j=0;j<cells.length;j++){
        if(i===j) continue;
        const b = cells[j];
        if(!b.alive) continue;
        if(a.mass > b.mass*1.15){
          const ra = massToRadius(a.mass);
          if(dist(a,b) < ra*0.85){
            a.mass += b.mass*0.8;
            b.alive = false;
            if(b.isPlayer) onPlayerDeath();
            if(!b.isPlayer){
              setTimeout(()=>{
                if(!running) return;
                const idx = cells.indexOf(b);
                const nb = makeCell(b.name, false, null, null, rand(16,40));
                if(idx>=0) cells[idx]=nb; else cells.push(nb);
              }, rand(1500,3500));
            }
          }
        }
      }
    }

    if(player.alive){
      camera.x += (player.x-camera.x)*0.12;
      camera.y += (player.y-camera.y)*0.12;
      const tz = clamp(1.15-(player.mass-26)/500, 0.45, 1.15);
      camera.zoom += (tz-camera.zoom)*0.05;
      massVal.textContent = Math.round(player.mass);
    }
    particles.forEach(p=>p.life-=dt);
    particles = particles.filter(p=>p.life>0);
  }

  async function onPlayerDeath(){
    running = false;
    cancelAnimationFrame(rafId);
    const earned = Math.max(0, Math.round(player.mass - sessionStartMass));
    finalMassEl.textContent = Math.round(player.mass);
    earnedPointsEl.textContent = '+' + earned;
    deathOverlay.classList.remove('hidden');

    if (playerDocRef) {
      try {
        await updateDoc(playerDocRef, {
          points: increment(earned),
          bestMass: Math.max(Math.round(player.mass), 0)
        });
        accountPoints += earned;
        pointsVal.textContent = accountPoints;
      } catch (err) {
        console.warn('Gagal menyimpan poin:', err.message);
      }
    }
  }

  function drawCell(c){
    const r = massToRadius(c.mass);
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI*2);
    ctx.closePath();
    if(c.isPlayer && skinImage){
      ctx.clip();
      const size = r*2;
      ctx.drawImage(skinImage, c.x-r, c.y-r, size, size);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI*2);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(94,234,212,0.9)';
      ctx.stroke();
    } else {
      ctx.fillStyle = c.color;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(5,10,18,0.9)';
    ctx.font = `700 ${clamp(r*0.3,10,20)}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(c.name, c.x, c.y + r + 12);
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.save();
    ctx.translate(W/2,H/2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x,-camera.y);

    ctx.strokeStyle = 'rgba(94,234,212,0.06)';
    ctx.lineWidth = 1;
    const gs = 100;
    const sx = Math.floor((camera.x-W)/gs)*gs, sy = Math.floor((camera.y-H)/gs)*gs;
    for(let x=sx; x<camera.x+W; x+=gs){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,WORLD.h); ctx.stroke(); }
    for(let y=sy; y<camera.y+H; y+=gs){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(WORLD.w,y); ctx.stroke(); }

    ctx.strokeStyle = 'rgba(244,114,182,0.35)'; ctx.lineWidth = 4;
    ctx.strokeRect(0,0,WORLD.w,WORLD.h);

    for(const f of food){
      ctx.beginPath(); ctx.fillStyle = f.color; ctx.arc(f.x,f.y,f.r,0,Math.PI*2); ctx.fill();
    }
    for(const p of particles){
      ctx.globalAlpha = clamp(p.life/0.4,0,1);
      ctx.beginPath(); ctx.fillStyle = p.color; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const sorted = [...cells].filter(c=>c.alive).sort((a,b)=>a.mass-b.mass);
    for(const c of sorted) drawCell(c);

    ctx.restore();
  }

  function updateLB(){
    const ranked = [...cells].filter(c=>c.alive).sort((a,b)=>b.mass-a.mass).slice(0,6);
    lbList.innerHTML = ranked.map(c=>`<li class="${c.isPlayer?'me':''}">${c.name} — ${Math.round(c.mass)}</li>`).join('');
  }

  function loop(now){
    const dt = Math.min((now-lastT)/1000, 0.05);
    lastT = now;
    update(dt);
    draw();
    updateLB();
    if(running) rafId = requestAnimationFrame(loop);
  }

  function beginMatch(){
    resetWorld();
    startOverlay.classList.add('hidden');
    deathOverlay.classList.add('hidden');
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  startBtn.addEventListener('click', beginMatch);
  retryBtn.addEventListener('click', beginMatch);
}
