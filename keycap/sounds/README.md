# 타건음

스위치마다 폴더가 하나씩 있고, 안에 직접 녹음한 키보드 소리가 들어 있어요.
데스크탑 타이머(마스코트)가 쓰는 것과 같은 녹음이에요 (`ena-mascot/타이핑 음원/`).

| 폴더 | 이름 | 원래 키보드 | 파일 |
|---|---|---|---|
| `mango/` | 망고스틴축 | aura pla | key1~10 · space1 · enter1 · shift1 · back1 |
| `frog/` | 개구리축 | frog mini | 〃 |
| `tico/` | 저소음축 | hanseoung TICO | key1~24 · space1~4 · enter1~4 · shift1~4 · back1~4 |
| `violet/` | 바이올렛축 | link65 gold | key1~10 · space1 · enter1 · shift1 · back1 |
| `black/` | 흑축 | neo65 black | 〃 |

- 누를 때마다 `key` 중 하나를 무작위로 틀고(바로 전 두 개는 피해요), 가끔 space·enter·shift·back
  소리를 섞어서 실제로 타이핑하는 것처럼 들려요.
- 파일 개수는 `src/10-keycap.js`의 `PACKS`에 적혀 있어요. **파일을 더하거나 빼면 거기 숫자도 고칠 것** —
  목록에 없는 파일은 안 쓰이고, 목록에 있는데 없는 파일은 조용히 건너뛰어요.
- 새 스위치를 추가하려면: 폴더를 만들고 → `PACKS`에 한 줄 → `OPT.sw`에 이름 → `SWC`에 기둥 색.
- 팩마다 녹음 크기가 조금씩 달라서 `PACKS`의 `gain`으로 맞춰 뒀어요(키 소리 RMS 기준).
- 44.1kHz 모노 WAV. 무손실이라 음질이 그대로이고, 한 파일이 12KB라 가벼워요.
  고른 스위치의 폴더만 내려받아요.
- 웹서버(GitHub Pages나 `python -m http.server`)에서 열 때만 불러와져요. 파일을 더블클릭해서 열면
  브라우저 보안 때문에 합성음이 대신 나와요.
