# Gobbles Kabur dari Dapur — Turkey Escape Game

**make.fun competition:** `turkey-run-game-01` — "Make the best turkey escape game"

## The story

Thursday morning, 6 AM, the day before Thanksgiving. Gobbles, the farm's pet
turkey, wakes in the backyard coop to the sound of a knife being sharpened in
the kitchen. He knows what he is on the menu for. One run: across the
farmyard, through the cornfield, to the forest gate — 1000 metres — before
Thanksgiving dinner.

## How to play

- **↑ / ↓ or W / S** — switch lanes
- **Space** — jump (clears hay bales and flying knives)
- **P** — pause, **M** — mute, **Enter** — start / restart
- Mouse: click the on-screen buttons. Touch: tap to jump, swipe to switch lanes.

Collect corn (+10, golden corn +50), dodge the oven (it blocks a whole lane)
and the tumbling carving knife, jump the hay bales. Every hit costs a life
and lets Pak Tani, the farmer with the net, close in. Three hits — or the
farmer catching up — and Gobbles is Thanksgiving dinner. Reach the forest
gate at 1000 m and he is free.

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

No build step, no network requests, no external assets. All art is drawn
procedurally on canvas; all sound is synthesised with WebAudio.

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

