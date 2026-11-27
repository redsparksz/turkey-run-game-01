// Gobbles Kabur dari Dapur — tuning & constants.
// Kamis pagi jam 6, sehari sebelum Thanksgiving: Gobbles si kalkun kabur dari
// kandang halaman belakang, melewati kebun jagung, menuju gerbang hutan.
// Satu lari = 1000 meter. Tiga nyawa. Petani mengejar dari belakang.

export const VIEW = { width: 1280, height: 720 };

// Three running lanes (ground line y for each lane's feet).
export const LANES = [486, 556, 626];
export const LANE_COUNT = 3;

// The run: farmyard -> cornfield -> forest gate.
export const GOAL_DISTANCE = 1000;
export const STAGES = [
  { from: 0, name: 'HALAMAN PETERNAKAN', sky: ['#ffd9a0', '#ff9e6d', '#7d4a2d'], ground: '#8a6a3b', grass: '#7fae4e' },
  { from: 300, name: 'KEBUN JAGUNG', sky: ['#ffe3ae', '#f7b267', '#6d8f3a'], ground: '#7d5f33', grass: '#5f8f3a' },
  { from: 700, name: 'GERBANG HUTAN', sky: ['#cfe8c9', '#8fc98a', '#2f5d3a'], ground: '#5d4a2f', grass: '#3f7a44' },
];

export const PLAYER = {
  x: 300,            // fixed screen x; the world scrolls past
  width: 92,
  height: 96,
  jumpVelocity: -1050,
  gravity: 2400,
  laneSwitchTime: 0.16,
  invulnerableSeconds: 1.4,
};

export const FARMER = {
  catchDistance: 0,      // gap 0 = caught
  startGap: 100,         // percent; 100 = far behind, safe
  hitPenalty: 26,        // gap lost per hit
  slowPenalty: 10,       // gap lost per stumble (hay bale clipped)
  regenPerSecond: 1.6,   // gap recovered while running clean
  minGap: 8,             // never quite zero from regen alone
};

export const GAME = {
  startLives: 3,
  baseSpeed: 300,        // px per second at the start
  maxSpeed: 560,         // px per second near the forest gate
  speedRamp: 0.26,       // extra px/s per metre run
  cornScore: 10,
  goldenCornScore: 50,
  gateScore: 500,
  spawnGapMin: 210,      // px between obstacle rows, shrinks with speed
  spawnGapMax: 420,
  knifeSpeed: 580,
  firstOvenAt: 120,      // metres: the first oven appears early, on purpose
};

export const KEYS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'ArrowUp', 'KeyW'],
  start: ['Enter', 'Space'],
  pause: ['KeyP', 'Escape'],
  mute: ['KeyM'],
  restart: ['KeyR', 'Enter'],
};

// Distance score: 1 point per metre, so a clean escape is worth 1000 + gate bonus.
export const DISTANCE_SCORE_PER_METRE = 1;

/** Stage the turkey is running through at this distance. */
export function stageFor(distance) {
  let stage = STAGES[0];
  for (const candidate of STAGES) {
    if (distance >= candidate.from) stage = candidate;
  }
  return stage;
}

/** Current scroll speed in px/s for a given distance. */
export function speedFor(distance) {
  return Math.min(GAME.maxSpeed, GAME.baseSpeed + distance * GAME.speedRamp);
}
