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
- The RGB light must fit inside the window (it was cut off): in the desktop the camera steps back (`CAM.zoom=1.22`) and
  the floor glow is half size.
- Frames: 60 while pressing/dragging, 30 while spinning, 10 when settled (`DRAW_GATE`).
- The right-click menu and the home window are our own small HTML pages (`ui/`, the site's colours, Jua) - the user
  asked for a cute program, not the plain Windows menu. The menu is its own window next to the cursor, closed on blur.
- `kc://app/…` serves `page/` (and `/ui/…` from `ui/`); `KC_POS="x,y"` puts every window there and `KC_DATA` gives a
  separate state folder - **tests use both, on the Dell monitor** (see ena-mascot/tests/dellmon.py), never the main screen.
- Releases: upload `dist/SatanKeycap-Setup.exe` to a GitHub release of this repo with exactly that name; the site links
  to `releases/latest/download/SatanKeycap-Setup.exe`. Not code-signed: Windows shows "PC 보호" (추가 정보 → 실행).
