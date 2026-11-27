# turkey-run-game-01

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/redsparksz/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/redsparksz/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

## The game

Thursday morning, 6 AM, the day before Thanksgiving. Gobbles the turkey wakes in the backyard coop to the sound of a knife being sharpened in the kitchen — and he knows exactly what he is on the menu for. So he runs: 1000 metres across the farmyard, through the cornfield, to the forest gate, before Thanksgiving dinner is served.

Dodge the farmer with his net, the oven blocking a whole lane, and tumbling carving knives; jump the hay bales. Grab corn along the way (+10, golden corn +50). Every hit costs one of Gobbles' 3 lives and lets the farmer close in — three hits, or the farmer catching up, and Gobbles is dinner. Reach the forest gate at 1000 m and he is free.

## Controls

- **↑ / ↓ or W / S** — switch lanes
- **Space** — jump (clears hay bales and flying knives)
- **P** — pause, **M** — mute, **Enter** — start / restart
- Mouse: click the on-screen buttons. Touch: tap to jump, swipe to switch lanes.

## Screenshots

Deterministic scenes of the real game (same seed, same frame every time):

- `?shot=start` — title screen
- `?shot=play` — mid-run, farmer closing in, oven and knife ahead
- `?shot=escaped` — the forest gate, Gobbles free
- `?shot=caught` — caught, with restart

Add `&seed=N` to change the dealt farmyard.

## Run it

```sh
node serve.ts   # serves game/ on http://localhost:8080
```

No build step, no network requests, no external assets. All art is drawn procedurally on canvas; all sound is synthesised with WebAudio. Use `node serve.ts --port <n>` to pick a different port.

## Files

- `game/index.html` — the page
- `game/src/config.js` — tuning, stages, lanes
- `game/src/random.js` — seeded RNG
- `game/src/audio.js` — procedural WebAudio (gobbles, footsteps, dawn music)
- `game/src/turkey.js` — the turkey and the farmer, drawn from shapes
- `game/src/world.js` — state, spawning, collisions, autopilot
- `game/src/render.js` — dawn farmyard, hazards, HUD, menus
- `game/src/input.js` — keyboard, mouse, touch
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — bootstrap and fixed-step loop
- `main.ts` — the make.fun hand-in program (copies game/ + screenshots/)

## License

MIT — see `LICENSE`.

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
