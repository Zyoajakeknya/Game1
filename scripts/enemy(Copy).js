// scripts/enemy.js
import { playerHP, decreaseHP, increaseKillCount, getKillCount, getStage } from './ui.js';

const enemies = [];
let spawnTimer = 0;
let bossSpawned = false;
let boss = null;

// ====== ATURAN SKALA MUSUH ======
const GOBLIN_SIZE = 150;
const BOSS_SCALE = 1.4;

// ====== LOAD ANIMASI MUSUH ======
const gobGreenFrames = [1, 2, 3, 4].map(i => {
  const img = new Image();
  img.src = `assets/gob${i}.png`;
  return img;
});
const gobRedFrames = [1, 2, 3, 4].map(i => {
  const img = new Image();
  img.src = `assets/red${i}.png`;
  return img;
});
const gobBlueFrames = [1, 2, 3, 4].map(i => {
  const img = new Image();
  img.src = `assets/blue${i}.png`;
  return img;
});
const gobPurpleFrames = [1, 2, 3, 4].map(i => {
  const img = new Image();
  img.src = `assets/purple${i}.png`;
  return img;
});
const gobBlackFrames = [1, 2, 3, 4].map(i => {
  const img = new Image();
  img.src = `assets/black${i}.png`;
  return img;
});

// ====== BOSS SPRITE ======
const boss1 = new Image();
boss1.src = 'assets/boss1.png';
const boss2 = new Image();
boss2.src = 'assets/boss2.png';

export function updateEnemies() {
  spawnTimer++;

  const stage = getStage();

  // Spawn musuh sesuai stage
  if (spawnTimer > 100 && !bossSpawned) {
    spawnTimer = 0;

    let typePool = [];
    switch (stage) {
      case 1: typePool = ['green']; break;
      case 2: typePool = ['red']; break;
      case 3: typePool = ['blue']; break;
      case 4: typePool = ['purple']; break;
      case 5: typePool = ['black']; break;
      default: typePool = [];
    }

    if (typePool.length > 0) {
      const chance = Math.random();
      let count = 1;
      if (chance < 0.1) count = 3;
      else if (chance < 0.4) count = 2;

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
          damage: 1 + stage * 0.5
        });
      }
    }
  }

  // Update posisi dan animasi
  for (let e of enemies) {
    e.frame = (e.frame + 0.2) % 4;
    e.y += e.speed;

    if (e.y >= window.innerHeight * 0.75) {
      decreaseHP(e.damage);
      enemies.splice(enemies.indexOf(e), 1);
    }
  }

  // === CEK BOSS ===
  if (stage === 6 && !bossSpawned) {
    spawnBoss();
  }

  if (boss) updateBoss();
}

export function drawEnemies(ctx) {
  for (let e of enemies) {
    const frame = Math.floor(e.frame);
    let img;
    switch (e.type) {
      case 'green': img = gobGreenFrames[frame]; break;
      case 'red': img = gobRedFrames[frame]; break;
      case 'blue': img = gobBlueFrames[frame]; break;
      case 'purple': img = gobPurpleFrames[frame]; break;
      case 'black': img = gobBlackFrames[frame]; break;
    }
    ctx.drawImage(img, e.x, e.y, GOBLIN_SIZE, GOBLIN_SIZE);

    // === HEALTH BAR MUSUH ===
    const barWidth = GOBLIN_SIZE * 0.6;
    const barHeight = 8;
    const barX = e.x + (GOBLIN_SIZE - barWidth) / 2;
    const barY = e.y - 12;

    ctx.fillStyle = 'black';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    const healthPercent = e.hp / e.maxHp;
    ctx.fillStyle = healthPercent > 0.5 ? 'lime' : healthPercent > 0.25 ? 'yellow' : 'red';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  }

  // === BOSS ===
  if (boss) {
    ctx.drawImage(
      boss.img,
      boss.x,
      boss.y,
      boss.width * BOSS_SCALE,
      boss.height * BOSS_SCALE
    );

    // Health bar boss di atas
    const barWidth = 400;
    const barHeight = 16;
    const barX = window.innerWidth / 2 - barWidth / 2;
    const barY = 40;

    ctx.fillStyle = 'black';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    const healthPercent = boss.hp / boss.maxHp;
    ctx.fillStyle = healthPercent > 0.5 ? 'lime' : healthPercent > 0.25 ? 'yellow' : 'red';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Boss HP: ${boss.hp}`, barX + 140, barY - 10);
  }
}

export function hitEnemy(arrowX, arrowY) {
  for (let e of enemies) {
    if (
      arrowX > e.x &&
      arrowX < e.x + GOBLIN_SIZE &&
      arrowY > e.y &&
      arrowY < e.y + GOBLIN_SIZE
    ) {
      e.hp--;
      if (e.hp <= 0) {
        increaseKillCount();
        enemies.splice(enemies.indexOf(e), 1);
      }
      return true;
    }
  }

  if (boss) {
    if (
      arrowX > boss.x &&
      arrowX < boss.x + boss.width * BOSS_SCALE &&
      arrowY > boss.y &&
      arrowY < boss.y + boss.height * BOSS_SCALE
    ) {
      boss.hp--;
      if (boss.hp <= 0) {
        if (boss.stage === 1) nextBossStage();
        else boss = null;
      }
      return true;
    }
  }

  return false;
}

function spawnBoss() {
  bossSpawned = true;
  boss = {
    stage: 1,
    img: boss1,
    x: window.innerWidth / 2 - 150,
    y: 80,
    width: 300,
    height: 300,
    hp: 40,
    maxHp: 40,
    attackTimer: 0
  };
}

function updateBoss() {
  boss.attackTimer++;
  if (boss.attackTimer > 180) {
    boss.attackTimer = 0;
    const damage = boss.stage === 1 ? (5 + Math.random() * 2) : 12;
    decreaseHP(damage);
  }
}

function nextBossStage() {
  boss.stage = 2;
  boss.img = boss2;
  boss.hp = 70;
  boss.maxHp = 70;
}