# 사탄의 키캡 (Satan's Keycap)

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

Transparent things: resin/jelly/acrylic use `transmission` with `depthWrite:false`. **In r128
`transmission` is not refraction - it only lowers the surface's alpha** (see meshphysical_frag), so
whatever sits inside is drawn directly and then blended over. Keep things inside the resin (character
print, glitter) **opaque** so they sort before the cap, and give cut-out pictures `alphaToCoverage:true`
(+ a tiny `alphaTest`): a plain alphaTest leaves pixel-stepped outlines, alpha-to-coverage lets the
antialiasing smooth them.

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

## Shapes and character placement

`PROFILES`: 체리, 푸딩 (replaced SA), 동글, 하트, 고양이 얼굴, 토끼 얼굴. **Every top is flat** (dish 0, dome 0) by request.
The face shapes (고양이/토끼 얼굴) are ordinary rounded bodies with `ears`: `capEars()` stands them straight up
from the back of the flat top, using the cap's own material object (colour, finish, glow apply), plus a
pink inner ear. Shapes are in `CAP_EARS`. (Ears drawn into the top-down outline lay flat and pointed
backwards - don't go back to that.) `FIXED_SEC` lists outlines that are the same at every height (heart). `charPos`: 레진 속에 세우기 (`inside`) /
눕히기 (`lie`, sized like the top print) / 윗면 프린트 / 아크릴 스탠드 - the first two and the stand all use the
same `acrylic()` cut-out piece. The name sticker takes its colours from the keycap colour (`nameSticker`).

## Glitter (table-driven)

`GLITTERS` has one row per kind: count, size, sink speed, shape, and optionally `glow` (a soft light in
the flake's own shape, drawn on an instanced plane that tumbles with the flake - so a star glows as a
star; `glitGlowTex` blurs the outline with canvas shadowBlur) or `flutter` (petals drift sideways) or
`multi` (confetti colours via instanceColor). `S.glitColor` ("" = each kind's own colour) re-tints any
kind; materials are cached per kind+colour. To add a kind: a row in `GLITTERS`, a base colour in
`GLIT_BASE`, its unit radius in `GLIT_R`, a shape in `glitterGeo`, a material in `glitterMat`, a label
in `OPT.glitter` - then run `node sim_check.js`.

**Containment is proven by `sim_check.js`** (run it from this folder after any glitter or cap change):
every kind x every shape x flat/normal top, 3000 frames with a press every 20. Sides use the section
outline (`fenceTable/fenceLim`), the top uses the real surface (`capTopY` - dished SA/round, domed heart,
rounded edges) and each flake's reach as it is tilted right now (`hv`). Spin is applied *before* the
limits, otherwise a flake tips out after being checked (that was the "pokes out when pressed" bug).

## Glow mode (야광)

`S.glow`: `applyGlow(t)` dims the three lights and gives the cap (in its own colour) and the glitter an
emissive glow that breathes slowly; turning it on switches the background to night. In the share link as `gl`.

## Decorations

Ears and horns are seated on the lowest point of the real top under their base (`seat`), and shrink
with small tops (`fit`, SA). Horns grow straight up from a level base ring just under the surface - never
clamp their vertices flat again (that shaved the base off). Geometry is cached in `DECO_GEO` via `GEO()`.

## Video export

"돌아가는 영상" replaced the silent 360° GIF: the image card's framing (4:5, `cardOverlay`), one slow
turn over 8 s with three presses, recorded with `MediaRecorder` (mp4 first, else webm). Every sound goes
through `outNode(a)` so it can also feed a `MediaStreamDestination`; new sounds must connect there, not
to `a.destination`. The GIF encoder is no longer part of this page.

## Caches and first-use warm-up

`CAP_GEO` (cap shapes), `DECO_GEO`, `GLIT_GEO/GLIT_MAT/GLOW_*`, `CHAR_TEX` (the character picture is
uploaded once per slot; a new picture frees the old one) are all registered with `keep()`, so
`freeTree()` leaves them alone. `warmUp()` builds every look once and compiles it, so the first click on
e.g. 홀로그램 no longer freezes (0.37~0.69 s measured before). **A compile always blocks in r128**
(`getProgram` reads the uniforms back right away, `checkShaderErrors=false` doesn't change that), so the
steps only run while nothing moves - the first seconds before the self-spin starts (the spin waits for
`warmDone`, 12 s at most) or while the view is scrolled away. Running them during the spin was the
"auto-rotate stutters" report. It snapshots `S` at every step - never restore an older snapshot, or it undoes what the
user just picked. The compiled programs stay alive because their materials are kept in `WARM_KEEP`.

## First press

The chosen switch's sounds start downloading immediately on load. A press that arrives before they are
decoded waits for them (up to 0.7 s) instead of playing the synth - `PACK_DONE` tells "still loading"
from "failed" (only then does the synth play, e.g. when the page is opened as a file).

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
