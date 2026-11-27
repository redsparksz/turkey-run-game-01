// Gobbles Kabur dari Dapur — bootstrap and the main loop.
// Fixed 1/60 s steps keep the run identical on fast and slow machines; the
// renderer draws whatever the world holds at any moment.

import { VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import {
  EVENT_ESCAPED,
  EVENT_HIT,
  EVENT_OVER,
  EVENT_PICKUP,
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createWorld,
  jump,
  startRun,
  stepWorld,
  switchLane,
} from './world.js';

const STEP = 1 / 60;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : 20261127;
const shotName = params.get('shot');

const world = createWorld(seed);
const audio = createAudio();
const ui = { buttons: [], muted: false };

let paused = false;
let accumulator = 0;
let lastTime = performance.now();
let shotStaged = false;

if (shotName) {
  stageShot(shotName, world);
  shotStaged = true;
}

function bestKey() {
  return 'gobbles-best-score';
}

function loadBest() {
  try {
    world.best = Number(window.localStorage.getItem(bestKey())) || 0;
  } catch {
    world.best = 0;
  }
}

function saveBest() {
  try {
    window.localStorage.setItem(bestKey(), String(world.best));
  } catch {
    // Private mode or no storage: the best score just lives for this run.
  }
}

loadBest();

// -- UI hooks: what a key press or a mouse click does in each screen --------

function buttonAt(x, y) {
  return ui.buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
}

function handleEvents(events) {
  if (events & EVENT_HIT) audio.hurt();
  if (events & EVENT_PICKUP) audio.pickup(world.lastPickupGolden);
  if (events & EVENT_OVER) {
    audio.caughtSting();
    saveBest();
  }
  if (events & EVENT_ESCAPED) {
    audio.escapedFanfare();
    saveBest();
  }
}

function doStart() {
  if (world.screen === SCREEN_TITLE || world.screen === SCREEN_OVER) {
    audio.ensure();
    audio.gobble();
    startRun(world);
    paused = false;
  }
}

function doJump() {
  if (world.screen !== SCREEN_PLAY || paused) return;
  audio.ensure();
  if (jump(world)) audio.tone(300, 0.12, 'sine', 0.08);
}

function doLane(direction) {
  if (world.screen !== SCREEN_PLAY || paused) return;
  switchLane(world, direction);
}

const input = createInput(canvas, {
  onJump: doJump,
  onLane: doLane,
  onStart: doStart,
  onRestart: doStart,
  onPause: (isPaused) => {
    paused = isPaused;
  },
  onMute: (isMuted) => {
    audio.ensure();
    ui.muted = audio.toggleMute();
  },
  onClick: (x, y) => {
    const button = buttonAt(x, y);
    if (!button) return;
    audio.ensure();
    if (button.id === 'start' || button.id === 'restart') doStart();
    else if (button.id === 'pause') {
      paused = !paused;
    } else if (button.id === 'mute') {
      ui.muted = audio.toggleMute();
    }
  },
});

// -- Main loop ---------------------------------------------------------------

function frame(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (!shotStaged) {
    if (!paused && world.screen === SCREEN_PLAY) {
      accumulator += dt;
      let guard = 0;
      while (accumulator >= STEP && guard < 8) {
        const events = stepWorld(world, STEP);
        if (world.stepped) audio.footstep();
        if (world.farmerGap <= 30 && world.gobbleTimer > 2.1) audio.farmerClose();
        handleEvents(events);
        audio.updateMusic(STEP, true);
        accumulator -= STEP;
        guard += 1;
      }
      if (guard >= 8) accumulator = 0;
    } else if (world.screen === SCREEN_TITLE) {
      // The title scene stays alive: smoke rises, leaves fall.
      world.time += dt;
      for (const leaf of world.leaves) {
        leaf.x -= leaf.drift * dt;
        leaf.y += leaf.fall * dt;
        leaf.spin += dt;
        if (leaf.x < -20) leaf.x = 1300;
        if (leaf.y > 730) leaf.y = -10;
      }
    }
  }
  render(ctx, world, ui);
  requestAnimationFrame(frame);
}

function resize() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}

window.addEventListener('resize', resize);
resize();

// A hook for automated playtests: the world is readable, never writable from
// outside the game. Screenshots and checks use ?shot= instead.
window.__gobbles = {
  world,
  start: doStart,
  jump: doJump,
  lane: doLane,
  version: 'gobbles-1.0',
};

requestAnimationFrame(frame);
