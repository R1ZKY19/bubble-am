// ================================================================
//  BLOB ARENA — Full Game Logic
// ================================================================

// ---------- DOM refs ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerNameEl = document.getElementById('playerName');
const playerMassEl = document.getElementById('playerMass');
const playerScoreEl = document.getElementById('playerScore');
const lbList = document.getElementById('lbList');

const startOverlay = document.getElementById('startOverlay');
const deathOverlay = document.getElementById('deathOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');

const nameInput = document.getElementById('nameInput');
const startBtn = document.getElementById('startBtn');

const deathMass = document.getElementById('deathMass');
const deathPoints = document.getElementById('deathPoints');
const deathMessage = document.getElementById('deathMessage');
const retryBtn = document.getElementById('retryBtn');
const deathMenuBtn = document.getElementById('deathMenuBtn');

const pauseName = document.getElementById('pauseName');
const pauseMass = document.getElementById('pauseMass');
const pausePoints = document.getElementById('pausePoints');
const pauseRank = document.getElementById('pauseRank');
const resumeBtn = document.getElementById('resumeBtn');
const pauseQuitBtn = document.getElementById('pauseQuitBtn');
const pauseZoom = document.getElementById('pauseZoom');
const pauseGrid = document.getElementById('pauseGrid');
const pauseNames = document.getElementById('pauseNames');

// ---------- Sizing ----------
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ---------- Game State ----------
const state = {
  running: false,
  paused: false,
  name: 'Pemain',
  score: 0,
  zoom: 1.0,
  showGrid: true,
  showNames: true,
  player: { x: 0, y: 0, radius: 20, mass: 20, color: '#7ee8fa', name: 'Pemain', cells: [{ x: 0, y: 0, radius: 20 }] },
  foods: [],
  viruses: [],
  bots: [],
  mouse: { x: 0, y: 0 },
  camera: { x: 0, y: 0 },
  leaderboard: [],
};

// ---------- Colors ----------
const colors = ['#ff6b6b', '#ffa94d', '#fcc419', '#69db7c', '#4dabf7', '#9775fa', '#f06595', '#20c997'];
function randomColor() { return colors[Math.floor(Math.random() * colors.length)]; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function rand(min, max) { return Math.random() * (max - min) + min; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ---------- Spawn ----------
function spawnFood() {
  const margin = 100, w = canvas.width * 2 + margin * 2, h = canvas.height * 2 + margin * 2;
  return { x: rand(-w/2, w/2), y: rand(-h/2, h/2), radius: 4 + rand(0, 3), 
    color: ['#ffd43b','#ff6b6b','#69db7c','#4dabf7','#da77f2'][Math.floor(Math.random()*5)] };
}

function spawnVirus() {
  const margin = 200, w = canvas.width * 2 + margin * 2, h = canvas.height * 2 + margin * 2;
  return { x: rand(-w/2, w/2), y: rand(-h/2, h/2), radius: 30 + rand(0, 15), color: '#20c997', spikes: 8 + Math.floor(rand(0,4)) };
}

function spawnBot() {
  const margin = 300, w = canvas.width * 2 + margin * 2, h = canvas.height * 2 + margin * 2;
  const names = ['Bot🧠','AI_Pro','Makanan','SelKecil','Giant','Noob','Sweaty','Chill'];
  const mass = 15 + rand(0, 30);
  return {
    x: rand(-w/2, w/2), y: rand(-h/2, h/2), radius: Math.sqrt(mass * 100) / 2,
    mass, color: randomColor(), name: names[Math.floor(Math.random() * names.length)],
    targetX: rand(-w/2, w/2), targetY: rand(-h/2, h/2), speed: 0.6 + rand(0, 0.6),
    cells: [{ x: 0, y: 0, radius: Math.sqrt(mass * 100) / 2 }]
  };
}

function initWorld() {
  state.foods = []; for (let i = 0; i < 300; i++) state.foods.push(spawnFood());
  state.viruses = []; for (let i = 0; i < 12; i++) state.viruses.push(spawnVirus());
  state.bots = []; for (let i = 0; i < 25; i++) state.bots.push(spawnBot());
}

function resetPlayer(name) {
  const p = state.player;
  p.x = 0; p.y = 0; p.mass = 20; p.radius = 20; p.name = name || 'Pemain';
  p.color = randomColor(); p.cells = [{ x: 0, y: 0, radius: 20 }];
  state.score = 0;
}

// ---------- Game Loop ----------
let lastTime = 0, gameLoopId = null;

function startGame() {
  const name = nameInput.value.trim() || 'Pemain';
  state.name = name;
  resetPlayer(name);
  initWorld();
  state.running = true;
  state.paused = false;
  state.score = 0;
  state.leaderboard = [];
  startOverlay.classList.add('hidden');
  deathOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  updateHUD();
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  lastTime = performance.now();
  gameLoop();
}

function gameLoop() {
  if (!state.running) return;
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 16.667, 3);
  lastTime = now;
  if (!state.paused) { update(dt); render(); }
  gameLoopId = requestAnimationFrame(gameLoop);
}

// ---------- Update ----------
function update(dt) {
  const p = state.player;
  const mx = state.mouse.x, my = state.mouse.y;
  const dx = mx - p.x, dy = my - p.y, d = Math.hypot(dx, dy);
  if (d > 2) {
    const speed = Math.min(6, 80 / Math.sqrt(p.mass + 10));
    const move = Math.min(speed * dt, d);
    p.x += (dx / d) * move;
    p.y += (dy / d) * move;
  }
  p.cells[0].x = p.x; p.cells[0].y = p.y; p.cells[0].radius = p.radius;

  // Eat food
  for (let i = state.foods.length - 1; i >= 0; i--) {
    const food = state.foods[i];
    if (dist(p, food) < p.radius) {
      p.mass += food.radius * 0.3;
      p.radius = Math.sqrt(p.mass * 100) / 2;
      state.score += Math.floor(food.radius * 0.5);
      state.foods.splice(i, 1);
      state.foods.push(spawnFood());
    }
  }

  // Eat viruses
  for (let i = state.viruses.length - 1; i >= 0; i--) {
    const virus = state.viruses[i];
    if (dist(p, virus) < p.radius + virus.radius) {
      if (p.mass > 40) {
        const newMass = p.mass * 0.4;
        p.mass -= newMass;
        p.radius = Math.sqrt(p.mass * 100) / 2;
        state.score += Math.floor(newMass * 0.2);
      }
      state.viruses.splice(i, 1);
      state.viruses.push(spawnVirus());
    }
  }

  // Bots
  for (let i = state.bots.length - 1; i >= 0; i--) {
    const bot = state.bots[i];
    if (dist(p, bot) < p.radius - bot.radius * 0.6 && p.radius > bot.radius * 1.1) {
      p.mass += bot.mass * 0.5;
      p.radius = Math.sqrt(p.mass * 100) / 2;
      state.score += Math.floor(bot.mass * 0.2);
      state.bots.splice(i, 1);
      state.bots.push(spawnBot());
    } else if (dist(p, bot) < bot.radius - p.radius * 0.6 && bot.radius > p.radius * 1.1) {
      gameOver('Kamu dimakan oleh ' + bot.name);
      return;
    }
  }

  // Bot AI
  for (const bot of state.bots) {
    if (dist(bot, { x: bot.targetX, y: bot.targetY }) < 20 || Math.random() < 0.01) {
      bot.targetX = rand(-canvas.width, canvas.width);
      bot.targetY = rand(-canvas.height, canvas.height);
    }
    const dx2 = bot.targetX - bot.x, dy2 = bot.targetY - bot.y, d2 = Math.hypot(dx2, dy2);
    if (d2 > 5) {
      const speed = bot.speed * Math.min(2, 60 / Math.sqrt(bot.mass + 10));
      bot.x += (dx2 / d2) * speed * dt;
      bot.y += (dy2 / d2) * speed * dt;
    }
    bot.cells[0].x = bot.x; bot.cells[0].y = bot.y; bot.cells[0].radius = bot.radius;
    
    for (let i = state.foods.length - 1; i >= 0; i--) {
      const food = state.foods[i];
      if (dist(bot, food) < bot.radius) {
        bot.mass += food.radius * 0.3;
        bot.radius = Math.sqrt(bot.mass * 100) / 2;
        state.foods.splice(i, 1);
        state.foods.push(spawnFood());
      }
    }
    for (let i = state.viruses.length - 1; i >= 0; i--) {
      const virus = state.viruses[i];
      if (dist(bot, virus) < bot.radius + virus.radius) {
        if (bot.mass > 40) { bot.mass *= 0.6; bot.radius = Math.sqrt(bot.mass * 100) / 2; }
        state.viruses.splice(i, 1);
        state.viruses.push(spawnVirus());
      }
    }
  }
  updateLeaderboard();
  updateHUD();
}

// ---------- Render ----------
function render() {
  const w = canvas.width, h = canvas.height, p = state.player;
  state.camera.x = p.x - w / 2;
  state.camera.y = p.y - h / 2;
  ctx.clearRect(0, 0, w, h);

  // Grid
  if (state.showGrid) {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const gridSize = 80 * state.zoom;
    const offsetX = -(state.camera.x % gridSize);
    const offsetY = -(state.camera.y % gridSize);
    for (let x = offsetX; x < w; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = offsetY; y < h; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }

  ctx.save();
  ctx.translate(w / 2 - p.x, h / 2 - p.y);

  // Viruses
  for (const virus of state.viruses) {
    const vx = virus.x, vy = virus.y, r = virus.radius * state.zoom;
    ctx.beginPath(); ctx.arc(vx, vy, r, 0, Math.PI * 2);
    ctx.fillStyle = virus.color; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2;
    for (let i = 0; i < virus.spikes; i++) {
      const angle = (i / virus.spikes) * Math.PI * 2 + performance.now() * 0.001;
      const spikeR = r * 1.3;
      ctx.beginPath();
      ctx.moveTo(vx + Math.cos(angle) * r * 0.9, vy + Math.sin(angle) * r * 0.9);
      ctx.lineTo(vx + Math.cos(angle) * spikeR, vy + Math.sin(angle) * spikeR);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💀', vx, vy + 4);
  }

  // Foods
  for (const food of state.foods) {
    const fx = food.x, fy = food.y, r = food.radius * state.zoom;
    ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fillStyle = food.color;
    ctx.shadowColor = food.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Bots
  for (const bot of state.bots) {
    drawCell(bot.x, bot.y, bot.radius, bot.color, bot.name, bot.mass);
  }

  // Player
  drawCell(p.x, p.y, p.radius, p.color, p.name, p.mass, true);

  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▼ You', w / 2, h / 2 - p.radius * state.zoom - 20);
}

function drawCell(x, y, radius, color, name, mass, isPlayer = false) {
  const r = radius * state.zoom;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(0.7, color);
  grad.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();

  if (state.showNames) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(24, Math.max(12, r * 0.45))}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8;
    ctx.fillText(name || '', x, y - (isPlayer ? 0 : 4));
    ctx.shadowBlur = 0;
    if (isPlayer) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `${Math.min(14, Math.max(10, r * 0.25))}px 'Segoe UI', sans-serif`;
      ctx.fillText(Math.floor(mass), x, y + r * 0.5);
    }
  }
}

// ---------- Leaderboard ----------
function updateLeaderboard() {
  const entries = [{ name: state.player.name, mass: state.player.mass, isMe: true }];
  for (const bot of state.bots) entries.push({ name: bot.name, mass: bot.mass, isMe: false });
  entries.sort((a, b) => b.mass - a.mass);
  state.leaderboard = entries.slice(0, 10);
  lbList.innerHTML = '';
  for (let i = 0; i < Math.min(entries.length, 10); i++) {
    const e = entries[i];
    const li = document.createElement('li');
    if (e.isMe) li.className = 'me';
    li.innerHTML = `<span class="lb-name">${i+1}. ${e.name}</span><span class="lb-mass">${Math.floor(e.mass)}</span>`;
    lbList.appendChild(li);
  }
}

function updateHUD() {
  playerNameEl.textContent = state.player.name;
  playerMassEl.textContent = `⚪ ${Math.floor(state.player.mass)}`;
  playerScoreEl.textContent = `⭐ ${state.score}`;
}

// ---------- Game Over ----------
function gameOver(message) {
  state.running = false;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  deathMass.textContent = Math.floor(state.player.mass);
  deathPoints.textContent = `+${state.score}`;
  deathMessage.textContent = message || 'Selmu dimakan!';
  deathOverlay.classList.remove('hidden');
}

// ---------- Pause ----------
function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  if (state.paused) {
    pauseName.textContent = state.player.name;
    pauseMass.textContent = Math.floor(state.player.mass);
    pausePoints.textContent = state.score;
    const rank = state.leaderboard.findIndex(e => e.isMe) + 1;
    pauseRank.textContent = rank > 0 ? `#${rank}` : '—';
    pauseZoom.value = state.zoom;
    pauseGrid.checked = state.showGrid;
    pauseNames.checked = state.showNames;
    pauseOverlay.classList.remove('hidden');
  } else {
    pauseOverlay.classList.add('hidden');
  }
}

// ---------- Event Listeners ----------
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  state.mouse.x = e.clientX - rect.left + state.camera.x;
  state.mouse.y = e.clientY - rect.top + state.camera.y;
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  state.zoom = clamp(state.zoom - e.deltaY * 0.001, 0.4, 2.0);
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Space') {
    e.preventDefault();
    if (state.running && !state.paused) {
      const p = state.player;
      if (p.mass > 40) {
        const newMass = p.mass * 0.45;
        p.mass -= newMass;
        p.radius = Math.sqrt(p.mass * 100) / 2;
        state.score += Math.floor(newMass * 0.1);
      }
    }
  }
  if (e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    if (state.running && !state.paused) {
      const p = state.player;
      if (p.mass > 15) {
        const ejectMass = Math.min(5, p.mass * 0.05);
        p.mass -= ejectMass;
        p.radius = Math.sqrt(p.mass * 100) / 2;
        const dx = state.mouse.x - p.x, dy = state.mouse.y - p.y, d = Math.hypot(dx, dy) || 1;
        const dist2 = p.radius + 20;
        state.foods.push({ x: p.x + (dx/d) * dist2, y: p.y + (dy/d) * dist2, radius: 6, color: p.color });
      }
    }
  }
  if (e.key === 'Escape') { e.preventDefault(); togglePause(); }
});

startBtn.addEventListener('click', startGame);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') startGame(); });

retryBtn.addEventListener('click', () => { deathOverlay.classList.add('hidden'); startGame(); });
deathMenuBtn.addEventListener('click', () => {
  deathOverlay.classList.add('hidden');
  state.running = false;
  startOverlay.classList.remove('hidden');
});

resumeBtn.addEventListener('click', togglePause);
pauseQuitBtn.addEventListener('click', () => {
  pauseOverlay.classList.add('hidden');
  state.running = false;
  state.paused = false;
  startOverlay.classList.remove('hidden');
});

pauseZoom.addEventListener('input', () => { state.zoom = parseFloat(pauseZoom.value); });
pauseGrid.addEventListener('change', () => { state.showGrid = pauseGrid.checked; });
pauseNames.addEventListener('change', () => { state.showNames = pauseNames.checked; });

// ---------- Init ----------
startOverlay.classList.remove('hidden');
deathOverlay.classList.add('hidden');
pauseOverlay.classList.add('hidden');
initWorld();
resetPlayer('Pemain');
updateLeaderboard();
updateHUD();

function idleRender() {
  if (!state.running) { render(); requestAnimationFrame(idleRender); }
}
idleRender();

console.log('🍄 Blob Arena loaded!');
