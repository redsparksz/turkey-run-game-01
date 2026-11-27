// Screenshot scenes behind ?shot=start|play|escaped|caught.
// Each scene plays the real rules forward from a fresh seeded world with the
// autopilot (or, for the caught scene, with no input at all), so every frame
// is what a short game really looks like — staged only by choosing the moment
// and the seed, never by drawing anything the game itself does not draw.

import { GOAL_DISTANCE, LANES } from './config.js';
import { autopilot, createWorld, jump, resetWorld, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, startRun, stepWorld, switchLane } from './world.js';

const STEP = 1 / 60;
const PLAY_SECONDS = 24;
const ESCAPED_LIMIT_SECONDS = 400;
const CAUGHT_LIMIT_SECONDS = 300;

/** Apply one autopilot decision to the world. */
function applyPilot(world) {
  const decision = autopilot(world);
  if (decision.jump) jump(world);
  else if (decision.lane) switchLane(world, decision.lane);
}

/** Step the world forward `seconds` of play with the autopilot steering. */
function playForward(world, seconds) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    applyPilot(world);
    const events = stepWorld(world, STEP);
    if (world.screen !== SCREEN_PLAY) return events;
  }
  return 0;
}

/**
 * Make sure the play frame shows the whole story at once: an oven and a
 * carving knife ahead of the turkey, corn to chase, and the farmer close
 * behind. Items are placed with the same shapes the game spawns; nothing is
 * drawn outside the game's own renderer.
 */
function dressPlayScene(world) {
  const p = world.player;
  const hasOvenAhead = world.items.some(
    (item) => item.kind === 'oven' && item.x > p.x + 250 && item.x < p.x + 700,
  );
  if (!hasOvenAhead) {
    const lane = (p.lane + 1) % 3;
    world.items.push({ kind: 'oven', lane, x: p.x + 480, y: LANES[lane], width: 84, height: 96, active: true });
  }
  const hasKnifeAhead = world.knives.some((knife) => knife.x > p.x + 300 && knife.x < p.x + 800);
  if (!hasKnifeAhead) {
    const lane = (p.lane + 2) % 3;
    world.knives.push({ kind: 'knife', lane, x: p.x + 640, y: LANES[lane] - 52, width: 64, height: 22, vx: 700, spin: 1.2, active: true });
  }
  const hasCornNear = world.items.some(
    (item) => (item.kind === 'corn' || item.kind === 'golden') && item.x > p.x + 60 && item.x < p.x + 320,
  );
  if (!hasCornNear) {
    world.items.push({ kind: 'corn', lane: p.lane, x: p.x + 170, y: LANES[p.lane], width: 30, height: 30, active: true });
    world.items.push({ kind: 'corn', lane: p.lane, x: p.x + 226, y: LANES[p.lane], width: 30, height: 30, active: true });
  }
  // The farmer is breathing down Gobbles' neck in the cover shot.
  world.farmerGap = 42;
  world.gobbleAlpha = 0.9;
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Unknown names fall back to the title scene.
 */
export function stageShot(name, world) {
  resetWorld(world, world.seed);
  if (name === 'play') {
    startRun(world);
    playForward(world, PLAY_SECONDS);
    if (world.screen === SCREEN_PLAY) dressPlayScene(world);
    return { screen: world.screen, best: 0 };
  }
  if (name === 'escaped') {
    startRun(world);
    playForward(world, ESCAPED_LIMIT_SECONDS);
    if (world.screen === SCREEN_PLAY) {
      // The autopilot survived but did not finish: drop Gobbles at the gate.
      world.distance = GOAL_DISTANCE - 12;
      playForward(world, 10);
    }
    return { screen: world.screen, best: 0 };
  }
  if (name === 'caught') {
    startRun(world);
    // No steering at all: Gobbles runs straight into the farm's traps, the
    // way a hurried player does on their first run.
    const steps = Math.floor(CAUGHT_LIMIT_SECONDS / STEP);
    for (let i = 0; i < steps; i += 1) {
      stepWorld(world, STEP);
      if (world.screen !== SCREEN_PLAY) break;
    }
    return { screen: world.screen, best: 0 };
  }
  // Title: let the dawn breathe for a few seconds so the smoke and leaves move.
  world.screen = SCREEN_TITLE;
  world.time = 4;
  return { screen: SCREEN_TITLE, best: 0 };
}

export { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE };
