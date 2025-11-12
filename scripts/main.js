import { initBow, updateBow, drawBow, shootArrow, drawArrows, updateArrows } from './bow.js';
import { updateEnemies, drawEnemies, getEnemies } from './enemy.js';
import { drawUI, playerHP } from './ui.js';
import { initUltimate } from './ultimate.js';
import { initSkills } from './skills.js'; // 🆕 Tambahin ini

export function initGame() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const background = new Image();
  background.src = 'assets/background.png';

  let inMenu = true;
  let gameRunning = false;
  let gameLoopId = null;

  const startButton = {
    x: canvas.width / 2 - 120,
    y: canvas.height / 2 - 50,
    width: 240,
    height: 100
  };

  function drawMenu() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 60px Poppins, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText('Defend The Smanten', canvas.width / 2, canvas.height / 2 - 150);

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(startButton.x, startButton.y, startButton.width, startButton.height, 15);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 40px Poppins, sans-serif';
    ctx.fillText('START GAME', canvas.width / 2, canvas.height / 2 + 20);

    ctx.textAlign = 'left';
    ctx.font = '20px Poppins, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('Developer: Verdy', 30, canvas.height - 250);
    ctx.fillText('Ide: Zikri & Rizky', 30, canvas.height - 220);
    ctx.fillText('Aktor: Adrian', 30, canvas.height - 190);

    ctx.textAlign = 'right';
    ctx.fillText('Kelompok:', canvas.width - 30, canvas.height - 250);
    ctx.fillText('1. Verdy Andreansyah', canvas.width - 30, canvas.height - 220);
    ctx.fillText('2. Abdullah Fi Zikri', canvas.width - 30, canvas.height - 190);
    ctx.fillText('3. Ahmad Rizky Idha AW', canvas.width - 30, canvas.height - 160);
    ctx.fillText('4. Adrian Tri Sugiranu', canvas.width - 30, canvas.height - 130);
  }

  function startGameplay() {
    inMenu = false;
    gameRunning = true;

    const bowStartPos = { x: canvas.width / 2, y: canvas.height * 0.55 };
    initBow(canvas, bowStartPos);

    initSkills(canvas); // 🆕 Tambahin ini
    initUltimate(canvas); // tetap ada

    function gameLoop() {
      if (!gameRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      updateEnemies();
      drawEnemies(ctx);

      updateArrows();
      drawArrows(ctx);

      updateBow();
      drawBow(ctx);

      drawUI(ctx);

      if (playerHP() <= 0) {
        gameRunning = false;
        cancelAnimationFrame(gameLoopId);
        return;
      }

      gameLoopId = requestAnimationFrame(gameLoop);
      window.gameLoopId = gameLoopId;
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      updateBow(e.clientX - rect.left, e.clientY - rect.top);
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      updateBow(touch.clientX - rect.left, touch.clientY - rect.top);
    });

    canvas.addEventListener('mousedown', shootArrow);
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      shootArrow();
    });

    gameLoop();
  }

  canvas.addEventListener('click', (e) => {
    if (inMenu) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (
        x >= startButton.x &&
        x <= startButton.x + startButton.width &&
        y >= startButton.y &&
        y <= startButton.y + startButton.height
      ) {
        startGameplay();
      }
    }
  });

  function menuLoop() {
    if (inMenu) {
      drawMenu();
      requestAnimationFrame(menuLoop);
    }
  }

  menuLoop();
}