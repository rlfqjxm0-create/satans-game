#!/usr/bin/env python3
"""Builds index.html (one self-contained file) from src/.

    python3 build.py

Order matters: later modules use helpers defined in earlier ones.
"""
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
MODULES = [
    "00-math.js",        # clamp/lerp/ease, seeded random, hash (plus unused laundry drum helpers)
    "01-shapes.js",      # 2D canvas helpers: rrect, star4/5, heart, speech bubble ... (shared with other games)
    "02-characters.js",  # character image handling, black-cat placeholder, drawChar, warpSource
    "10-keycap.js",      # ★ the keycap maker: three.js scene, geometry, materials, deco, glitter, RGB, sounds, UI
    "20-files.js",       # file upload -> character item (+ background cleanup)
    "21-eraser.js",      # background-eraser modal
    "25-gifworker.js",   # GIF encoding in a Web Worker (the page keeps moving while it works)
    "30-export.js",      # PNG card, 360° GIF, save/download
]
THREE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"

def main():
    head = (SRC / "head.html").read_text(encoding="utf-8")
    gifenc = (SRC / "vendor" / "gifenc.js").read_text(encoding="utf-8")
    js = "\n".join((SRC / m).read_text(encoding="utf-8") for m in MODULES)
    html = (
        head
        + f'<script src="{THREE_CDN}"></script>\n'
        + "<script>\n/* gifenc 1.0.3 (MIT) by Matt DesLauriers */\nwindow.gifenc=(function(){var exports={};\n"
        + gifenc + "\nreturn exports;})();\n</script>\n"
        + '<script>\n(function(){\n"use strict";\n' + js + "\n})();\n</script>\n</body>\n</html>\n"
    )
    (ROOT / "index.html").write_text(html, encoding="utf-8", newline="\n")  # LF on every OS
    print(f"index.html written ({len(html)//1024} KB)")

if __name__ == "__main__":
    main()
