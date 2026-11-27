// Keyboard + mouse input for Gobbles: arrow keys / WASD switch lanes, Space
// jumps, Enter starts and restarts, P pauses, M mutes, and every on-screen
// button is clickable.

import { KEYS } from './config.js';

export function createInput(canvas, hooks) {
  const input = {
    queue: [],
    paused: false,
    muted: false,
  };

  function matches(code, list) {
    return list.includes(code);
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    const code = event.code;
    if (matches(code, KEYS.jump)) {
      event.preventDefault();
      input.queue.push({ type: 'jump' });
      hooks.onJump();
    } else if (matches(code, KEYS.up)) {
      event.preventDefault();
      input.queue.push({ type: 'lane', direction: -1 });
      hooks.onLane(-1);
    } else if (matches(code, KEYS.down)) {
      event.preventDefault();
      input.queue.push({ type: 'lane', direction: 1 });
      hooks.onLane(1);
    } else if (matches(code, KEYS.start)) {
      event.preventDefault();
      hooks.onStart();
    } else if (matches(code, KEYS.pause)) {
      input.paused = !input.paused;
      hooks.onPause(input.paused);
    } else if (matches(code, KEYS.mute)) {
      input.muted = !input.muted;
      hooks.onMute(input.muted);
    } else if (matches(code, KEYS.restart)) {
      hooks.onRestart();
    }
  }

  // Touch: tap the upper half to jump, the lower half to switch lane down,
  // and a swipe up/down to switch lanes. Buttons still work by tap.
  let touchStartY = null;
  function onTouchStart(event) {
    touchStartY = event.touches[0].clientY;
  }
  function onTouchEnd(event) {
    if (touchStartY === null) return;
    const endY = event.changedTouches[0].clientY;
    const dy = endY - touchStartY;
    touchStartY = null;
    if (Math.abs(dy) < 24) {
      hooks.onJump();
    } else {
      hooks.onLane(dy > 0 ? 1 : -1);
    }
  }

  function onClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    hooks.onClick(x, y);
  }

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd, { passive: true });

  return input;
}
