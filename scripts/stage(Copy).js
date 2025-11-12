// scripts/stage.js
import { spawnEnemiesSet, spawnBoss } from './enemy.js';

export let currentStage = 1;
export let bossMode = false;

// Set tiap stage: warna, HP, kecepatan, dan spawn rate
const stageData = {
  1: { type: 'green',  enemyHP: 1, speed: 2,   spawnRate: 100 },
  2: { type: 'red',    enemyHP: 2, speed: 2.5, spawnRate: 90  },
  3: { type: 'dark',   enemyHP: 3, speed: 3,   spawnRate: 80  },
  4: { type: 'shadow', enemyHP: 4, speed: 3.5, spawnRate: 70  },
  5: { type: 'elite',  enemyHP: 5, speed: 4,   spawnRate: 60  },
  6: { type: 'boss' } // boss khusus, tidak spawn musuh biasa
};

export function getStageData() {
  return stageData[currentStage];
}

export function nextStage() {
  // Naik stage sampai 6
  if (currentStage < 6) {
    currentStage++;
    console.log(`🎯 Naik ke Stage ${currentStage}`);

    if (currentStage < 6) {
      spawnEnemiesSet(getStageData());
    } else if (currentStage === 6 && !bossMode) {
      bossMode = true;
      console.log("🔥 Stage 6 dimulai! Boss muncul!");
      spawnBoss();
    }
  }
}