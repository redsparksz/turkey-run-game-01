// All drawing for Gobbles: the dawn farmyard, the hazards, the HUD and the
// menus. The world is drawn in layers — sky, distant scenery, ground lanes,
// actors, effects, HUD — so a screenshot reads at a glance even shrunk.

import { GOAL_DISTANCE, LANES, VIEW, stageFor } from './config.js';
import { drawFarmer, drawGobblePuff, drawTurkey } from './turkey.js';
import { KIND_CORN, KIND_GOLDEN, KIND_HAY, KIND_KNIFE, KIND_OVEN, SCREEN_OVER, SCREEN_TITLE } from './world.js';

const HEART = '\u2665';

export function render(ctx, world, ui) {
  const stage = stageFor(world.distance);
  drawSky(ctx, stage, world.time);
  drawDistantFarm(ctx, stage, world);
  drawGround(ctx, stage, world);
  drawLeaves(ctx, world);
  if (world.screen === SCREEN_TITLE) {
    drawTitleScene(ctx, world, ui);
  } else {
    drawItems(ctx, world);
    drawFarmerChase(ctx, world);
    drawPlayer(ctx, world);
    drawParticles(ctx, world);
    drawFloatingTexts(ctx, world);
  }
  if (world.screen === SCREEN_OVER) drawEndScreen(ctx, world, ui);
  if (world.screen !== SCREEN_TITLE) drawHud(ctx, world, ui);
}

function drawSky(ctx, stage, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, 480);
  grad.addColorStop(0, stage.sky[0]);
  grad.addColorStop(0.6, stage.sky[1]);
  grad.addColorStop(1, stage.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, 480);
  // Low dawn sun, half-risen over the farm.
  const sunX = 1010;
  const sunY = 150;
  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180);
  glow.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  glow.addColorStop(0.35, 'rgba(255, 200, 110, 0.55)');
  glow.addColorStop(1, 'rgba(255, 200, 110, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 190, sunY - 190, 380, 380);
  ctx.fillStyle = '#ffdf8a';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
  ctx.fill();
  // A few slow dawn clouds.
  ctx.fillStyle = 'rgba(255, 244, 224, 0.75)';
  for (let i = 0; i < 4; i += 1) {
    const cx = ((i * 340 + time * 6) % 1500) - 120;
    const cy = 70 + i * 36;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 70, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 44, cy + 6, 48, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDistantFarm(ctx, stage, world) {
  // Farmhouse with a smoking chimney on the left horizon.
  const baseY = 470;
  ctx.save();
  ctx.translate(120, baseY);
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(-90, -110, 180, 110);
  ctx.fillStyle = '#a34a2a';
  ctx.beginPath();
  ctx.moveTo(-104, -108);
  ctx.lineTo(0, -168);
  ctx.lineTo(104, -108);
  ctx.closePath();
  ctx.fill();
  // Chimney + smoke puffs.
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(52, -160, 22, 60);
  ctx.fillStyle = 'rgba(240, 240, 240, 0.75)';
  for (let i = 0; i < 4; i += 1) {
    const t = ((world.time * 0.35 + i * 0.25) % 1);
    ctx.beginPath();
    ctx.arc(63 + i * 8 - t * 30, -170 - t * 60, 7 + t * 12, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lit windows: someone is awake in the kitchen, sharpening a knife.
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(-70, -80, 28, 34);
  ctx.fillRect(-10, -80, 28, 34);
  ctx.fillRect(44, -80, 28, 34);
  ctx.strokeStyle = '#6d4423';
  ctx.lineWidth = 3;
  ctx.strokeRect(-70, -80, 28, 34);
  ctx.strokeRect(-10, -80, 28, 34);
  ctx.strokeRect(44, -80, 28, 34);
  // Door.
  ctx.fillStyle = '#6d4423';
  ctx.fillRect(-16, -48, 34, 48);
  ctx.restore();

  // Barn silhouette on the right horizon.
  ctx.save();
  ctx.translate(1120, baseY);
  ctx.fillStyle = '#7d3b2a';
  ctx.fillRect(-70, -96, 140, 96);
  ctx.beginPath();
  ctx.moveTo(-78, -94);
  ctx.lineTo(0, -150);
  ctx.lineTo(78, -94);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f5e6c8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-70, -94);
  ctx.lineTo(70, -94);
  ctx.moveTo(0, -150);
  ctx.lineTo(0, -94);
  ctx.stroke();
  ctx.restore();

  // Fence posts marching along the horizon.
  ctx.fillStyle = '#6d4a26';
  for (let i = 0; i < 16; i += 1) {
    const fx = i * 84 + 10;
    ctx.fillRect(fx, baseY - 26, 8, 26);
  }
  ctx.fillRect(0, baseY - 22, VIEW.width, 5);
}

function drawGround(ctx, stage, world) {
  // Dirt track with three running lanes.
  const groundGrad = ctx.createLinearGradient(0, 470, 0, VIEW.height);
  groundGrad.addColorStop(0, stage.ground);
  groundGrad.addColorStop(1, '#4a3419');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 470, VIEW.width, VIEW.height - 470);
  // Grassy verge at the top of the track.
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, 462, VIEW.width, 14);
  // Lane separators: dashed chalk lines that scroll with the run.
  ctx.strokeStyle = 'rgba(245, 230, 200, 0.4)';
  ctx.lineWidth = 4;
  ctx.setLineDash([26, 30]);
  const offset = world.screen === SCREEN_TITLE ? 0 : -(world.distance * 28) % 56;
  for (let i = 0; i < LANES.length - 1; i += 1) {
    const y = (LANES[i] + LANES[i + 1]) / 2 + 12;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW.width, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Scrolling tufts, pumpkins and haystacks along the verge.
  const scroll = world.screen === SCREEN_TITLE ? 0 : world.distance * 28;
  for (let i = 0; i < 9; i += 1) {
    const baseX = i * 170 + 40;
    const x = ((baseX - scroll * 0.6) % 1560 + 1560) % 1560 - 140;
    if (i % 3 === 0) drawPumpkin(ctx, x, 470, 1);
    else if (i % 3 === 1) drawHaystack(ctx, x, 472, 0.8);
    else drawGrassTuft(ctx, x, 468);
  }
  // The forest gate, far ahead: it slides in as the distance closes.
  if (world.distance > GOAL_DISTANCE - 260) {
    const gateX = 1280 - (world.distance - (GOAL_DISTANCE - 260)) * 4.4;
    drawForestGate(ctx, Math.min(gateX, 1240), 470);
  }
}

function drawPumpkin(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#e07b2a';
  ctx.beginPath();
  ctx.ellipse(0, -12, 22, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b25a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -26);
  ctx.quadraticCurveTo(-10, -12, -8, 2);
  ctx.moveTo(8, -26);
  ctx.quadraticCurveTo(10, -12, 8, 2);
  ctx.stroke();
  ctx.strokeStyle = '#4a7a2a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.quadraticCurveTo(4, -34, 10, -32);
  ctx.stroke();
  ctx.restore();
}

function drawHaystack(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#d9b45b';
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.quadraticCurveTo(-24, -34, 0, -38);
  ctx.quadraticCurveTo(24, -34, 26, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a8862f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -8);
  ctx.quadraticCurveTo(0, -26, 16, -8);
  ctx.moveTo(-12, -18);
  ctx.quadraticCurveTo(0, -32, 12, -18);
  ctx.stroke();
  ctx.restore();
}

function drawGrassTuft(ctx, x, y) {
  ctx.strokeStyle = '#4a7a2a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.quadraticCurveTo(x - 10, y - 14, x - 14, y - 18);
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x, y - 16, x + 1, y - 20);
  ctx.moveTo(x + 8, y);
  ctx.quadraticCurveTo(x + 10, y - 14, x + 14, y - 18);
  ctx.stroke();
}

function drawForestGate(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  // Two pine trees framing a wooden arch: freedom.
  drawPine(ctx, -70, 0, 1.5);
  drawPine(ctx, 70, 0, 1.5);
  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(-58, -150, 14, 150);
  ctx.fillRect(44, -150, 14, 150);
  ctx.fillRect(-64, -158, 128, 14);
  ctx.fillStyle = '#2f7a3a';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('HUTAN', 0, -168);
  ctx.restore();
}

function drawPine(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(-5, -30, 10, 30);
  ctx.fillStyle = '#2f6b34';
  for (let i = 0; i < 3; i += 1) {
    const w = 44 - i * 11;
    const top = -30 - i * 26;
    ctx.beginPath();
    ctx.moveTo(-w / 2, top + 26);
    ctx.lineTo(0, top - 8);
    ctx.lineTo(w / 2, top + 26);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawLeaves(ctx, world) {
  for (const leaf of world.leaves) {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.spin);
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size, leaf.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// -- Hazards & pickups --------------------------------------------------------

function drawItems(ctx, world) {
  // Back lanes first, so a front-lane oven correctly overlaps the turkey's
  // lane behind it.
  const items = [...world.items].sort((a, b) => a.lane - b.lane);
  for (const item of items) {
    if (!item.active) continue;
    if (item.kind === KIND_OVEN) drawOven(ctx, item);
    else if (item.kind === KIND_HAY) drawHayBale(ctx, item);
    else if (item.kind === KIND_CORN) drawCorn(ctx, item, false);
    else if (item.kind === KIND_GOLDEN) drawCorn(ctx, item, true);
  }
  for (const knife of world.knives) {
    if (knife.active) drawKnife(ctx, knife);
  }
}

function drawOven(ctx, item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  // The kitchen oven, dragged out onto the track: open door, hungry fire.
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(-42, -96, 84, 96);
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(-42, -96, 84, 12);
  // Fire glow inside the open mouth.
  const flicker = 0.75 + Math.sin(item.x * 0.05) * 0.25;
  const fire = ctx.createLinearGradient(0, -78, 0, -8);
  fire.addColorStop(0, `rgba(255, 120, 20, ${flicker})`);
  fire.addColorStop(1, `rgba(255, 200, 60, ${flicker * 0.9})`);
  ctx.fillStyle = fire;
  ctx.fillRect(-30, -78, 60, 70);
  ctx.fillStyle = '#ff5a1a';
  ctx.beginPath();
  ctx.moveTo(-18, -10);
  ctx.quadraticCurveTo(-22, -40, -8, -52);
  ctx.quadraticCurveTo(-2, -30, 6, -50);
  ctx.quadraticCurveTo(14, -30, 18, -10);
  ctx.closePath();
  ctx.fill();
  // Danger sign.
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(-16, -92, 32, 14);
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PANAS!', 0, -81);
  ctx.restore();
}

function drawHayBale(ctx, item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.fillStyle = '#d9b45b';
  ctx.beginPath();
  ctx.ellipse(0, -20, 32, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a8862f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -20, 32, 20, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -20, 18, 11, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCorn(ctx, item, golden) {
  ctx.save();
  ctx.translate(item.x, item.y - 34);
  const bob = Math.sin(item.x * 0.03) * 3;
  ctx.translate(0, bob);
  ctx.fillStyle = golden ? '#ffd700' : '#f2b705';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 120, 20, 0.7)';
  for (let r = -1; r <= 1; r += 1) {
    ctx.fillRect(-8, r * 9, 16, 2);
  }
  ctx.fillStyle = '#4a7a2a';
  ctx.beginPath();
  ctx.ellipse(-7, 10, 6, 10, 0.5, 0, Math.PI * 2);
  ctx.ellipse(7, 10, 6, 10, -0.5, 0, Math.PI * 2);
  ctx.fill();
  if (golden) {
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22 + Math.sin(item.x * 0.06) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawKnife(ctx, knife) {
  ctx.save();
  ctx.translate(knife.x, knife.y);
  ctx.rotate(knife.spin);
  // A carving knife, tumbling end over end through the air.
  ctx.fillStyle = '#dfe6ea';
  ctx.beginPath();
  ctx.moveTo(-32, -4);
  ctx.lineTo(12, -7);
  ctx.lineTo(30, 0);
  ctx.lineTo(12, 7);
  ctx.lineTo(-32, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a97a3';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(-32, -6, 14, 12);
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(34, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// -- Actors -----------------------------------------------------------------

function drawPlayer(ctx, world) {
  const p = world.player;
  const jumping = p.jumping;
  drawTurkey(ctx, p.x, p.y, 1, p.runPhase, jumping, p.flash);
  // Shadow on the ground, shrinking while jumping.
  const lift = p.y - LANES[p.lane];
  const shadowScale = Math.max(0.4, 1 + lift / 300);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(p.x, LANES[p.lane] + 4, 40 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  if (world.gobbleAlpha > 0) {
    drawGobblePuff(ctx, p.x + 30, p.y - 150, world.gobbleAlpha);
  }
}

function drawFarmerChase(ctx, world) {
  // The farmer runs behind the turkey; his screen x follows the gap meter.
  // Gap 100 = far back at the left edge, gap 0 = right on the turkey's tail.
  const gap = world.farmerGap;
  const x = 40 + ((100 - gap) / 100) * 200;
  const y = LANES[world.player.lane];
  ctx.save();
  ctx.globalAlpha = 0.35 + (gap / 100) * 0.65;
  drawFarmer(ctx, x, y, 1.05, world.player.runPhase * 0.92, gap < 35);
  ctx.restore();
  // Panic vignette when the farmer is close.
  if (gap < 35) {
    const pulse = 0.10 + (35 - gap) * 0.004;
    const grad = ctx.createRadialGradient(640, 360, 300, 640, 360, 720);
    grad.addColorStop(0, 'rgba(192, 57, 43, 0)');
    grad.addColorStop(1, `rgba(192, 57, 43, ${pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
}

function drawParticles(ctx, world) {
  for (const particle of world.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.ellipse(particle.x, particle.y, particle.size, particle.size * 0.6, particle.life * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFloatingTexts(ctx, world) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px Georgia, serif';
  for (const text of world.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, text.life);
    ctx.fillStyle = text.golden ? '#ffd700' : '#ffffff';
    ctx.strokeStyle = '#6d4423';
    ctx.lineWidth = 4;
    ctx.strokeText(text.text, text.x, text.y);
    ctx.fillText(text.text, text.x, text.y);
    ctx.restore();
  }
}

// -- HUD --------------------------------------------------------------------

function drawHud(ctx, world, ui) {
  const stage = stageFor(world.distance);
  // Top bar: score, distance, lives, farmer gap.
  ctx.save();
  ctx.fillStyle = 'rgba(30, 20, 10, 0.55)';
  roundRect(ctx, 16, 14, 1248, 64, 12);
  ctx.fill();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SKOR ${Math.floor(world.score)}`, 36, 46);
  ctx.font = '20px Georgia, serif';
  ctx.fillText(`Jarak ${Math.floor(world.distance)} / ${GOAL_DISTANCE} m`, 300, 46);
  ctx.fillStyle = '#ffd76a';
  ctx.fillText(stage.name, 620, 46);
  // Lives as hearts.
  ctx.textAlign = 'right';
  ctx.font = '30px Georgia, serif';
  let hearts = '';
  for (let i = 0; i < 3; i += 1) hearts += i < world.lives ? HEART : '\u2661';
  ctx.fillStyle = '#ff5a4e';
  ctx.fillText(hearts, 980, 46);
  // Farmer gap bar: how close Pak Tani is.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  roundRect(ctx, 1000, 30, 170, 18, 9);
  ctx.fill();
  ctx.fillStyle = world.farmerGap < 35 ? '#ff5a4e' : '#f2b705';
  roundRect(ctx, 1000, 30, 170 * (world.farmerGap / 100), 18, 9);
  ctx.fill();
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('PETANI', 1000, 62);
  // Pause / mute hints, under the buttons.
  ctx.textAlign = 'right';
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = 'rgba(255, 248, 231, 0.8)';
  ctx.fillText('P jeda · M bisu', 1244, 130);
  ctx.restore();

  // Buttons (mouse): pause + mute, top-right below the bar.
  ui.buttons = [
    { id: 'pause', x: 1140, y: 84, w: 52, h: 30, label: 'II' },
    { id: 'mute', x: 1200, y: 84, w: 52, h: 30, label: ui.muted ? 'MUTE' : 'SUARA' },
  ];
  for (const button of ui.buttons) {
    ctx.save();
    ctx.fillStyle = 'rgba(30, 20, 10, 0.55)';
    roundRect(ctx, button.x, button.y, button.w, button.h, 8);
    ctx.fill();
    ctx.fillStyle = '#fff8e7';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// -- Title screen -----------------------------------------------------------

function drawTitleScene(ctx, world, ui) {
  // Gobbles, big, centre stage, looking back at the farmer behind him.
  drawTurkey(ctx, 560, 560, 2.1, 1.2, false, false);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(560, 566, 90, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  drawFarmer(ctx, 250, 566, 1.5, 0.8, true);
  drawOven(ctx, { x: 1010, y: 566, kind: KIND_OVEN });

  // Title card.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(30, 20, 10, 0.6)';
  roundRect(ctx, 240, 66, 800, 250, 18);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('GOBBLES', 640, 140);
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('KABUR DARI DAPUR', 640, 196);
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillStyle = '#ffb37a';
  ctx.fillText('Kamis pagi, jam 6 — sehari sebelum Thanksgiving', 640, 240);
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = '#fff8e7';
  ctx.fillText('Pak Tani mengasah pisau. Gobbles harus sampai ke hutan — 1000 meter.', 640, 278);
  ctx.restore();

  // Start button + controls.
  ui.buttons = [
    { id: 'start', x: 490, y: 348, w: 300, h: 64, label: '▶  MULAI LARI' },
  ];
  ctx.save();
  ctx.fillStyle = '#c0392b';
  roundRect(ctx, 490, 348, 300, 64, 14);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 3;
  roundRect(ctx, 490, 348, 300, 64, 14);
  ctx.stroke();
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('▶  MULAI LARI', 640, 380);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 248, 231, 0.92)';
  ctx.font = '19px Georgia, serif';
  ctx.fillText('↑ / ↓  ganti jalur      SPASI  lompat      P  jeda      M  bisu', 640, 448);
  ctx.fillText('Kumpulkan jagung · lompat tumpukan jerami · hindari oven & pisau ukir', 640, 478);
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillStyle = 'rgba(255, 248, 231, 0.75)';
  ctx.fillText('Tiga nyawa. Kalau Pak Tani menyusul — makan malam Thanksgiving.', 640, 640);
  ctx.restore();
}

// -- End screens ------------------------------------------------------------

function drawEndScreen(ctx, world, ui) {
  const escaped = world.endReason === 'escaped';
  ctx.save();
  ctx.fillStyle = 'rgba(20, 12, 6, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(30, 20, 10, 0.85)';
  roundRect(ctx, 290, 130, 700, 400, 20);
  ctx.fill();
  ctx.fillStyle = escaped ? '#7ddc7d' : '#ff8a7a';
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText(escaped ? 'GOBBLES LOLOS!' : 'TERTANGKAP!', 640, 210);
  ctx.fillStyle = '#fff8e7';
  ctx.font = '22px Georgia, serif';
  ctx.fillText(
    escaped
      ? 'Gobbles menembus gerbang hutan tepat sebelum makan malam.'
      : 'Pak Tani menangkap Gobbles — makan malam Thanksgiving jadi.',
    640, 258,
  );
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillStyle = '#ffd76a';
  ctx.fillText(`Skor akhir: ${world.endScore}`, 640, 320);
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = '#fff8e7';
  ctx.fillText(`Jarak: ${Math.floor(world.distance)} m   ·   Nyawa tersisa: ${Math.max(0, world.lives)}`, 640, 360);
  if (world.endScore >= world.best && world.endScore > 0) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText('★ SKOR TERBAIK BARU ★', 640, 398);
  }
  ui.buttons = [
    { id: 'restart', x: 490, y: 430, w: 300, h: 60, label: '↻  LARI LAGI' },
  ];
  ctx.fillStyle = '#2f7a3a';
  roundRect(ctx, 490, 430, 300, 60, 14);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 3;
  roundRect(ctx, 490, 430, 300, 60, 14);
  ctx.stroke();
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('↻  LARI LAGI', 640, 460);
  ctx.restore();
}
