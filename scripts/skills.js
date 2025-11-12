// scripts/skills.js
import { getEnemies, hitEnemy } from './enemy.js';
import { playerHP } from './ui.js';

let canvas, ctx;

// 🎯 Skill 1: Multi Shot (auto tembak banyak panah)
let skill1Active = false;
let lastSkill1 = 0;
const SKILL1_CD = 8000;
const MULTI_SHOT_DURATION = 50;
const MULTI_SHOT_INTERVAL = 180;

// ☄️ Skill 2: Meteor Drop (area damage)
let lastSkill2 = 0;
const SKILL2_CD = 8000;
const METEOR_RADIUS = 2050;
const METEOR_DAMAGE = 5;

// 🔊 Audio
const skill1Sound = new Audio('assets/skill1.mp3');
const skill2Sound = new Audio('assets/skill2.mp3');
const explosionSound = new Audio('assets/sound/boom.mp3'); // optional

// 🔥 Meteor Image
const meteorImg = new Image();
meteorImg.src = 'assets/meteor.png';

// 🧠 Inisialisasi tombol skill
export function initSkills(c) {
  canvas = c;
  ctx = canvas.getContext('2d');

  createSkillButton('skill1', 'assets/skill1.png', '160px', '40px', activateSkill1, SKILL1_CD);
  createSkillButton('skill2', 'assets/skill2.png', '90px', '120px', activateSkill2, SKILL2_CD);

  // Keyboard shortcut
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'q') activateSkill1();
    if (e.key.toLowerCase() === 'e') activateSkill2();
  });
}

// 🔘 Style tombol skill
function circleButtonStyle() {
  return {
    position: 'fixed',
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.3)',
    boxShadow: '0 0 15px rgba(255,255,255,0.3)',
    backgroundColor: '#222',
    cursor: 'pointer',
    zIndex: 9999,
    overflow: 'hidden',
    backdropFilter: 'blur(5px)',
  };
}

// 🔘 Tombol skill + overlay cooldown
function createSkillButton(id, imgPath, right, bottom, onClick, cooldown) {
  const btn = document.createElement('div');
  Object.assign(btn.style, circleButtonStyle());
  btn.style.right = right;
  btn.style.bottom = bottom;
  btn.style.background = `url("${imgPath}") center/cover no-repeat`;
  btn.id = id;

  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.6)',
    transition: 'height 0.1s linear',
    height: '0%',
    pointerEvents: 'none',
  });
  btn.appendChild(overlay);

  btn.addEventListener('click', () => {
    if (overlay.dataset.cooling === 'true') return;
    onClick();
    startCooldown(overlay, cooldown);
  });

  document.body.appendChild(btn);
}

function startCooldown(overlay, duration) {
  overlay.dataset.cooling = 'true';
  overlay.style.height = '100%';
  const start = Date.now();

  const tick = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    overlay.style.height = `${100 - progress * 100}%`;

    if (progress < 1) requestAnimationFrame(tick);
    else {
      overlay.dataset.cooling = 'false';
      overlay.style.height = '0%';
    }
  };
  tick();
}

// ======================================================
// 🎯 SKILL 1 — MULTI ARROW (tembakan acak cepat ke semua musuh)
// ======================================================
export function activateSkill1() {
  const now = Date.now();
  if (playerHP() <= 0 || skill1Active || now - lastSkill1 < SKILL1_CD) return;

  skill1Active = true;
  lastSkill1 = now;
  skill1Sound.play().catch(() => {});

  const startTime = Date.now();
  function multiShoot() {
    const elapsed = Date.now() - startTime;
    if (elapsed > MULTI_SHOT_DURATION) {
      skill1Active = false;
      return;
    }

    const enemies = getEnemies();
    if (enemies.length > 0) {
      for (const e of enemies) {
        const ex = e.x + 100 + (Math.random() * 40 - 20);
        const ey = e.y + 100 + (Math.random() * 30 - 15);

        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height - 150);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = `rgba(255, ${200 + Math.random() * 55}, 120, 0.7)`;
        ctx.lineWidth = 2 + Math.random() * 2;
        ctx.stroke();

        hitEnemy(ex, ey, 10);
      }
    }

    setTimeout(() => requestAnimationFrame(multiShoot), MULTI_SHOT_INTERVAL);
  }

  multiShoot();
}

// ======================================================
// ☄️ SKILL 2 — METEOR STRIKE (jatuh dari langit + ledakan area)
// ======================================================
export function activateSkill2() {
  const now = Date.now();
  if (playerHP() <= 0 || now - lastSkill2 < SKILL2_CD) return;

  lastSkill2 = now;
  skill2Sound.play().catch(() => {});

  const x = Math.random() * (canvas.width * 0.8) + 100;
  const targetY = Math.random() * (canvas.height * 0.5) + 150;
  let y = -300;
  let size = 100;

  // Tampilkan area warning sebelum meteor jatuh
  drawWarningCircle(x, targetY, METEOR_RADIUS);

  setTimeout(() => {
    function fallMeteor() {
      // efek api di belakang meteor
      const trailGrad = ctx.createLinearGradient(x, y, x, y - 100);
      trailGrad.addColorStop(0, 'rgba(255,120,0,0.8)');
      trailGrad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = trailGrad;
      ctx.fillRect(x - 20, y - 100, 40, 100);

      ctx.drawImage(meteorImg, x - size / 2, y - size / 2, size, size);
      y += 25;
      size += 1.5;

      if (y >= targetY) {
        explodeMeteor(x, targetY);
        return;
      }
      requestAnimationFrame(fallMeteor);
    }
    fallMeteor();
  }, 800); // delay dikit biar warning keliatan
}

// 🔴 Area warning
function drawWarningCircle(x, y, radius) {
  let alpha = 0.8;
  function pulse() {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,50,50,0.7)';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
    alpha -= 0.05;
    if (alpha > 0) requestAnimationFrame(pulse);
  }
  pulse();
}

// 💥 Efek ledakan meteor + damage area
function explodeMeteor(x, y) {
  if (explosionSound.readyState >= 2) {
    explosionSound.currentTime = 0;
    explosionSound.play().catch(() => {});
  }

  const enemies = getEnemies();
  for (const e of enemies) {
    const ex = e.x + 100;
    const ey = e.y + 100;
    const dist = Math.hypot(ex - x, ey - y);
    if (dist < METEOR_RADIUS) hitEnemy(ex, ey, METEOR_DAMAGE);
  }

  // Efek ledakan cahaya
  let radius = 60;
  let alpha = 1;

  function explosion() {
    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, 'yellow');
    grad.addColorStop(0.4, 'orange');
    grad.addColorStop(1, 'red');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    radius += 15;
    alpha -= 0.05;

    if (alpha > 0) requestAnimationFrame(explosion);
  }
  explosion();
}