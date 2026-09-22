# 사탄의 키캡 — 바탕화면 프로그램 (Windows)

The website's "🖥 바탕화면 키캡" button saves a `.keycap` file (`{app:"satan-keycap", v:1, hash:"#k=…", image:dataURL|null}`
- the share-link options plus the character picture, made on the user's own computer). This Electron program opens
such files as keycaps floating on the desktop: transparent, frameless, always on top, not on the taskbar.

```bash
npm install          # once
npm start            # sync the page, then run (add a .keycap path to open it)
npm run dist         # sync + build dist/SatanKeycap-Setup.exe (NSIS, one click, per user, .keycap association)
```

- **The keycap is the website's own page.** `sync.js` copies `../keycap/index.html` into `page/` (three.js r128 and the
  Jua font are downloaded next to it, so it works offline) with the sounds. Run `python build.py` in `../keycap` first.
  In the page, `?desktop=1` turns on `DESK` (transparent renderer, no background, no menus) and `src/40-desktop.js`.
- Input (40-desktop.js, capture phase so the page's own turn/pinch never sees it): left click = press, left drag = move
  the window, right drag = turn, right click = our menu, wheel = size.
- **Clicks on the empty part must reach the desktop behind.** After each frame the pixel under the cursor is read
  (`gl.readPixels` right after `render`, before it is shown) and `kc-hit` tells main, which calls
  `setIgnoreMouseEvents(!solid,{forward:true})` - forward keeps mouse moves coming so it can switch back.
- The RGB light must fit inside the window (it was cut off): in the desktop the camera steps back (see Framing below) and
  the floor glow is half size.
- Frames: 60 while pressing/dragging, 30 while spinning, 10 when settled (`DRAW_GATE`).
- **One menu design for everything** (keycap right-click, tray icon, home window): drawn like the owner's desktop-timer
  menu (ena-mascot `_pm_open`) - white card, thin ring, one-tone icons in round badges, dotted separators, ticks, a pill
  band for quitting - in dark gray / light gray (requested; not the keycap colour). `ui/menu.html` builds its rows from
  `st.mode` ("keycap" | "tray"). The menu is its own window next to the cursor, closed on blur - **don't show()/focus()
  it again once visible** (Windows blurs it, and blur closes it: the 크기 side menu closed the whole menu). The window
  always has room for the 크기 side menu (resizing it later didn't take).
- Several keycaps at once: every file is its own window, and 하나 더 띄우기 opens the same file again as copy n
  (`state.open` keeps `[file, copy]`), placed beside the original on the side with room.
- Framing in the window (`fitView`, after every rebuild): the unrotated bounding box of everything on the tester is
  swept around y and its corners projected; zoom and vertical pan are searched so they stay inside a 0.9 NDC margin.
  Fixed numbers were wrong as soon as a tall stand or a floating heart came along (cut off).
- 위치·크기 고정 (`kcLock`, saved per window): main ignores kc-move / kc-zoom. The menu window is placed where it was
  opened (`menuAt`) - re-reading the cursor on every resize made it run away from the cursor.
- Long runs: no warm-up in the desktop, `powerPreference:low-power`, frames 60/25/30 (cursor over)/10 (animating)/2
  (still). Measured: two keycaps + menu, presses every 4 s for 2 min - memory 637 → 627 MB (flat after the first
  minute), ~17% of one core while both spin, ~7% idle. `__k.shot()` sets PAUSE - don't use it before an fps test.
- 키캡 수정하기: `openEditor` opens the full page (local copy, `--kc-edit` → `window.KEYCAP_EDIT`) with the keycap's data;
  its 바탕화면 키캡 button sends the JSON over IPC (`kc-save`) and main writes it over the keycap's file and reloads every
  window showing it. A blob download from the kc:// scheme ends "interrupted" - don't go back to will-download.
- 연결고리 (chain) can be taken off per keycap (`kcChain`, saved; `kc-cmd chain-on/off` hides the `chain` group and refits).
- `kc://app/…` serves `page/` (and `/ui/…` from `ui/`); `KC_POS="x,y"` puts every window there and `KC_DATA` gives a
  separate state folder - **tests use both, on the Dell monitor** (see ena-mascot/tests/dellmon.py), never the main screen.
- App icon: `build/icon.png/.ico` is a render of `build/icon.keycap` (the owner's own keycap) in desktop mode with the chain
  and shadow hidden (`__k.chain/shadow`), cropped to its alpha box - remake it the same way if the look changes.
- Releases: upload `dist/SatanKeycap-Setup.exe` to a GitHub release of this repo with exactly that name; the site links
  to `releases/latest/download/SatanKeycap-Setup.exe`. Not code-signed: Windows shows "PC 보호" (추가 정보 → 실행).
