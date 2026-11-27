// turkey-run-game-01 — hand-in script (Node 22+, standard library only).
//
// What this does, in plain terms: the playable game lives in game/ next to
// this file (static files a desktop browser can open offline, no network),
// the screenshots live in screenshots/, and this script packs both into the
// output folder the grader reads, then writes dossier.json there — the
// summary the judge reads, built by the vendored make.fun library.
//
// The game itself is "Gobbles Kabur dari Dapur": a turkey escapes the
// kitchen, dodging falling carving knives and catching corn, with a title
// screen, score, lives, levels, game over and restart.
//
// How to run it outside the grader's container (there MAKEFUN_OUTPUT_DIR
// is /output already):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// To play it locally instead: `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The folder this file sits in, and the folder the entry is handed in to.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const handInDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Put one source folder into the hand-in folder, creating it if needed.
function stageFolder(name: string): void {
  mkdirSync(join(handInDir, name), { recursive: true });
  cpSync(join(repoRoot, name), join(handInDir, name), { recursive: true });
}

mkdirSync(handInDir, { recursive: true });
stageFolder('game');

// Screenshots are optional on disk, but the folder must exist in the output;
// copy them only when the repo actually has some.
mkdirSync(join(handInDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(handInDir, 'screenshots'), { recursive: true });
}

// The caps the scorer itself uses (from its gate.json): only the text cap
// changes what the dossier contains; the rest make this script fail in the
// same places the scorer would refuse the entry — at most 4 screenshots of
// at most 256 KiB each, at most 993 entries / 48 MiB inside game/ (the
// grader caps /output at 1000 entries total, and game/ counts together with
// screenshots/ and dossier.json), and no game path longer than 1000 bytes.
const gateCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

writeFileSync(join(handInDir, 'dossier.json'), buildDossier(handInDir, gateCaps));
