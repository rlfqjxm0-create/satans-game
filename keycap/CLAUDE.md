# 사탄의 키캡 공방 (Satan's Keycap Workshop)

A single-page 3D "artisan keycap" maker. Users upload a character image and customise a keycap
that sits on a keychain switch tester; they can spin it, press it (it clicks and the glitter swirls
like a snow globe), and save a PNG card or a 360° GIF. It is part of the owner's mini-game site
"사탄의 게임" (GitHub Pages repo `rlfqjxm0-create/satans-game`), where it should live in a `keycap/` folder.

UI copy is Korean, friendly and short. Keep it that way.

## Build / run

```bash
python3 build.py            # src/ -> index.html (one self-contained file; three.js r128 from cdnjs)
python3 -m http.server 8000 # then open http://localhost:8000  (needed for sounds/ to load)
```

- Never hand-edit `index.html`; edit `src/` and rebuild.
- No bundler, no npm. Plain browser JS in one IIFE with `"use strict"`. Modules are concatenated
  in the order listed in `build.py`; later files use helpers from earlier ones.
- three.js is pinned to **r128** (UMD global `THREE`). Don't bump it casually: the hologram shader
  patch (`holoize`) and `MeshPhysicalMaterial.transmission` behaviour depend on this version.
  r128 has no `CapsuleGeometry`, no `thickness/ior/attenuation`, no OrbitControls in core.

## Where things are (`src/10-keycap.js`)

| What | Look for |
|---|---|
| All user choices | `const S={...}` (state) and `OPT` (labels shown on chips) |
| Keycap shapes | `PROFILES` + `section()` (cross-section: super-ellipse or heart) + `capGeometry()` |
| Keycap materials | `capMaterial()`; shared `surfMat(kind,hex)`; hologram = `holoize(mat)` |
| Character placement | `buildChar()` — `inside` (plane in resin), `top` (print clipped to the top outline), `stand` (acrylic cut by `acrylicOutline()`) |
| Top decorations | `buildDeco()`; `sitOn()` keeps a deco's bottom exactly on the top face |
| Glitter (3D flakes) | `glitterGeo/glitterMat/makeParticles/stirParticles/stepParticles`; fenced by `fenceTable/fenceLim`; star-dust halo `starGlow/twinkle` |
| Switch tester model | block, `cavity`, `bot` (housing), `topHousing`, `spring`, `stem`, chain (`chain` group) |
| Base + name sticker | `baseMaterial()`, `applyBase()`, `nameSticker()` |
| RGB light | `applyRGB(t)` — modes off/solid/breath/rainbow |
| Background | `setBg()` (vertical gradients in `BGS`, or an uploaded image) |
| Camera | `CAM` {zoom,panX,panY,locked}, `camApply()`, pointer handlers (1 finger turn, 2 fingers pinch/pan, wheel zoom, right-drag pan), `resetView()` |
| Press + sounds | `pressKey()`, `sfx(kind)`; recorded packs `PACKS` / `loadPack()` / `pickSound()` / `previewSwitch()` → see `sounds/README.md` |
| Share link | `writeHash()/readHash()` (options only; the character image is never uploaded anywhere) |

Colours: always go through `lin(hex)` (sRGB → linear) before giving them to three.js, otherwise
pastels wash out.

Transparent things: resin/jelly/acrylic use `transmission` with `depthWrite:false`. Anything that
must be visible *through* them (character plane, glitter) must be **opaque** (use `alphaTest`, not
`transparent`), because r128's transmission pass only captures opaque objects.

## Switch sounds (done)

The five switches are the owner's own keyboard recordings (the same packs her desktop timer uses),
one folder each under `sounds/`. `PACKS` lists how many files each has and a `gain` that evens out
their loudness. Each press picks a different key clip (never one of the last two), now and then a
space/enter/shift/backspace, so it sounds like typing. Only the chosen switch's folder is fetched;
decoding goes through an `OfflineAudioContext` so it needs no user gesture and is ready before the
first press. `previewSwitch()` waits for a new pack before its demo press, so switching never plays
the synth. The synth in `sfx()` is only the fallback for when the files can't load (opened as a file).
Old share links with `red/brown/blue` fall back to the default switch (`readHash` checks every option).

## Glitter must stay inside the cap

Flakes are fenced by the cap's real cross-section: `fenceTable(p)` stores, for 180 angles, how far the
outline is from the centre (the heart's concave notch also looks 6° either side), and
`fenceLim = min(0.72·R·w, R·w − 1.3)` keeps a flake centre ≥1.3 inside the wall. The old square box
let flakes out of the heart (and the round cap's corners). If you add a cap shape, run a headless
shake test (all glitter kinds × shapes, thousands of frames) and count flakes outside the outline.

## Performance rules (keep them when editing)

- **Free what `rebuild()` throws away.** It runs on every option click. `freeTree()` disposes the old
  geometry/materials/textures; anything built once and shared must be registered with `keep()`
  (glitter geo/mats, glow texture/material, NOISE, env map…) or it will be freed while still in use.
  Check with `__k.renderer.info.memory` after ~50 option clicks — it must stay flat.
- Typing the name only calls `applyBase()` (the sticker), not `rebuild()`.
- The loop skips drawing while the 3D view is off screen (`ONSCREEN`, IntersectionObserver). Exports
  render on their own, so they are unaffected.
- No `preserveDrawingBuffer`: every read (PNG, GIF, `__k.shot`) copies the canvas right after its own
  render in the same task. Keep it that way — reading the canvas later would get a blank image.

## Deploying into the game site

This folder *is* `satans-game/keycap/` now (source, build script and built page together). Edit `src/`,
run `python build.py`, commit both. The hub card is in `satans-game/index.html`.

## Known limits / gotchas

- Performance: transmission renders the scene twice. If phones stutter, lower `renderer.setPixelRatio`
  or offer a "light mode" that swaps resin/jelly for non-transmissive glossy materials.
- `acrylicOutline()` traces the image alpha; images with an opaque background become a rectangle
  (the page opens a background-eraser for such images).
- `00-math.js`, `01-shapes.js`, `02-characters.js` are shared with the owner's other mini-games and
  contain some unused helpers (laundry drum, 2D props). Safe to prune if they get in the way.
