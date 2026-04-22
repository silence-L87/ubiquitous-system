const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreText = document.getElementById('scoreText');
const tipText = document.getElementById('tipText');
const restartBtn = document.getElementById('restartBtn');

const config = {
  gravity: 0.56,
  powerRate: 0.14,
  maxPower: 60,
  unitDistance: 140,
  minGap: 110,
  maxGap: 240,
  blockWidth: 78,
  blockHeight: 22,
};

const state = {
  blocks: [],
  player: null,
  charging: false,
  chargeStart: 0,
  power: 0,
  score: 0,
  phase: 'ready',
  nextDirection: 1,
  gameOver: false,
};

function randomGap() {
  return config.minGap + Math.random() * (config.maxGap - config.minGap);
}

function createBlock(x, y) {
  return { x, y, w: config.blockWidth, h: config.blockHeight };
}

function createPlayer(onBlock) {
  return {
    x: onBlock.x,
    y: onBlock.y - 30,
    radius: 16,
    vx: 0,
    vy: 0,
    shadowScale: 1,
  };
}

function resetGame() {
  const first = createBlock(canvas.width * 0.35, canvas.height * 0.72);
  const second = createBlock(first.x + 170, first.y - 30);

  state.blocks = [first, second];
  state.player = createPlayer(first);
  state.charging = false;
  state.chargeStart = 0;
  state.power = 0;
  state.score = 0;
  state.phase = 'ready';
  state.nextDirection = Math.random() > 0.5 ? 1 : -1;
  state.gameOver = false;
  scoreText.textContent = `分数：${state.score}`;
  tipText.textContent = '按住屏幕/鼠标蓄力，松开跳跃';
  tipText.classList.remove('danger');
}

function startCharge() {
  if (state.phase === 'jumping' || state.gameOver) return;
  state.phase = 'charging';
  state.charging = true;
  state.chargeStart = performance.now();
}

function releaseJump() {
  if (!state.charging || state.gameOver) return;

  state.charging = false;
  const elapsed = performance.now() - state.chargeStart;
  state.power = Math.min(config.maxPower, elapsed * config.powerRate);
  state.phase = 'jumping';

  const horizontalSpeed = state.power * 0.42;
  const verticalSpeed = Math.max(8, state.power * 0.42);
  state.player.vx = horizontalSpeed * state.nextDirection;
  state.player.vy = -verticalSpeed;
}

function generateNextBlock(fromBlock) {
  const gap = randomGap();
  const direction = Math.random() > 0.5 ? 1 : -1;

  const x = Math.min(
    canvas.width - 60,
    Math.max(60, fromBlock.x + direction * gap)
  );
  const y = Math.min(
    canvas.height - 120,
    Math.max(200, fromBlock.y - 20 + (Math.random() * 70 - 35))
  );

  state.nextDirection = direction;
  return createBlock(x, y);
}

function updatePlayer() {
  if (state.phase !== 'jumping') {
    if (state.phase === 'charging') {
      const pressTime = performance.now() - state.chargeStart;
      const scale = 1 - Math.min(0.35, pressTime / 1000 * 0.35);
      state.player.shadowScale = scale;
    } else {
      state.player.shadowScale += (1 - state.player.shadowScale) * 0.25;
    }
    return;
  }

  state.player.x += state.player.vx;
  state.player.y += state.player.vy;
  state.player.vy += config.gravity;

  if (state.player.y > canvas.height + 100 || state.player.x < -120 || state.player.x > canvas.width + 120) {
    failGame();
    return;
  }

  const falling = state.player.vy > 0;
  if (!falling) return;

  const landingBlock = state.blocks.find((block) => {
    const withinX = Math.abs(state.player.x - block.x) <= block.w * 0.5;
    const nearTop = Math.abs((state.player.y + state.player.radius) - block.y) <= 14;
    return withinX && nearTop;
  });

  if (!landingBlock) return;

  state.player.y = landingBlock.y - state.player.radius;
  state.player.vx = 0;
  state.player.vy = 0;
  state.phase = 'ready';
  state.player.shadowScale = 1;

  const latestBlock = state.blocks[state.blocks.length - 1];
  if (landingBlock === latestBlock) {
    state.score += 1;
    scoreText.textContent = `分数：${state.score}`;
    state.blocks.push(generateNextBlock(latestBlock));
    if (state.blocks.length > 6) {
      state.blocks.shift();
    }
  } else {
    failGame();
  }
}

function failGame() {
  state.gameOver = true;
  state.phase = 'over';
  tipText.textContent = '游戏结束，点击“重新开始”再来一局';
  tipText.classList.add('danger');
}

function drawBlock(block) {
  const w = block.w;
  const h = block.h;
  const x = block.x - w / 2;
  const y = block.y - h / 2;

  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();

  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 4, w - 8, h - 10, 6);
  ctx.fill();
}

function drawPlayer() {
  const { x, y, radius, shadowScale } = state.player;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
  ctx.beginPath();
  ctx.ellipse(0, radius + 8, radius * 0.9, radius * 0.35 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyScaleY = state.phase === 'charging' ? shadowScale : 1;
  ctx.scale(1, bodyScaleY);

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(-5, -3, 2.2, 0, Math.PI * 2);
  ctx.arc(5, -3, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPowerBar() {
  if (state.phase !== 'charging') return;

  const elapsed = performance.now() - state.chargeStart;
  const p = Math.min(config.maxPower, elapsed * config.powerRate) / config.maxPower;

  const x = 24;
  const y = 28;
  const w = canvas.width - 48;
  const h = 10;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(x, y, w * p, h, 8);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  state.blocks.forEach(drawBlock);
  drawPlayer();
  drawPowerBar();
}

function tick() {
  updatePlayer();
  draw();
  requestAnimationFrame(tick);
}

restartBtn.addEventListener('click', resetGame);

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  startCharge();
});

canvas.addEventListener('pointerup', (event) => {
  event.preventDefault();
  releaseJump();
});

canvas.addEventListener('pointercancel', releaseJump);
canvas.addEventListener('pointerleave', () => {
  if (state.phase === 'charging') {
    releaseJump();
  }
});

resetGame();
tick();
