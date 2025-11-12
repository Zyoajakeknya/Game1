// scripts/ui.js
import { getEnemies } from './enemy.js';

let hp = 15;
let kills = 0;
let stage = 1;
const killsPerStage = 10;

// Load assets aman (tanpa bikin macet)
const gameOverImg = new Image();
gameOverImg.src = 'assets/kalah.png';

const gameOverSound = new Audio();
gameOverSound.src = 'assets/kalah.mp3';

const stageUpSound = new Audio();
stageUpSound.src = 'assets/stageup.mp3';

let assetsLoaded = false;

// Tunggu semua asset ready
Promise.all([
  new Promise(res => (gameOverImg.onload = res)),
  new Promise(res => (gameOverSound.oncanplaythrough = res)),
  new Promise(res => (stageUpSound.oncanplaythrough = res))
]).then(() => {
  assetsLoaded = true;
  console.log('✅ Assets siap dimainkan');
}).catch(() => {
  console.warn('⚠️ Gagal load beberapa assets, lanjut main aja...');
  assetsLoaded = true;
});

export function drawUI(ctx) {
  ctx.fillStyle = 'red';
  ctx.fillRect(30, 30, hp * 20, 20);
  ctx.strokeStyle = 'black';
  ctx.strokeRect(30, 30, 300, 20);

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`HP: ${hp}`, 30, 25);
  ctx.fillText(`Kill: ${kills}`, 30, 70);
  ctx.fillText(`Stage: ${stage}`, 30, 110);
}

export function decreaseHP(amount) {
  if (!assetsLoaded) return; // jangan lanjut kalau asset belum siap
  hp -= amount;
  if (hp <= 0) {
    hp = 0;
    showGameOver();
  }
}

export function increaseKillCount() {
  kills++;
  if (kills % killsPerStage === 0 && stage < 6) {
    stage++;
    try {
      stageUpSound.currentTime = 0;
      stageUpSound.play();
    } catch {}
    alert(`🔥 Stage ${stage} dimulai!`);
  }
}

export function getKillCount() {
  return kills;
}

export function getStage() {
  return stage;
}

export function playerHP() {
  return hp;
}

// =======================
// 💀 Efek KALAH + JUMPSCARE 💀
// =======================
function showGameOver() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // 1️⃣ Bersihkan semua musuh
  const enemies = getEnemies();
  enemies.length = 0;

  // 2️⃣ Stop animasi
  cancelAnimationFrame(window.gameLoopId);

  // 3️⃣ Flash putih dulu
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 4️⃣ Mainkan suara jumpscare
  try {
    gameOverSound.currentTime = 0;
    gameOverSound.play();
  } catch {}

  // 5️⃣ Efek layar getar (shake)
  let shakeTime = 600; // ms
  const start = performance.now();

  function shake() {
    const now = performance.now();
    const elapsed = now - start;
    if (elapsed < shakeTime) {
      const dx = (Math.random() - 0.5) * 40;
      const dy = (Math.random() - 0.5) * 40;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(dx, dy);
      ctx.drawImage(gameOverImg, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      requestAnimationFrame(shake);
    } else {
      // 6️⃣ Setelah shake, tampilkan gambar kalah fix
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(gameOverImg, 0, 0, canvas.width, canvas.height);
    }
  }

  setTimeout(() => {
    shake();
  }, 200);

  // 7️⃣ Reload ulang setelah 3 detik
  setTimeout(() => {
    location.reload();
  }, 3000);
}