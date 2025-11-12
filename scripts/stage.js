// 📜 scripts/stage.js
// ==========================
// 🔥 Sistem Stage & Boss
// ==========================

import { resetEnemies, spawnEnemiesSet, spawnBoss } from './enemy.js';

export let currentStage = 1;
export let bossMode = false;

// ==========================
// 🎯 DATA SETIAP STAGE
// ==========================
const stageData = {
  1: { type: 'green',  enemyHP: 1, speed: 2.0, spawnRate: 100 },
  2: { type: 'red',    enemyHP: 2, speed: 2.5, spawnRate: 90  },
  3: { type: 'blue',   enemyHP: 3, speed: 3.0, spawnRate: 80  },
  4: { type: 'purple', enemyHP: 4, speed: 3.5, spawnRate: 70  },
  5: { type: 'black',  enemyHP: 5, speed: 4.0, spawnRate: 60  },
  6: { type: 'boss' } // Stage boss spesial
};

// ==========================
// ⚙️ FUNGSI GETTER
// ==========================
export function getStageData() {
  return stageData[currentStage];
}

// ==========================
// 🚀 GANTI STAGE
// ==========================
export function nextStage() {
  // Pastikan stage belum mentok
  if (currentStage >= 6) return;

  currentStage++;
  console.log(`🎯 Naik ke Stage ${currentStage}`);

  // Reset musuh setiap naik stage
  resetEnemies();

  // Kalau masih stage biasa
  if (currentStage < 6) {
    const data = getStageData();
    console.log(`🟢 Spawn musuh stage ${currentStage} (${data.type})`);
    spawnEnemiesSet(data);

  // Kalau sudah sampai stage boss
  } else if (!bossMode) {
    bossMode = true;
    console.log("🔥 Stage 6 dimulai! Boss muncul!");
    spawnBoss();
  }
}

// ==========================
// 🔄 RESET STAGE (opsional)
// ==========================
export function resetStage() {
  currentStage = 1;
  bossMode = false;
  resetEnemies();
  console.log("🔁 Stage direset ke Stage 1.");
}