// scripts/bow.js
import { hitEnemy } from './enemy.js';

let canvas, ctx;

// ====== Gambar utama ======
const bowImg = new Image();
const arrowImg = new Image();
const ultiImg = new Image();

bowImg.src = 'assets/bow.png';
arrowImg.src = 'assets/panah.png';
ultiImg.src = 'assets/ulti/ulti.png';

// ====== Suara ======
const shootSound = new Audio('assets/sound/shoot.mp3');
const boomSound = new Audio('assets/sound/boom.mp3');

// ====== Variabel utama ======
const bow = {
  x: 640,
  y: 300,
  width: 200,
  height: 200,
  angle: 0
};

const arrows = [];
const explosions = [];

let lastShotTime = 0;
const SHOT_COOLDOWN = 100; // ms

// ====== Status ======
let skill1Active = false;  // Multi arrow
let arrowMode = null;      // Mode ulti

// ==================================================
export function initBow(c, startPos = { x: 640, y: 300 }) {
  canvas = c;
  ctx = canvas.getContext('2d');
  bow.x = startPos.x;
  bow.y = startPos.y;
}

// ==================================================
export function updateBow(targetX, targetY) {
  if (targetX == null || targetY == null) return;
  const dx = targetX - bow.x;
  const dy = targetY - bow.y;
  bow.angle = Math.atan2(dy, dx);
}

// ==================================================
export function drawBow(ctx) {
  ctx.save();
  ctx.translate(bow.x, bow.y);
  ctx.rotate(bow.angle);

  // ✨ Efek aura saat ulti aktif
  if (arrowMode) {
    const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, 120);
    grad.addColorStop(0, 'rgba(255,215,0,0.5)');
    grad.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 120, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.drawImage(bowImg, -bow.width / 2, -bow.height / 2, bow.width, bow.height);
  ctx.restore();
}

// ==================================================
export function activateSkill1() {
  skill1Active = true;
  setTimeout(() => (skill1Active = false), 5000);
}

// ==================================================
export function setArrowMode(mode) {
  arrowMode = mode;
}

// ==================================================
export function shootArrow() {
  const now = Date.now();
  if (now - lastShotTime < SHOT_COOLDOWN) return;
  lastShotTime = now;

  const speed = arrowMode ? arrowMode.speed : 18;
  const baseDamage = arrowMode ? 3 : 1; // ✅ Ulti = 3 dmg, biasa = 1 dmg

  // Skill 1 aktif → multi arrow
  if (skill1Active && !arrowMode) {
    for (let i = -1; i <= 1; i++) {
      const angleOffset = bow.angle + i * 0.15;
      const vx = Math.cos(angleOffset) * speed;
      const vy = Math.sin(angleOffset) * speed;
      arrows.push(createArrow(vx, vy, baseDamage, false));
    }
  } else {
    const vx = Math.cos(bow.angle) * speed;
    const vy = Math.sin(bow.angle) * speed;
    arrows.push(createArrow(vx, vy, baseDamage, !!arrowMode));
  }

  // 🔊 Suara
  playSound(shootSound, arrowMode ? 1.0 : 0.6);
}

// ==================================================
function createArrow(vx, vy, damage, isUlti) {
  const now = Date.now();
  return {
    x: bow.x,
    y: bow.y,
    vx,
    vy,
    damage,
    w: isUlti ? 160 : 100,
    h: isUlti ? 60 : 40,
    color: isUlti ? 'gold' : 'white',
    isUlti,
    area: isUlti ? 300 : 0,
    lifetime: isUlti ? 1200 : 0,
    spawnTime: now
  };
}

// ==================================================
export function updateArrows() {
  const now = Date.now();

  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.x += a.vx;
    a.y += a.vy;

    // Ulti meledak karena waktu habis
    if (a.isUlti && now - a.spawnTime > a.lifetime) {
      explodeArrow(a);
      arrows.splice(i, 1);
      continue;
    }

    // Kena musuh
    if (hitEnemy(a.x, a.y, a.damage)) {
      if (a.isUlti) explodeArrow(a);
      arrows.splice(i, 1);
      continue;
    }

    // Keluar layar
    if (a.x < -200 || a.y < -200 || a.x > canvas.width + 200 || a.y > canvas.height + 200) {
      arrows.splice(i, 1);
    }
  }

  // Efek ledakan
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    e.radius += 25;
    e.alpha -= 0.04;
    if (e.alpha <= 0) explosions.splice(i, 1);
  }
}

// ==================================================
export function drawArrows(ctx) {
  for (let a of arrows) {
    const angle = Math.atan2(a.vy, a.vx);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(angle);
    ctx.shadowBlur = 20;
    ctx.shadowColor = a.color;

    const img = a.isUlti ? ultiImg : arrowImg;
    ctx.drawImage(img, -a.w / 2, -a.h / 2, a.w, a.h);

    // 🔥 Ekor aura ulti
    if (a.isUlti) {
      const grad = ctx.createLinearGradient(-a.w / 2, 0, a.w / 2, 0);
      grad.addColorStop(0, 'rgba(255,200,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(-a.w / 2 - 50, -a.h / 4, a.w / 2, a.h / 2);
    }

    ctx.restore();
  }

  // 💥 Efek ledakan
  for (let e of explosions) {
    ctx.save();
    ctx.globalAlpha = e.alpha;
    const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
    grad.addColorStop(0, 'rgba(255,240,120,0.9)');
    grad.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ==================================================
// 💥 Ledakan ulti
function explodeArrow(a) {
  hitEnemy(a.x, a.y, a.damage, a.area); // 💣 tidak dikali 3, damage asli = 3
  explosions.push({
    x: a.x,
    y: a.y,
    radius: 0,
    alpha: 1
  });
  playSound(boomSound, 0.8);
}

// ==================================================
function playSound(audio, volume = 1) {
  try {
    if (audio.readyState >= 2) {
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play();
    }
  } catch (e) {}
}