// scripts/ultimate.js
import { getEnemies, hitEnemy } from './enemy.js';
import { playerHP } from './ui.js';
import { shootArrow, setArrowMode } from './bow.js';

let canvas, ctx;

const ultiSound = new Audio('assets/ulti/ulti.mp3');

const ULTI_COOLDOWN = 10000;
const ULTI_DAMAGE = 3; // damage area lebih besar
const ULTI_RADIUS = 3000; // 💥 radius area ledakan sama seperti meteor
let lastUltiTime = 0;
let ultiActive = false;

export function initUltimate(c) {
  canvas = c;
  ctx = canvas.getContext('2d');

  createUltiButton('assets/ulti/icon.png', '40px', '220px', activateUltimate, ULTI_COOLDOWN);

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') activateUltimate();
  });
}

function createUltiButton(imgPath, right, bottom, onClick, cooldown) {
  const btn = document.createElement('div');
  Object.assign(btn.style, {
    position: 'fixed',
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    border: '3px solid gold',
    boxShadow: '0 0 25px gold',
    background: `url("${imgPath}") center/cover no-repeat, radial-gradient(circle at center, #ffb700, #ff8800)`,
    right,
    bottom,
    cursor: 'pointer',
    zIndex: 9999,
    overflow: 'hidden',
  });

  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '0%',
    background: 'rgba(0,0,0,0.6)',
    transition: 'height 0.1s linear',
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

// ⚡ Ultimate dengan damage area
export function activateUltimate() {
  if (playerHP() <= 0 || ultiActive) return;
  const now = Date.now();
  if (now - lastUltiTime < ULTI_COOLDOWN) return;

  ultiActive = true;
  lastUltiTime = now;

  ultiSound.currentTime = 0;
  ultiSound.play().catch(() => {});

  // Mode panah besar dulu
  setArrowMode({
    image: 'assets/ulti/ulti.png',
    speed: 30,
    size: { w: 180, h: 100 },
    damage: ULTI_DAMAGE,
    onHit: (x, y) => {
      // 💥 saat kena sesuatu, ledak & damage area
      createUltiExplosion(x, y);
      dealUltimateAreaDamage(x, y);
      screenShake(20, 600);
    },
  });

  // langsung tembak satu panah ulti
  shootArrow();

  setTimeout(() => {
    setArrowMode(null);
    ultiActive = false;
  }, 2000);
}

// 💥 bikin efek ledakan
function createUltiExplosion(x, y) {
  const img = new Image();
  img.src = 'assets/ulti/ulti.png';
  img.onload = () => {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.drawImage(img, x - 100, y - 100, 200, 200);
    ctx.restore();
  };
}

// 💢 damage area
function dealUltimateAreaDamage(x, y) {
  const enemies = getEnemies();
  enemies.forEach(enemy => {
    const dist = Math.hypot(enemy.x - x, enemy.y - y);
    if (dist < ULTI_RADIUS) {
      hitEnemy(enemy, ULTI_DAMAGE, 'ultimate');
    }
  });
}

// efek getar layar
function screenShake(intensity = 10, duration = 400) {
  const start = performance.now();
  const original = { x: window.scrollX, y: window.scrollY };

  function shake(now) {
    const elapsed = now - start;
    if (elapsed >= duration) {
      window.scrollTo(original.x, original.y);
      return;
    }

    const dx = (Math.random() - 0.5) * intensity;
    const dy = (Math.random() - 0.5) * intensity;
    window.scrollTo(original.x + dx, original.y + dy);

    requestAnimationFrame(shake);
  }
  requestAnimationFrame(shake);
}