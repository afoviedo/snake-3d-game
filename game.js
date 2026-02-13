import * as THREE from "./node_modules/three/build/three.module.js";

const GRID_SIZE = 16;
const CELL_SIZE = 1;
const STEP_MS_START = 190;
const STEP_MS_MIN = 85;
const STEP_DECAY = 3;

const directions = {
  up: { x: 0, z: -1 },
  down: { x: 0, z: 1 },
  left: { x: -1, z: 0 },
  right: { x: 1, z: 0 },
};

const state = {
  mode: "menu",
  score: 0,
  best: 0,
  tickMs: STEP_MS_START,
  accumulator: 0,
  snake: [],
  dir: "right",
  pendingDir: "right",
  food: { x: 0, z: 0 },
  firstFood: true,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x99c5df);
scene.fog = new THREE.Fog(0x99c5df, 12, 28);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 14, 14);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(6, 14, 8);
sun.castShadow = true;
scene.add(sun);

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(GRID_SIZE * CELL_SIZE + 2, 0.4, GRID_SIZE * CELL_SIZE + 2),
  new THREE.MeshStandardMaterial({ color: 0x3f6d4f, roughness: 0.9 })
);
floor.position.y = -0.2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(GRID_SIZE * CELL_SIZE, GRID_SIZE, 0xd1f2d4, 0xb0d4b8);
grid.position.y = 0.02;
scene.add(grid);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x2d4354, roughness: 0.6 });
const wallGeom = new THREE.BoxGeometry(GRID_SIZE + 2, 1.2, 0.4);
const sideWallGeom = new THREE.BoxGeometry(0.4, 1.2, GRID_SIZE + 2);

const walls = [
  { mesh: new THREE.Mesh(wallGeom, wallMat), x: 0, z: -GRID_SIZE / 2 - 0.5 },
  { mesh: new THREE.Mesh(wallGeom, wallMat), x: 0, z: GRID_SIZE / 2 + 0.5 },
  { mesh: new THREE.Mesh(sideWallGeom, wallMat), x: -GRID_SIZE / 2 - 0.5, z: 0 },
  { mesh: new THREE.Mesh(sideWallGeom, wallMat), x: GRID_SIZE / 2 + 0.5, z: 0 },
];
walls.forEach((w) => {
  w.mesh.position.set(w.x, 0.4, w.z);
  scene.add(w.mesh);
});

const snakeHeadMat = new THREE.MeshStandardMaterial({ color: 0x4cd97b, roughness: 0.4 });
const snakeBodyMat = new THREE.MeshStandardMaterial({ color: 0x2ca35b, roughness: 0.55 });
const foodMat = new THREE.MeshStandardMaterial({ color: 0xff664f, roughness: 0.35, emissive: 0x2a0000 });
const cellGeom = new THREE.BoxGeometry(0.88, 0.88, 0.88);
const foodGeom = new THREE.SphereGeometry(0.42, 20, 20);

const snakeMeshes = [];
const foodMesh = new THREE.Mesh(foodGeom, foodMat);
foodMesh.castShadow = true;
scene.add(foodMesh);

const menuPanel = document.getElementById("menu");
const gameOverPanel = document.getElementById("game-over");
const finalScoreLabel = document.getElementById("final-score");
const hud = document.getElementById("hud");
const scoreLabel = document.getElementById("score");
const statusLabel = document.getElementById("status");

function gridToWorld(x, z) {
  const half = GRID_SIZE / 2;
  return {
    wx: x - half + 0.5,
    wz: z - half + 0.5,
  };
}

function isOpposite(a, b) {
  return directions[a].x === -directions[b].x && directions[a].z === -directions[b].z;
}

function resetSnake() {
  state.snake = [
    { x: 8, z: 8 },
    { x: 7, z: 8 },
    { x: 6, z: 8 },
  ];
  state.dir = "right";
  state.pendingDir = "right";
}

function randomCell() {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    z: Math.floor(Math.random() * GRID_SIZE),
  };
}

function placeFood() {
  if (state.firstFood) {
    state.firstFood = false;
    state.food = { x: 10, z: 8 };
    return;
  }
  let cell = randomCell();
  while (state.snake.some((part) => part.x === cell.x && part.z === cell.z)) {
    cell = randomCell();
  }
  state.food = cell;
}

function syncSnakeMeshes() {
  while (snakeMeshes.length < state.snake.length) {
    const mesh = new THREE.Mesh(cellGeom, snakeMeshes.length === 0 ? snakeHeadMat : snakeBodyMat);
    mesh.castShadow = true;
    scene.add(mesh);
    snakeMeshes.push(mesh);
  }
  while (snakeMeshes.length > state.snake.length) {
    const mesh = snakeMeshes.pop();
    scene.remove(mesh);
  }

  for (let i = 0; i < state.snake.length; i += 1) {
    const part = state.snake[i];
    const mesh = snakeMeshes[i];
    const pos = gridToWorld(part.x, part.z);
    mesh.material = i === 0 ? snakeHeadMat : snakeBodyMat;
    mesh.position.set(pos.wx, 0.44, pos.wz);
    mesh.scale.setScalar(i === 0 ? 1 : 0.93);
  }

  const foodPos = gridToWorld(state.food.x, state.food.z);
  foodMesh.position.set(foodPos.wx, 0.48, foodPos.wz);
}

function setStatus(label, modeTag) {
  statusLabel.textContent = label;
  statusLabel.dataset.state = modeTag;
}

function updateHud() {
  scoreLabel.textContent = `Score: ${state.score} (Best: ${state.best})`;
  if (state.mode === "playing") setStatus("Running", "playing");
  if (state.mode === "paused") setStatus("Paused", "paused");
  if (state.mode === "gameover") setStatus("Game Over", "over");
}

function startRound() {
  state.mode = "playing";
  state.score = 0;
  state.tickMs = STEP_MS_START;
  state.accumulator = 0;
  state.firstFood = true;
  resetSnake();
  placeFood();
  updateHud();
  menuPanel.classList.add("hidden");
  gameOverPanel.classList.add("hidden");
  hud.classList.remove("hidden");
  syncSnakeMeshes();
}

function setGameOver() {
  state.mode = "gameover";
  state.best = Math.max(state.best, state.score);
  finalScoreLabel.textContent = `Score: ${state.score} | Best: ${state.best}`;
  gameOverPanel.classList.remove("hidden");
  updateHud();
}

function stepSnake() {
  if (isOpposite(state.pendingDir, state.dir)) {
    state.pendingDir = state.dir;
  }
  state.dir = state.pendingDir;

  const head = state.snake[0];
  const next = {
    x: head.x + directions[state.dir].x,
    z: head.z + directions[state.dir].z,
  };

  const out = next.x < 0 || next.z < 0 || next.x >= GRID_SIZE || next.z >= GRID_SIZE;
  if (out || state.snake.some((part) => part.x === next.x && part.z === next.z)) {
    setGameOver();
    return;
  }

  state.snake.unshift(next);

  if (next.x === state.food.x && next.z === state.food.z) {
    state.score += 1;
    state.tickMs = Math.max(STEP_MS_MIN, STEP_MS_START - state.score * STEP_DECAY);
    placeFood();
  } else {
    state.snake.pop();
  }

  syncSnakeMeshes();
  updateHud();
}

function update(dtMs) {
  if (state.mode !== "playing") return;

  state.accumulator += dtMs;
  while (state.accumulator >= state.tickMs) {
    state.accumulator -= state.tickMs;
    stepSnake();
    if (state.mode !== "playing") break;
  }
}

function render() {
  const t = performance.now() * 0.0025;
  foodMesh.position.y = 0.5 + Math.sin(t * 4) * 0.08;
  foodMesh.rotation.y += 0.03;
  renderer.render(scene, camera);
}

let prevTime = performance.now();
function loop(now) {
  const delta = now - prevTime;
  prevTime = now;
  update(delta);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function keyToDir(key) {
  if (key === "ArrowUp" || key === "w" || key === "W") return "up";
  if (key === "ArrowDown" || key === "s" || key === "S") return "down";
  if (key === "ArrowLeft" || key === "a" || key === "A") return "left";
  if (key === "ArrowRight" || key === "d" || key === "D") return "right";
  return null;
}

function togglePause() {
  if (state.mode === "playing") {
    state.mode = "paused";
    updateHud();
    return;
  }
  if (state.mode === "paused") {
    state.mode = "playing";
    updateHud();
  }
}

function restartRound() {
  startRound();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

document.getElementById("start-btn").addEventListener("click", startRound);
document.getElementById("restart-btn").addEventListener("click", restartRound);

document.addEventListener("keydown", (event) => {
  const isEnter = event.key === "Enter" || event.code === "Enter" || event.code === "NumpadEnter";
  const isSpace = event.key === " " || event.code === "Space";
  const dir = keyToDir(event.key);
  if (dir && state.mode === "playing") {
    state.pendingDir = dir;
    event.preventDefault();
    return;
  }

  if ((isEnter || isSpace) && state.mode === "menu") {
    startRound();
    return;
  }

  if ((isEnter || isSpace) && state.mode === "gameover") {
    restartRound();
    return;
  }

  if ((event.key === "r" || event.key === "R") && (state.mode === "playing" || state.mode === "paused" || state.mode === "gameover")) {
    restartRound();
    return;
  }

  if ((event.key === "p" || event.key === "P") && (state.mode === "playing" || state.mode === "paused")) {
    togglePause();
    return;
  }

  if (event.key === "f" || event.key === "F") {
    toggleFullscreen();
    return;
  }

  if (event.key === "Escape" && document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
});

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}
window.addEventListener("resize", resize);
document.addEventListener("fullscreenchange", resize);

window.render_game_to_text = () => {
  const payload = {
    mode: state.mode,
    coordinateSystem: "grid origin=(0,0) top-left; x rightwards, z downwards",
    gridSize: GRID_SIZE,
    direction: state.dir,
    pendingDirection: state.pendingDir,
    score: state.score,
    best: state.best,
    speedMs: state.tickMs,
    snake: state.snake.map((part, i) => ({ x: part.x, z: part.z, role: i === 0 ? "head" : "body" })),
    food: { x: state.food.x, z: state.food.z },
  };
  return JSON.stringify(payload);
};

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  const dt = ms / steps;
  for (let i = 0; i < steps; i += 1) update(dt);
  render();
};

syncSnakeMeshes();
updateHud();
