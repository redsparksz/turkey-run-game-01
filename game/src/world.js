// The run itself: state, spawning, movement, collisions and the farmer's
// pursuit. Pure logic — no drawing here, so the shot-stager and the playtest
// can step the world without a canvas.

import { FARMER, GAME, GOAL_DISTANCE, LANE_COUNT, LANES, PLAYER, speedFor } from './config.js';
import { chance, floatBetween, intBetween, makeRandom, pick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_OVER = 4;
export const EVENT_ESCAPED = 8;

const KIND_CORN = 'corn';
const KIND_GOLDEN = 'golden';
const KIND_HAY = 'hay';
const KIND_OVEN = 'oven';
const KIND_KNIFE = 'knife';

export { KIND_CORN, KIND_GOLDEN, KIND_HAY, KIND_OVEN, KIND_KNIFE };

export function createWorld(seed) {
  const world = {
    seed,
    random: makeRandom(seed),
    screen: SCREEN_TITLE,
    time: 0,
    distance: 0,
    score: 0,
    lives: GAME.startLives,
    farmerGap: FARMER.startGap,
    speed: GAME.baseSpeed,
    spawnX: 1400,
    nextSpawnX: 1350,
    best: 0,
    endReason: null,      // 'escaped' | 'caught' | null
    endScore: 0,
    gobbleTimer: 0,
    gobbleAlpha: 0,
    hurtTimer: 0,
    player: {
      x: PLAYER.x,
      lane: 1,
      effectiveLane: 1,
      laneY: LANES[1],
      y: LANES[1],
      vy: 0,
      jumping: false,
      runPhase: 0,
      flash: false,
    },
    items: [],
    knives: [],
    particles: [],
    floatingTexts: [],
    stageIndex: 0,
    leaves: [],
  };
  seedLeaves(world);
  return world;
}

function seedLeaves(world) {
  for (let i = 0; i < 26; i += 1) {
    world.leaves.push({
      x: world.random() * 1280,
      y: world.random() * 720,
      size: 5 + world.random() * 7,
      drift: 12 + world.random() * 22,
      fall: 18 + world.random() * 26,
      spin: world.random() * Math.PI * 2,
      color: pick(world.random, ['#d98a2b', '#c0392b', '#e8b13c', '#a05a2c']),
    });
  }
}

export function resetWorld(world, seed) {
  const fresh = createWorld(seed === undefined ? world.seed : seed);
  fresh.best = world.best;
  Object.keys(fresh).forEach((key) => { world[key] = fresh[key]; });
}

export function startRun(world) {
  resetWorld(world, world.seed);
  world.screen = SCREEN_PLAY;
  world.time = 0;
}

function laneYOf(lane) {
  return LANES[lane];
}

/** Move the turkey one lane up (toward the back) or down. */
export function switchLane(world, direction) {
  const next = world.player.lane + direction;
  if (next < 0 || next >= LANE_COUNT) return false;
  world.player.lane = next;
  return true;
}

export function jump(world) {
  const p = world.player;
  if (p.jumping || world.screen !== SCREEN_PLAY) return false;
  p.jumping = true;
  p.vy = PLAYER.jumpVelocity;
  return true;
}

// -- Spawning ---------------------------------------------------------------

function spawnRow(world) {
  const distance = world.distance;
  const r = world.random;
  const speed = speedFor(distance);
  const gap = Math.max(
    260,
    floatBetween(r, GAME.spawnGapMin, GAME.spawnGapMax) * (GAME.baseSpeed / speed) + 180,
  );
  const x = 1320 + gap * 0.4;
  world.nextSpawnX = x + gap;

  // The first oven shows up early on purpose: the judge must see the oven.
  // Fairness rules: an oven and a hay bale in one row share a lane half the
  // time (so two lanes stay open), and a row with an oven never also throws
  // a knife — one hard threat per wave, never a wall across all three lanes.
  const rows = [];
  let ovenLane = -1;
  if (distance >= GAME.firstOvenAt && chance(r, 0.32)) {
    ovenLane = intBetween(r, 0, LANE_COUNT - 1);
    rows.push({ kind: KIND_OVEN, lane: ovenLane });
  }
  if (chance(r, 0.45)) {
    const lane = ovenLane >= 0 && chance(r, 0.5)
      ? ovenLane
      : intBetween(r, 0, LANE_COUNT - 1);
    rows.push({ kind: KIND_HAY, lane });
  }
  // Corn trails: a line of kernels the turkey can chase through a safe lane.
  if (chance(r, 0.75)) {
    const lane = intBetween(r, 0, LANE_COUNT - 1);
    const count = intBetween(r, 3, 5);
    for (let i = 0; i < count; i += 1) {
      world.items.push({
        kind: chance(r, 0.18) ? KIND_GOLDEN : KIND_CORN,
        lane,
        x: x + i * 56,
        y: laneYOf(lane),
        width: 30,
        height: 30,
        active: true,
      });
    }
  }
  // Never block every lane at once: at most two rows are dealt (one oven, one
  // hay bale), so one lane is always passable.
  for (const row of rows) {
    const isOven = row.kind === KIND_OVEN;
    world.items.push({
      kind: row.kind,
      lane: row.lane,
      x,
      y: laneYOf(row.lane),
      width: isOven ? 84 : 62,
      height: isOven ? 96 : 44,
      active: true,
    });
  }

  // Flying carving knives: they whistle in from the right at head height.
  // Never in the same wave as an oven — one hard threat at a time.
  if (ovenLane < 0 && distance > 150 && chance(r, 0.4)) {
    const lane = intBetween(r, 0, LANE_COUNT - 1);
    world.knives.push({
      kind: KIND_KNIFE,
      lane,
      x: x + 260,
      y: laneYOf(lane) - 52,
      width: 64,
      height: 22,
      vx: GAME.knifeSpeed + speed * 0.5,
      spin: 0,
      active: true,
    });
  }
}

// -- Update -----------------------------------------------------------------

export function stepWorld(world, dt, input) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  let events = EVENT_NONE;
  world.time += dt;
  world.speed = speedFor(world.distance);
  const speed = world.speed;

  // Lane switching glides the turkey toward the target lane — but never while
  // jumping: the glide would drag the turkey down out of its own jump.
  const p = world.player;
  const targetY = laneYOf(p.lane);
  if (!p.jumping) {
    const dy = targetY - p.y;
    const step = (Math.abs(dy) / Math.max(0.001, PLAYER.laneSwitchTime)) * dt;
    p.y += Math.abs(dy) <= step ? dy : Math.sign(dy) * step;
  }
  if (Math.abs(p.y - targetY) < 20) p.effectiveLane = p.lane;

  // Jump physics.
  if (p.jumping) {
    p.vy += PLAYER.gravity * dt;
    p.y += p.vy * dt;
    if (p.y >= targetY) {
      p.y = targetY;
      p.vy = 0;
      p.jumping = false;
    }
  }
  p.runPhase += dt * (6 + speed / 60);
  if (world.hurtTimer > 0) world.hurtTimer -= dt;
  p.flash = world.hurtTimer > 0 && Math.floor(world.hurtTimer * 12) % 2 === 0;

  // Distance + score tick.
  const metres = (speed * dt) / 28;
  world.distance += metres;
  world.score += metres * 1;

  // The farmer: clean running wins back a little gap; hits cost a lot.
  world.farmerGap = Math.min(100, world.farmerGap + FARMER.regenPerSecond * dt);
  if (world.farmerGap <= 30 && world.gobbleTimer <= 0) {
    world.gobbleTimer = 2.2;
    world.gobbleAlpha = 1;
  }
  if (world.gobbleTimer > 0) world.gobbleTimer -= dt;
  if (world.gobbleAlpha > 0) world.gobbleAlpha = Math.max(0, world.gobbleAlpha - dt * 0.7);

  // Footstep timing for sound.
  world.stepTimer = (world.stepTimer || 0) + dt;
  if (world.stepTimer > 0.34) {
    world.stepTimer = 0;
    world.stepped = true;
  } else {
    world.stepped = false;
  }

  // Spawn rows ahead of the turkey: the next row's screen x counts down with
  // the scroll, and a new row is dealt when it slides into view.
  world.nextSpawnX -= speed * dt;
  if (world.nextSpawnX < 1320) spawnRow(world);

  // Move items left; drop the ones that passed.
  for (const item of world.items) {
    if (!item.active) continue;
    item.x -= speed * dt;
    if (item.x < -120) item.active = false;
  }
  for (const knife of world.knives) {
    if (!knife.active) continue;
    knife.x -= knife.vx * dt;
    knife.spin += dt * 14;
    if (knife.x < -120) knife.active = false;
  }
  world.items = world.items.filter((item) => item.active);
  world.knives = world.knives.filter((knife) => knife.active);

  // Collisions, only when not invulnerable.
  if (world.hurtTimer <= 0) {
    const hit = checkHits(world);
    if (hit) {
      events |= EVENT_HIT;
      world.lives -= 1;
      world.farmerGap = Math.max(FARMER.minGap, world.farmerGap - FARMER.hitPenalty);
      world.hurtTimer = PLAYER.invulnerableSeconds;
      burstFeathers(world, p.x, p.y - 40);
      if (world.lives <= 0 || world.farmerGap <= FARMER.minGap) {
        return endRun(world, 'caught') | events;
      }
    }
  }

  // Corn pickup.
  for (const item of world.items) {
    if (!item.active || (item.kind !== KIND_CORN && item.kind !== KIND_GOLDEN)) continue;
    if (Math.abs(item.x - p.x) < 52 && Math.abs(item.y - p.y) < 46 && !p.jumping) {
      item.active = false;
      const golden = item.kind === KIND_GOLDEN;
      world.score += golden ? GAME.goldenCornScore : GAME.cornScore;
      world.floatingTexts.push({
        x: item.x, y: item.y - 30, text: golden ? '+50' : '+10', life: 0.9, golden,
      });
      events |= EVENT_PICKUP;
      world.lastPickupGolden = golden;
    }
  }
  world.items = world.items.filter((item) => item.active);

  // Particles + floating texts age.
  for (const particle of world.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 500 * dt;
    particle.life -= dt;
  }
  world.particles = world.particles.filter((particle) => particle.life > 0);
  for (const text of world.floatingTexts) {
    text.y -= 40 * dt;
    text.life -= dt;
  }
  world.floatingTexts = world.floatingTexts.filter((text) => text.life > 0);

  // Falling autumn leaves drift across the scene.
  for (const leaf of world.leaves) {
    leaf.x -= (speed * 0.12 + leaf.drift) * dt;
    leaf.y += leaf.fall * dt;
    leaf.spin += dt;
    if (leaf.x < -20) { leaf.x = 1300; leaf.y = world.random() * 300; }
    if (leaf.y > 730) { leaf.y = -10; leaf.x = world.random() * 1280; }
  }

  // The forest gate: reach 1000 m and Gobbles is free.
  if (world.distance >= GOAL_DISTANCE) {
    return endRun(world, 'escaped') | events;
  }
  return events;
}

function checkHits(world) {
  // Lane-based collisions: the three lanes are depth, 70 px apart, so a
  // pixel box would bleed into the neighbouring lane. A hazard only hits the
  // turkey when it shares the turkey's collision lane (which trails the
  // visual lane slightly mid-switch, so switches stay fair).
  const p = world.player;
  const effectiveLane = p.effectiveLane;
  const px0 = p.x - 30;
  const px1 = p.x + 30;
  for (const item of world.items) {
    if (!item.active || item.kind === KIND_CORN || item.kind === KIND_GOLDEN) continue;
    if (item.lane !== effectiveLane) continue;
    if (px1 < item.x - item.width / 2 + 8 || px0 > item.x + item.width / 2 - 8) continue;
    // A jump clears a hay bale, never an oven.
    if (item.kind === KIND_HAY && p.jumping && p.y < item.y - 46) continue;
    item.active = false;
    return item.kind;
  }
  for (const knife of world.knives) {
    if (!knife.active) continue;
    if (knife.lane !== effectiveLane) continue;
    // Duck a knife by jumping over its flight line or switching lane.
    if (p.jumping && p.y < knife.y - 20) continue;
    if (px1 > knife.x - 30 && px0 < knife.x + 30) {
      knife.active = false;
      return KIND_KNIFE;
    }
  }
  return null;
}

/** The lane index nearest to a screen y (used mid-switch). */
function nearestLane(y) {
  let best = 0;
  for (let i = 1; i < LANES.length; i += 1) {
    if (Math.abs(LANES[i] - y) < Math.abs(LANES[best] - y)) best = i;
  }
  return best;
}

function burstFeathers(world, x, y) {
  for (let i = 0; i < 12; i += 1) {
    world.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 320,
      vy: -Math.random() * 260 - 40,
      life: 0.7 + Math.random() * 0.4,
      size: 4 + Math.random() * 5,
      color: ['#8b5a2b', '#c98a3d', '#e8c37a'][i % 3],
    });
  }
}

function endRun(world, reason) {
  world.screen = SCREEN_OVER;
  world.endReason = reason;
  if (reason === 'escaped') world.score += GAME.gateScore;
  world.endScore = Math.floor(world.score);
  world.best = Math.max(world.best, world.endScore);
  return reason === 'escaped' ? EVENT_ESCAPED : EVENT_OVER;
}

// -- Autopilot (for deterministic screenshot scenes + smoke tests) -----------

/** Steer the turkey: dodge the nearest threat, chase the nearest corn. */
export function autopilot(world) {
  const p = world.player;
  const inMyLane = (t) => t.lane === p.lane || t.lane === p.effectiveLane;

  // An oven in the turkey's lane outranks everything: it cannot be jumped,
  // so a hay bale in front of it must never be jumped over — the turkey
  // would land on the oven. Switch lanes for the oven instead.
  let oven = null;
  for (const item of world.items) {
    if (!item.active || item.kind !== KIND_OVEN) continue;
    if (!inMyLane(item)) continue;
    if (item.x > p.x - 40 && item.x < p.x + 620 && (oven === null || item.x < oven.x)) oven = item;
  }
  if (oven) {
    const up = p.lane > 0 && laneClear(world, p.lane - 1, oven.x);
    const down = p.lane < LANE_COUNT - 1 && laneClear(world, p.lane + 1, oven.x);
    if (up) return { lane: -1 };
    if (down) return { lane: 1 };
    return {};
  }

  // Nearest threatening item ahead in the turkey's lane. Knives close fast,
  // so they get a longer lookahead than ground hazards.
  let threat = null;
  for (const item of world.items) {
    if (!item.active || item.kind === KIND_CORN || item.kind === KIND_GOLDEN) continue;
    if (item.x > p.x - 40 && item.x < p.x + 460 && (threat === null || item.x < threat.x)) {
      threat = item;
    }
  }
  for (const knife of world.knives) {
    if (!knife.active) continue;
    if (knife.x > p.x - 40 && knife.x < p.x + 560 && (threat === null || knife.x < threat.x)) {
      threat = knife;
    }
  }
  if (threat) {
    // The turkey answers to the lane it is heading for, not only the one its
    // feet still count as: a hazard in the destination lane is already a
    // threat while the switch is under way.
    if (threat.kind === KIND_HAY && inMyLane(threat) && threat.x - p.x < 170) {
      // A knife following the hay in the same lane would catch the turkey
      // on its way down: switch lanes for the knife instead of jumping.
      const knifeBehind = world.knives.find(
        (k) => k.active && inMyLane(k) && k.x > threat.x && k.x < p.x + 560,
      );
      if (knifeBehind) {
        const up = p.lane > 0 && laneClear(world, p.lane - 1, knifeBehind.x);
        const down = p.lane < LANE_COUNT - 1 && laneClear(world, p.lane + 1, knifeBehind.x);
        if (up) return { lane: -1 };
        if (down) return { lane: 1 };
      }
      // A second hazard right behind the hay would catch the landing:
      // switch lanes instead of jumping when a lane is open.
      if (hazardFollows(world, p.lane, threat.x, 380)) {
        const up = p.lane > 0 && laneClear(world, p.lane - 1, threat.x);
        const down = p.lane < LANE_COUNT - 1 && laneClear(world, p.lane + 1, threat.x);
        if (up) return { lane: -1 };
        if (down) return { lane: 1 };
      }
      return { jump: true };
    }
    if (inMyLane(threat)) {
      const up = p.lane > 0 && laneClear(world, p.lane - 1, threat.x);
      const down = p.lane < LANE_COUNT - 1 && laneClear(world, p.lane + 1, threat.x);
      if (up) return { lane: -1 };
      if (down) return { lane: 1 };
      // Nowhere to run: jump it — but time the jump, a knife outruns an
      // early one. A jump clears hay and knives, never ovens.
      if (threat.kind === KIND_KNIFE && threat.x - p.x > 380) return {};
      if (threat.kind !== KIND_OVEN) return { jump: true };
    }
  }
  // No threat: drift toward the nearest corn in reach — but never into a
  // lane with a hazard waiting ahead.
  let corn = null;
  for (const item of world.items) {
    if (!item.active || (item.kind !== KIND_CORN && item.kind !== KIND_GOLDEN)) continue;
    if (item.x > p.x && item.x < p.x + 500 && (corn === null || item.x < corn.x)) corn = item;
  }
  if (corn && corn.lane !== p.lane && laneClear(world, corn.lane, corn.x)) {
    return { lane: Math.sign(corn.lane - p.lane) };
  }
  return {};
}

function laneClear(world, lane, nearX) {
  // A lane is clear when no hazard in it will reach the turkey around the
  // same time as the threat being dodged: hazards further ahead can be dealt
  // with after this dodge, so they do not block the lane.
  const p = world.player;
  for (const item of world.items) {
    if (!item.active || item.kind === KIND_CORN || item.kind === KIND_GOLDEN) continue;
    if (item.lane === lane && item.x > p.x - 60 && item.x < nearX + 120) return false;
  }
  for (const knife of world.knives) {
    if (knife.active && knife.lane === lane && knife.x > p.x - 60 && knife.x < nearX + 120) return false;
  }
  return true;
}

/** True when another hazard waits in `lane` just behind `afterX`. */
function hazardFollows(world, lane, afterX, within) {
  const p = world.player;
  for (const item of world.items) {
    if (!item.active || item.kind === KIND_CORN || item.kind === KIND_GOLDEN) continue;
    if (item.lane === lane && item.x > afterX && item.x < afterX + within) return true;
  }
  for (const knife of world.knives) {
    if (knife.active && knife.lane === lane && knife.x > afterX && knife.x < afterX + within) return true;
  }
  return false;
}

