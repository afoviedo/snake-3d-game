# 3D Snake Game

A fast, playable 3D Snake game for the browser built with Codex in about 15 minutes.

This repo is meant to showcase what Codex can scaffold, implement, and validate quickly: game logic, 3D rendering, UI flow, and automated browser checks.

## Demo Highlights

- 3D board rendered with Three.js
- Classic Snake gameplay (movement, food, growth, collisions)
- Score + best score tracking
- Start screen, HUD, and game-over flow
- Pause, restart, and fullscreen support
- Deterministic hooks for automated game testing (`render_game_to_text`, `advanceTime`)

## Tech Stack

- HTML5 + CSS3
- JavaScript (ES Modules)
- Three.js
- Node.js (for local dev server)
- Playwright (used for automated validation during development)

## Run Locally

### 1. Clone

```bash
git clone https://github.com/afoviedo/snake-3d-game.git
cd snake-3d-game
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start server

```bash
npm start
```

Then open:

- http://127.0.0.1:5173

## Controls

- Move: `Arrow Keys` or `W A S D`
- Start: `Enter` / `Space` or click **Start Game**
- Pause: `P`
- Restart: `R` (and `Enter` / `Space` on game-over)
- Fullscreen toggle: `F`
- Exit fullscreen: `Esc`

## Project Structure

- `index.html` - UI layout and game entry point
- `styles.css` - visual design and overlay styling
- `game.js` - 3D scene, game loop, input handling, game state
- `progress.md` - development notes captured while building with Codex

## Why This Repo Exists

This project is a public, practical example of rapid prototyping with Codex:

- taking a one-line prompt,
- delivering a full browser game,
- and validating behavior with automated browser runs.

If you're evaluating Codex for development speed, this is intended to be a concrete reference.

## License

MIT
