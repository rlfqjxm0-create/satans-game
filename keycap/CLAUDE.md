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
| Glitter (3D flakes) | `glitterGeo/glitterMat/makeParticles/stirParticles/stepParticles` |
| Switch tester model | block, `cavity`, `bot` (housing), `topHousing`, `spring`, `stem`, chain (`chain` group) |
| Base + name sticker | `baseMaterial()`, `applyBase()`, `nameSticker()` |
| RGB light | `applyRGB(t)` — modes off/solid/breath/rainbow |
| Background | `setBg()` (vertical gradients in `BGS`, or an uploaded image) |
| Camera | `CAM` {zoom,panX,panY,locked}, `camApply()`, pointer handlers (1 finger turn, 2 fingers pinch/pan, wheel zoom, right-drag pan), `resetView()` |
| Press + sounds | `pressKey()`, `sfx(kind)`; own recordings via `loadSoundFiles()` → see `sounds/README.md` |
| Share link | `writeHash()/readHash()` (options only; the character image is never uploaded anywhere) |

Colours: always go through `lin(hex)` (sRGB → linear) before giving them to three.js, otherwise
pastels wash out.

Transparent things: resin/jelly/acrylic use `transmission` with `depthWrite:false`. Anything that
must be visible *through* them (character plane, glitter) must be **opaque** (use `alphaTest`, not
`transparent`), because r128's transmission pass only captures opaque objects.

## Next task the owner has in mind

Replace the synthesized switch sounds with her own recordings. The hook already exists:
put files in `sounds/` using the names in `sounds/README.md`; `sfx()` prefers them and falls back
to the synth. Things that may be worth doing while there:
- per-material variation (e.g. a deeper sound for resin/jelly — the synth already does this via `deep`)
- a "sound pack" option chip if she records more than one set.

## Deploying into the game site

Copy `index.html` (+ `sounds/` if used) into `satans-game/keycap/`, then add a card for it in the hub
`satans-game/index.html` next to "사탄의 세탁" (same markup as that card; link `keycap/index.html`).
Other games in that repo use the same look (white/pastel page, Jua + Noto Sans KR fonts).

## Known limits / gotchas

- Performance: transmission renders the scene twice. If phones stutter, lower `renderer.setPixelRatio`
  or offer a "light mode" that swaps resin/jelly for non-transmissive glossy materials.
- `acrylicOutline()` traces the image alpha; images with an opaque background become a rectangle
  (the page opens a background-eraser for such images).
- `00-math.js`, `01-shapes.js`, `02-characters.js` are shared with the owner's other mini-games and
  contain some unused helpers (laundry drum, 2D props). Safe to prune if they get in the way.
