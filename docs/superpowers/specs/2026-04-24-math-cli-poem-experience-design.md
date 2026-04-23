# math-cli: A Stroll Through the Mathbook

**Date:** 2026-04-24
**Status:** Design

## Purpose

Transform `@tiny-build/math-cli` from a scaffolding demo into a keyboard-navigable terminal storybook that walks the user (Math) through the poem *"For Math, and Her Mathbook"* one stanza at a time. A tiny ASCII girl sprite walks along a path between scenes. Each scene is hand-animated to fit the mood of its stanza. The experience should be beautiful, cozy, fun, and a genuine mood-lifter.

## Experience

A single-screen Ink app. The screen has three horizontal regions:

1. **Header** — shimmering "✦ math-cli — for Math, with 🌸 ✦" title in Catppuccin gradient, plus a scene indicator (`scene 3 / 8`).
2. **Stage** — the main animated area where the current stanza and its scene-specific animation render.
3. **Path** — the bottom strip where the sprite walks. Between scenes she visibly walks from left to right along dots `· · · · ·` with a "loader" message floating above her.

### Scenes (one per stanza, 8 total)

| # | Stanza cue | Animation |
|---|---|---|
| 1 | "In a world of code where ideas took shape…" | Typewriter reveal; title shimmers pink → mauve → blue |
| 2 | "With fingers that danced on keys late at night…" | ASCII laptop with glowing screen, sparkles `✦ ⋆ ·` pop around it |
| 3 | "Yet even the brightest can flicker and fade…" | Text dims and flickers briefly (opacity wobble via dim/undim), then steadies |
| 4 | "But Math, oh Math, don't you see it's still true?" | Warm peach/yellow glow fades up; tiny hearts `♥` float upward |
| 5 | "Since January's dawn, not so long ago…" | A progress bar fills from `I can't ▱▱▱▱▱▱▱` → `I found a way ▰▰▰▰▰▰▰` |
| 6 | "A year and a half, yet the growth is so wide…" | Random stars twinkle, then lines connect them into a constellation behind the stanza |
| 7 | "So when motivation feels distant and thin…" | Stanza fades in line by line in lavender; subtle breathing effect |
| 8 | "You're not just a dev…" / "Remember your name. ✨" | Large animated `M A T H ✦` with sparkle burst, then footer: `made with 🌸 by Terminal Dude`, plus replay/quit hints |

### Navigation (manual-advance default)

- `→` or `Space` — next scene (sprite walks forward, brief loader, next scene renders)
- `←` — previous scene
- `r` — replay current scene's animation from the start
- `q` or `Ctrl+C` — quit with a sweet goodbye message

No auto-play mode in v1 — manual advance only, as requested.

### Loader messages (shown while sprite walks between scenes, ~900ms)

Pick one at random from:
- `wait da — buffering for your tiny yet crazy brain…`
- `thinking of how to annoy you…`
- `recompiling feelings…`
- `fetching sparkles from the void…`
- `asking the stars nicely…`
- `loading stanza.exe with love…`
- `polishing the next scene…`
- `tying ribbons on the pixels…`

### Sprite

A small ASCII girl figure, rendered in Catppuccin pink. Two frames alternate during walking to give a bobbing gait:

```
Frame A:   o       Frame B:   o
          /|\                 /|\
          / \                  \ \
```

Standing still at a scene, she uses Frame A. Walking, she alternates every ~150ms and her x-position advances across the path.

## Architecture

All in `packages/cli`, extending the existing Ink + React setup. No new packages.

```
packages/cli/src/
  index.tsx                  # App shell, scene state, key handling
  theme.ts                   # Catppuccin Mocha palette constants
  poem.ts                    # Poem text as array of stanzas
  loaders.ts                 # Loader message pool
  components/
    Sprite.tsx               # The walking girl
    Path.tsx                 # Bottom path + sprite + loader message
    Header.tsx               # Title + scene indicator
    Typewriter.tsx           # Character-by-character text reveal
    Stanza.tsx               # Default stanza renderer (fade-in)
    Sparkles.tsx             # Randomly-positioned twinkle characters
    Hearts.tsx               # Floating hearts rising upward
    Constellation.tsx        # Stars + connecting lines
    ProgressBar.tsx          # I can't → I found a way
    Fireworks.tsx            # Scene 8 sparkle burst
  scenes/
    Scene1Opening.tsx
    Scene2Mathbook.tsx
    Scene3LateNight.tsx
    Scene4Doubt.tsx
    Scene5Reassurance.tsx
    Scene6Journey.tsx
    Scene7Constellations.tsx
    Scene8Finale.tsx
    index.ts                 # scene registry: ordered array of components
```

### State model

`index.tsx` owns:
- `sceneIndex: number` (0..7)
- `phase: 'walking' | 'onStage'`
- `loaderMessage: string` (picked fresh on each walk)
- `replayKey: number` (bumped on `r` to remount the current scene and restart its animation)

Transitions:
- `→` / `Space`: if `onStage` and not at last scene → set `phase='walking'`, pick loader, after ~900ms set `phase='onStage'` and `sceneIndex++`
- `←`: mirror, decrement
- `r`: `replayKey++`
- `q`: print goodbye, exit

### Component interfaces

Each scene component is a plain React component with no props. It reads its stanza from `poem.ts` by index. This keeps scenes self-contained — each one owns its animation timers and cleans them up on unmount.

Shared components take minimal props:
- `<Typewriter text={string} speed={ms} onDone?={() => void} />`
- `<Sprite frame="A" | "B" />`
- `<ProgressBar value={0..1} label={string} />`
- `<Sparkles count={number} />`

## Theme

Catppuccin Mocha palette in `theme.ts`:

```ts
export const theme = {
  base:     '#1e1e2e',
  mantle:   '#181825',
  text:     '#cdd6f4',
  subtext:  '#a6adc8',
  overlay:  '#6c7086',
  pink:     '#f5c2e7',
  mauve:    '#cba6f7',
  red:      '#f38ba8',
  peach:    '#fab387',
  yellow:   '#f9e2af',
  green:    '#a6e3a1',
  teal:     '#94e2d5',
  sky:      '#89dceb',
  blue:     '#89b4fa',
  lavender: '#b4befe',
};
```

Each scene picks 2–3 palette colors so scenes feel distinct.

## Error handling & edge cases

- **Non-TTY stdin:** existing code guards with `process.stdin.isTTY`. Keep the guard; if no TTY, still render but don't call `setRawMode`.
- **Terminal too narrow:** if `process.stdout.columns < 60`, render a soft message: `"the stage needs a bit more room — please widen the terminal 💕"` and skip animations. Re-check on SIGWINCH.
- **Animation timers:** every `useEffect` that sets an interval/timeout must return a cleanup. Scenes unmount on navigation — no dangling timers.
- **Replay:** changing `replayKey` forces React to remount the scene, which resets all its animation state cleanly. No need for imperative reset APIs.

## Testing

This is a visual/animated app — automated tests add little value vs. the cost. We verify by running the CLI manually:

- `pnpm nx run cli:build && node packages/cli/dist/src/index.js`
- Walk through all 8 scenes forward with `→`
- Walk back with `←`
- Replay each scene with `r`
- Resize terminal narrow (<60 cols) and confirm graceful message
- Quit with `q` and with `Ctrl+C`

Typecheck and biome lint must pass: `pnpm typecheck && pnpm lint`.

## Out of scope (v1)

- Auto-play mode
- Sound / terminal bell
- Additional poems or a poem menu
- Persisting "last scene visited"
- Config file / CLI flags

These are easy follow-ups if she wants them later.

## Signature

Scene 8 ends with: `made with 🌸 by Terminal Dude`
