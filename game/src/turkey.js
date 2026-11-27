// Procedural art for the two actors: Gobbles the turkey and Pak Tani, the
// farmer with the net. Everything is drawn from shapes — no image files — so
// the game loads nothing over the network.

/** Draw Gobbles at (x, y) = feet position, facing right, mid-stride. */
export function drawTurkey(ctx, x, y, scale, runPhase, jumping, hurtFlash) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const legSwing = jumping ? 0.5 : Math.sin(runPhase) * 0.55;
  const bodyBob = jumping ? -6 : Math.abs(Math.sin(runPhase)) * -3;

  // Tail feathers, fanned behind (the turkey's pride, even while fleeing).
  const featherColors = ['#8b5a2b', '#a06a35', '#c98a3d', '#7a4a22', '#b5772f'];
  ctx.save();
  ctx.translate(-26, -34 + bodyBob);
  for (let i = 0; i < 5; i += 1) {
    const angle = -0.9 + i * 0.45;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = featherColors[i];
    ctx.beginPath();
    ctx.ellipse(0, -26, 9, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c37a';
    ctx.beginPath();
    ctx.ellipse(0, -40, 4, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Legs: two orange sticks, mid-stride.
  ctx.strokeStyle = '#e07b2a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -16 + bodyBob);
  ctx.lineTo(-6 + legSwing * 16, 0);
  ctx.moveTo(6, -16 + bodyBob);
  ctx.lineTo(6 - legSwing * 16, 0);
  ctx.stroke();

  // Body: a plump brown oval, slightly tilted forward by the run.
  ctx.save();
  ctx.translate(0, -34 + bodyBob);
  ctx.rotate(0.12);
  const bodyGrad = ctx.createLinearGradient(0, -26, 0, 26);
  bodyGrad.addColorStop(0, '#a9713a');
  bodyGrad.addColorStop(1, '#6d4423');
  ctx.fillStyle = hurtFlash ? '#ff5a4e' : bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing: a darker flap that lifts with the stride.
  ctx.fillStyle = hurtFlash ? '#ff7a6e' : '#7a4a22';
  ctx.beginPath();
  ctx.ellipse(-4, -2 + legSwing * 3, 20, 13, -0.35 + legSwing * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Neck + head, craned forward, looking back over the shoulder.
  ctx.save();
  ctx.translate(20, -56 + bodyBob);
  ctx.strokeStyle = '#c98a5a';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.quadraticCurveTo(6, -6, 2, -14);
  ctx.stroke();
  // Head.
  ctx.fillStyle = hurtFlash ? '#ff5a4e' : '#d98a6a';
  ctx.beginPath();
  ctx.arc(2, -18, 11, 0, Math.PI * 2);
  ctx.fill();
  // Beak, pointing right (the way out).
  ctx.fillStyle = '#f2b705';
  ctx.beginPath();
  ctx.moveTo(10, -20);
  ctx.lineTo(24, -15);
  ctx.lineTo(10, -12);
  ctx.closePath();
  ctx.fill();
  // Wattle, bright red.
  ctx.fillStyle = '#d62828';
  ctx.beginPath();
  ctx.ellipse(12, -8, 4, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Wide, worried eye.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(5, -21, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(6.5, -21, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/** Draw the farmer at (x, y) = feet position, running right with his net. */
export function drawFarmer(ctx, x, y, scale, runPhase, angry) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const legSwing = Math.sin(runPhase) * 0.6;
  const bob = Math.abs(Math.sin(runPhase)) * -3;

  // Legs: denim overalls, pumping hard.
  ctx.strokeStyle = '#3a5a8c';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -34 + bob);
  ctx.lineTo(-4 + legSwing * 18, 0);
  ctx.moveTo(5, -34 + bob);
  ctx.lineTo(5 - legSwing * 18, 0);
  ctx.stroke();

  // Body: red plaid shirt, leaning forward into the chase.
  ctx.save();
  ctx.translate(0, -52 + bob);
  ctx.rotate(0.22);
  ctx.fillStyle = angry ? '#b32020' : '#c0392b';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  // Plaid stripes.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, -10);
  ctx.lineTo(18, -10);
  ctx.moveTo(-20, 6);
  ctx.lineTo(20, 6);
  ctx.moveTo(-6, -24);
  ctx.lineTo(-6, 24);
  ctx.moveTo(8, -24);
  ctx.lineTo(8, 24);
  ctx.stroke();
  // Overall straps.
  ctx.strokeStyle = '#2c4a73';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-12, -24);
  ctx.lineTo(-8, -2);
  ctx.moveTo(12, -24);
  ctx.lineTo(8, -2);
  ctx.stroke();
  ctx.restore();

  // Head + straw hat, shouting.
  ctx.save();
  ctx.translate(14, -82 + bob);
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  // Beard.
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.ellipse(2, 9, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Angry eyes under the hat brim.
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(4, -3, 2, 0, Math.PI * 2);
  ctx.arc(11, -3, 2, 0, Math.PI * 2);
  ctx.fill();
  // Open shouting mouth.
  ctx.fillStyle = '#7a1f1f';
  ctx.beginPath();
  ctx.ellipse(8, 6, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Straw hat.
  ctx.fillStyle = '#d9b45b';
  ctx.beginPath();
  ctx.ellipse(0, -10, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -14, 12, 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#8a6d2f';
  ctx.fillRect(-12, -13, 24, 3);
  ctx.restore();

  // The net, held high in the right hand, ready to scoop.
  ctx.save();
  ctx.translate(24, -66 + bob);
  ctx.rotate(-0.5 + Math.sin(runPhase * 0.5) * 0.12);
  ctx.strokeStyle = '#6d4c2f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(14, -18);
  ctx.stroke();
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(22, -26, 16, 12, 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, -22);
  ctx.lineTo(36, -30);
  ctx.moveTo(10, -32);
  ctx.lineTo(34, -20);
  ctx.moveTo(22, -38);
  ctx.lineTo(22, -14);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/** A small "GOBBLE!" speech puff above the turkey, for comic timing. */
export function drawGobblePuff(ctx, x, y, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fff8e7';
  ctx.strokeStyle = '#6d4423';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, 44, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 30, y + 12);
  ctx.lineTo(x - 18, y + 26);
  ctx.lineTo(x - 12, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6d4423';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GOBBLE!', x, y + 1);
  ctx.restore();
}
