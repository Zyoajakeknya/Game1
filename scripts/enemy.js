import { playerHP, decreaseHP, increaseKillCount, getStage } from './ui.js';

// ===========================
// 🔹 VARIABEL UTAMA
// ===========================
let enemies = [];
let spawnTimer = 0;
let bossSpawned = false;
let boss = null;
let lastStage = 1;
let gameOverTriggered = false;
let smokeParticles = [];
let shakeIntensity = 0;

// Efek transisi boss
let bossIntroAlpha = 0;
let bossIntroActive = false;

// ===========================
// 🔹 ASSET & KONFIGURASI
// ===========================
const GOBLIN_SIZE = 200;
const BOSS_SCALE = 2.0;

const gobFrames = {
  green: loadFrames('gob'),
  red: loadFrames('red'),
  blue: loadFrames('blue'),
  purple: loadFrames('purple'),
  black: loadFrames('black')
};

// Boss animasi 6 frame
const bossFrames = {
  1: loadFrames('1boss1', 6),
  2: loadFrames('1boss2', 6)
};

// Helper load frame
function loadFrames(prefix, total = 4) {
  return Array.from({ length: total }, (_, i) => {
    const img = new Image();
    img.src = `assets/${prefix}${i + 1}.png`;
    img.onerror = () => console.warn(`⚠️ Gagal load ${img.src}`);
    return img;
  });
}

// ===========================
// 🔹 UPDATE ENEMY
// ===========================
export function updateEnemies() {
  if (playerHP() <= 0) {
    if (!gameOverTriggered) {
      resetEnemies(true);
      gameOverTriggered = true;
    }
    return;
  }

  spawnTimer++;
  const stage = getStage();

  if (stage !== lastStage) {
    if (stage < 6) resetEnemies(true);
    lastStage = stage;
  }

  if (stage === 6 && !bossSpawned && !boss) {
    spawnBoss();
  }

  if (spawnTimer > 100 && stage < 6 && !bossSpawned) {
    spawnTimer = 0;
    spawnEnemiesForStage(stage);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.frame = (e.frame + 0.2) % 4;
    e.y += e.speed;
    e.x += Math.sin(performance.now() / 200 + e.seed) * 0.5;

    if (e.y >= window.innerHeight * 0.75) {
      decreaseHP(e.damage);
      enemies.splice(i, 1);
    }
  }

  if (boss) updateBoss();
  updateSmoke();
  updateShake();
}

// ===========================
// 🔹 DRAW ENEMY
// ===========================
export function drawEnemies(ctx) {
  ctx.save();
  applyShake(ctx);

  for (let e of enemies) {
    const frame = Math.floor(e.frame);
    const img = gobFrames[e.type][frame];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, e.x, e.y, GOBLIN_SIZE, GOBLIN_SIZE);
    }

    const barWidth = GOBLIN_SIZE * 0.6;
    const barHeight = 8;
    const barX = e.x + (GOBLIN_SIZE - barWidth) / 2;
    const barY = e.y - 12;
    ctx.fillStyle = 'black';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    const hpP = e.hp / e.maxHp;
    ctx.fillStyle = hpP > 0.5 ? 'lime' : hpP > 0.25 ? 'yellow' : 'red';
    ctx.fillRect(barX, barY, barWidth * hpP, barHeight);
  }

  if (boss) {
    const frame = Math.floor(boss.frame);
    const img = bossFrames[boss.stage][frame];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, boss.x, boss.y, boss.width * BOSS_SCALE, boss.height * BOSS_SCALE);
    }
    drawBossHP(ctx);
  }

  drawSmoke(ctx);
  drawBossIntro(ctx);
  ctx.restore();
}

// ===========================
// 🔹 HIT DETEKSI
// ===========================
export function hitEnemy(x, y, damage = 1) {
  if (playerHP() <= 0) return false;

  for (let e of enemies) {
    if (x > e.x && x < e.x + GOBLIN_SIZE && y > e.y && y < e.y + GOBLIN_SIZE) {
      e.hp -= damage;
      if (e.hp <= 0) {
        spawnSmoke(e.x + GOBLIN_SIZE / 2, e.y + GOBLIN_SIZE / 2);
        enemies.splice(enemies.indexOf(e), 1);
        increaseKillCount();
        shakeIntensity = 5;
      }
      return true;
    }
  }

  if (boss && pointInBoss(x, y)) {
    boss.hp -= damage;
    if (boss.hp <= 0) {
      spawnSmoke(boss.x + boss.width / 2, boss.y + boss.height / 2);
      if (boss.stage === 1) nextBossStage();
      else {
        // 🎬 Boss benar-benar kalah → video tamat
        boss = null;
        showEndingVideo();
      }
      shakeIntensity = 8;
    }
    return true;
  }

  return false;
}

// ===========================
// 🔹 DAMAGE AREA
// ===========================
export function damageEnemiesInArea(x, y, radius, damage) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dx = e.x + GOBLIN_SIZE / 2 - x;
    const dy = e.y + GOBLIN_SIZE / 2 - y;
    if (Math.hypot(dx, dy) < radius) {
      e.hp -= damage;
      if (e.hp <= 0) {
        spawnSmoke(e.x + GOBLIN_SIZE / 2, e.y + GOBLIN_SIZE / 2);
        enemies.splice(i, 1);
        increaseKillCount();
      }
    }
  }

  if (boss) {
    const bx = boss.x + boss.width / 2 - x;
    const by = boss.y + boss.height / 2 - y;
    if (Math.hypot(bx, by) < radius) {
      boss.hp -= damage;
      if (boss.hp <= 0) {
        spawnSmoke(boss.x + boss.width / 2, boss.y + boss.height / 2);
        if (boss.stage === 1) nextBossStage();
        else {
          boss = null;
          showEndingVideo();
        }
      }
    }
  }
}

// ===========================
// 🔹 BOSS SECTION
// ===========================
function spawnBoss() {
  bossSpawned = true;
  bossIntroActive = true;
  bossIntroAlpha = 1;

  boss = {
    stage: 1,
    frame: 0,
    frameTimer: 0,
    x: window.innerWidth / 2 - 220, // geser ke kiri
    y: 80,
    width: 300,
    height: 300,
    hp: 40,
    maxHp: 40,
    attackTimer: 0
  };

  enemies = [];
  console.log('🧿 Boss muncul!');
}

function updateBoss() {
  if (!boss) return;

  boss.frameTimer++;
  const frameDelay = (boss.frame === 4 || boss.frame === 5) ? 14 : 6;
  if (boss.frameTimer >= frameDelay) {
    boss.frame = (boss.frame + 1) % 6;
    boss.frameTimer = 0;
  }

  boss.y += Math.sin(performance.now() / 500) * 0.4;

  boss.attackTimer++;
  if (boss.attackTimer > 180) {
    boss.attackTimer = 0;
    const act = Math.random();
    if (boss.stage === 1) {
      act < 0.7 ? summonEnemiesFromStage(3, 3) : castMeteor(5);
    } else {
      act < 0.5 ? summonEnemiesFromStage(5, 3) : castMeteor(7);
    }
  }

  if (bossIntroActive) {
    bossIntroAlpha -= 0.01;
    if (bossIntroAlpha <= 0) bossIntroActive = false;
  }
}

function drawBossIntro(ctx) {
  if (!bossIntroActive) return;
  ctx.save();
  ctx.globalAlpha = bossIntroAlpha;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.fillStyle = 'gold';
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('⚔️ BOSS STAGE ⚔️', window.innerWidth / 2, window.innerHeight / 2);
  ctx.restore();
}

function castMeteor(dmg) {
  if (!boss) return;
  decreaseHP(dmg);
  shakeIntensity = 8;
  spawnSmoke(
    window.innerWidth / 2 + (Math.random() - 0.5) * 200,
    window.innerHeight * 0.6 + Math.random() * 100
  );
}

function summonEnemiesFromStage(stage, count) {
  const typePool = { 3: ['blue'], 5: ['black'] }[stage] || ['green'];
  for (let i = 0; i < count; i++) {
    const type = typePool[Math.floor(Math.random() * typePool.length)];
    const baseHP = stage + 2;
    enemies.push({
      type,
      x: Math.random() * (window.innerWidth - GOBLIN_SIZE),
      y: -GOBLIN_SIZE,
      speed: 2 + Math.random(),
      frame: 0,
      hp: baseHP,
      maxHp: baseHP,
      damage: 2 + stage * 0.5,
      seed: Math.random() * 1000
    });
  }
}

function nextBossStage() {
  boss.stage = 2;
  boss.hp = 70;
  boss.maxHp = 70;
  boss.attackTimer = 0;
  console.log('🔥 Boss naik ke Stage 2!');
}

function drawBossHP(ctx) {
  const barWidth = 400, barHeight = 16;
  const barX = window.innerWidth / 2 - barWidth / 2;
  const barY = 40;

  ctx.fillStyle = 'black';
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

  const hpP = boss.hp / boss.maxHp;
  ctx.fillStyle = hpP > 0.5 ? 'lime' : hpP > 0.25 ? 'yellow' : 'red';
  ctx.fillRect(barX, barY, barWidth * hpP, barHeight);

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Boss HP: ${boss.hp}`, barX + 140, barY - 10);
}

function pointInBoss(x, y) {
  return boss && x > boss.x && x < boss.x + boss.width * BOSS_SCALE &&
         y > boss.y && y < boss.y + boss.height * BOSS_SCALE;
}

// ===========================
// 🔹 VIDEO TAMAT 🎬
// ===========================
function showEndingVideo() {
  cancelAnimationFrame(window.gameLoopId);

  // Fade out canvas
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'black';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 1s';
  overlay.style.zIndex = '9998';
  document.body.appendChild(overlay);
  requestAnimationFrame(() => (overlay.style.opacity = '1'));

  setTimeout(() => {
    const video = document.createElement('video');
    video.src = 'assets/tamat.mp4';
    video.autoplay = true;
    video.controls = true;
    video.style.position = 'fixed';
    video.style.top = '50%';
    video.style.left = '50%';
    video.style.transform = 'translate(-50%, -50%)';
    video.style.width = '80vw';
    video.style.height = 'auto';
    video.style.zIndex = '9999';
    video.style.borderRadius = '20px';
    document.body.appendChild(video);

    video.addEventListener('ended', () => {
      video.remove();
      overlay.remove();
      location.reload();
    });
  }, 1000);
}

// ===========================
// 🔹 SMOKE & SHAKE
// ===========================
function spawnSmoke(x, y) {
  for (let i = 0; i < 15; i++) {
    smokeParticles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      size: 20 + Math.random() * 40,
      alpha: 1,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2,
      color: `rgba(${200 + Math.random() * 55},${200 + Math.random() * 55},${200 + Math.random() * 55},`
    });
  }
}

function updateSmoke() {
  for (let s of smokeParticles) {
    s.x += s.vx;
    s.y += s.vy;
    s.alpha -= 0.02;
    s.size += 0.4;
  }
  smokeParticles = smokeParticles.filter(s => s.alpha > 0);
}

function drawSmoke(ctx) {
  for (let s of smokeParticles) {
    ctx.save();
    ctx.globalAlpha = s.alpha;
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
    grad.addColorStop(0, `${s.color}0.8)`);
    grad.addColorStop(1, `${s.color}0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function applyShake(ctx) {
  if (shakeIntensity > 0) {
    ctx.translate(
      (Math.random() - 0.5) * shakeIntensity,
      (Math.random() - 0.5) * shakeIntensity
    );
  }
}

function updateShake() {
  if (shakeIntensity > 0) shakeIntensity *= 0.9;
}

// ===========================
// 🔹 SPAWN & RESET
// ===========================
function spawnEnemiesForStage(stage) {
  const typePool = {
    1: ['green'],
    2: ['red'],
    3: ['blue'],
    4: ['purple'],
    5: ['black']
  }[stage] || [];

  if (!typePool.length) return;

  const chance = Math.random();
  const count = chance < 0.1 ? 3 : chance < 0.4 ? 2 : 1;

  for (let i = 0; i < count; i++) {
    const type = typePool[Math.floor(Math.random() * typePool.length)];
    const baseHP = stage + (type === 'black' ? 2 : 0);
    enemies.push({
      type,
      x: Math.random() * (window.innerWidth - GOBLIN_SIZE),
      y: -GOBLIN_SIZE,
      speed: 1.5 + stage * 0.3 + Math.random(),
      frame: 0,
      hp: baseHP,
      maxHp: baseHP,
      damage: 1 + stage * 0.5,
      seed: Math.random() * 1000
    });
  }
}

function resetEnemies(keepBoss = false) {
  enemies = [];
  spawnTimer = 0;
  smokeParticles = [];
  gameOverTriggered = false;
  shakeIntensity = 0;
  if (!keepBoss) {
    bossSpawned = false;
    boss = null;
  }
}

// ===========================
// 🔹 EXPORT
// ===========================
export function getEnemies() {
  return enemies;
}

export { spawnBoss, resetEnemies };