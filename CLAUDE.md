# 사탄의 게임 (satans-game) — 작업 지침

`rlfqjxm0-create/satans-game`. GitHub Pages로 서비스되는 미니게임 모음 사이트.
로그인·서버·빌드 도구가 전혀 없다. **파일을 고쳐서 main에 푸시하면 그게 곧 배포다.**

## 구조

| 경로 | 역할 | 줄 수 |
|------|------|-------|
| `index.html` | 게임 목록(메인). 카드 그리드 + 진행도 표시 | 129 |
| `laundry/index.html` | 게임 ①「사탄의 세탁」. 전체 게임이 이 한 파일 | 2440 |

그게 전부다. 빌드 산출물·에셋 폴더·의존성 파일이 없고, 이미지도 없다
(**모든 그림은 인라인 SVG 아니면 캔버스에 코드로 그린다**).

> 참고: `microwave/`(사탄의 전자레인지)는 **아직 이 레포에 없다.** 메인 페이지에도
> `.game.soon`("다음 게임 / 준비하고 있어요") 자리표시자만 들어가 있다. 새 게임을
> 추가할 때는 아래 '새 게임 추가' 절을 따른다.

## 공통 규칙

- **외부 라이브러리 금지.** 유일한 외부 요청은 Google Fonts(`Jua`, `Noto Sans KR`)뿐이다.
  라이브러리가 꼭 필요하면 파일 안에 통째로 넣는다 — 세탁 게임이 GIF 인코더(gifenc)를
  그렇게 넣었다(`laundry/index.html` 210~1040줄, 손대지 말 것).
- **한 게임 = `<게임>/index.html` 한 파일.** CSS·JS·그림을 나누지 않는다.
- 게임 스크립트는 전부 IIFE(`(function(){"use strict"; … })()`) 안에 있다. 전역 오염 금지.
  디버그용으로 마지막에 `window.__w={...}` 만 내보낸다.
- **디자인 토큰은 두 파일이 같은 이름을 쓴다** — `--bg --ink --ink-soft --card --line
  --shadow --accent --accent-soft --dot`. 다크 모드는 `prefers-color-scheme` +
  `:root[data-theme="dark"]` 두 갈래를 **항상 같이** 적는다(한쪽만 고치면 어긋난다).
- 글꼴: 제목·버튼은 `Jua`, 본문은 `Noto Sans KR`. 본문 글은 전부 한국어 존댓말.
- 모바일이 주 사용처다 — `viewport-fit=cover` + `env(safe-area-inset-*)`,
  `touch-action:manipulation`, 포인터 이벤트는 마우스/터치 공용(`pointerdown` 계열).
- **사용자 그림은 절대 어디로도 올라가지 않는다.** 전부 브라우저 안에서 캔버스로 처리한다.
  이 약속이 푸터에 적혀 있으니 네트워크 전송 코드를 새로 넣지 말 것.

## laundry — 「사탄의 세탁」

캐릭터 그림(최대 3장)을 넣고 세탁기를 돌리면 19종 중 하나의 결과가 나오고,
움짤(GIF)·영상(mp4/webm)·사진(PNG)으로 저장할 수 있는 뽑기 게임.

### 파일 안의 순서

| 줄 | 내용 |
|----|------|
| 10–123 | CSS(디자인 토큰 + 전체 레이아웃) |
| 125–209 | 마크업 — 스테이지(canvas `#cv`) / 컨트롤 / 배경 지우기 모달 `#editor` / 토스트 |
| 210–1040 | **벤더:** gifenc 1.0.3 (MIT). `window.gifenc`로 노출. 수정 금지 |
| 1041–2438 | 게임 본체 |

### 게임 본체의 큰 덩어리

1. **상수·데이터표** (1044~1093)
   - `LW/LH=480/640` 논리 캔버스 크기. 그리기 좌표는 **전부 이 480×640 기준**이고
     실제 캔버스는 DPR만큼 확대한다(`sizeCv`). 새 그림도 이 좌표계로 그릴 것.
   - `END=9.0` 한 판 길이(초), `T_LAND=5.9` 캐릭터가 바닥에 닿는 시각,
     `tl>=6.3`에 결과 카드가 뜬다(`showResult`).
   - `THEMES` 세탁기 색 7종 / `COURSES` 코스 4종(코스마다 결과 가중치 `w`)
   - `RESULTS` **결과 19종 + 히든 `satan`**. 각 항목: `short/title/sub/says/stars/mood`,
     옵션 `poof`(연기 연출) `pairs`(분신 전용 2인 대사) `multi`(합체) `hidden`
   - `LINES` 진행 중 대사 풀(fill/wash/spin/end/tap/common)
2. **결정론적 난수·물리 곡선** (1104~1145) — `mulberry32` 시드 난수, `omega/ANG/drumAngle`
   (드럼 회전 각도를 미리 적분해 둔 테이블), `waterLevel`. 같은 시드면 같은 판이 나온다.
3. **그리기 프리미티브** (1125~1280) — `rrect/star4/star5/heart/bubble/drop/speech`,
   옷·오리·바구니·화분·고양이 등 소품. 전부 `INK="#4E5F73"` 외곽선 + 둥근 도형.
4. **캐릭터 처리** (1281~1440) — `makePlaceholder`(그림이 없을 때 쓰는 검은 고양이),
   `warpSource/texTri/drawChar`(삼각형 텍스처 매핑으로 그림을 휘게 한다), `variant`(결과별
   변형), `mergedItem`(합체).
5. **장면 렌더** (1500~1930) — `drawRoom` → `drawMachineBody` → `drawDrumInside` →
   `drawGlass` → `behindFX/frontFX`. 최상위는 `render(c, W, t, amb, opt)` 하나이고
   **화면·GIF·영상·PNG가 전부 이 함수 하나를 쓴다.** 연출을 추가하면 저장물에도 자동 반영된다.
6. **소리** (1940~1990) — `synth(result)`가 22050Hz 파형을 직접 합성한다(음원 파일 없음).
   iOS는 무음 모드에서도 나오도록 `<audio>` + data URI, 그 외는 Web Audio.
   **재생은 반드시 탭/클릭 핸들러 안에서** 시작해야 한다(`unlockAudio`).
7. **인터랙션** (2004~2075) — `requestAnimationFrame(frame)` 단일 루프. 세탁이 끝나면
   캐릭터를 잡고 흔들 수 있다(`IA` 상태 + 스프링 물리 + 물방울 파티클).
8. **도감·뽑기** (1998~2200) — 아래 별도 설명.
9. **저장** (2338~2431) — GIF/영상/PNG/인증서.

### 도감과 뽑기 규칙 (건드릴 때 주의)

- `DEX_ORDER` **19개**. 히든 `satan`은 이 목록에 없고 19개를 다 모아야(`has18()`) 열린다.
  - ⚠️ **이름이 낡았다.** `has18()`은 실제로는 "19개 전부 모았나"이고, 마크업에 박힌
    `도감 0/18`(laundry) / `도감 0/19`(메인)도 손으로 적은 값이다. 화면 값은
    `renderDex()`가 `DEX_ORDER.length`로 덮어쓴다. **결과를 추가하면 `DEX_ORDER`에
    넣고, 메인 `index.html`의 하드코딩된 `19`도 같이 고칠 것** (두 군데다).
  - 도감 격자 자리는 `dexSlot(i)`가 정하고 `i===19`가 히든 칸이다 — 개수를 바꾸면 여기도 본다.
- **천장(pity)**: 새 결과 없이 30판을 넘기면 못 모은 결과의 확률이 판마다 12%씩 오른다
  (`STATS.pity`). 레어는 `gold` 3% / `rainbow` 3% 고정.
- 캐릭터가 1장이면 `fusion`(합체)이, 2장 이상이면 `clone`(분신)이 후보에서 빠진다.
- 직전과 같은 결과가 나오면 한 번 다시 뽑는다(`lastResult`).

### localStorage 키 (사이트 전체에서 공유)

| 키 | 내용 | 읽는 곳 |
|----|------|---------|
| `choiae-laundry-dex` | 모은 결과 키 배열 | laundry + **메인 `index.html`의 진행도 표시** |
| `choiae-laundry-stats` | `{spins, pity, done, first}` | laundry |
| `choiae-laundry-sound` | `"on"`/`"off"` | laundry |

메인 페이지가 게임의 키를 직접 읽어 진행 바를 그린다(같은 오리진이라 가능).
**키 이름을 바꾸면 메인 페이지도 같이 고칠 것.**

### 저장 기능

- **GIF**: 한 판 전체를 `render`로 다시 그려 인코딩. 전체 프레임 공통 팔레트를 먼저 뽑고
  (색 깜빡임 방지), 이전 프레임과 같은 픽셀은 투명으로 써서 용량을 줄인다.
  `GIF_LIMIT=14.3MB`(X 업로드 한도)를 넘으면 해상도·fps를 낮춰 재시도한다.
- **영상**: `canvas.captureStream` + `MediaRecorder`. mp4 → webm 순으로 지원 포맷을 고른다.
  효과음은 `synth`를 오디오 트랙으로 합친다. 지원 안 하는 브라우저는 토스트로 안내.
- **저장 경로**: `window.claude.use("downloads")`가 있으면 그걸 쓰고, 없으면 `<a download>`.
  이 게임은 원래 Claude 아티팩트로 만들어져서 그 흔적이 남아 있다(`#backLink`를
  claude.ai 안에서는 숨기는 코드도 같은 이유).

### 배경 지우기 에디터

그림을 넣으면 `cleanRGBA`가 모서리 색으로 배경을 추정해 자동으로 한 번 지우고,
모달(`#editor`)에서 플러드 필(`flood`, 허용치 `ED.tol=42`)로 누르며 지우거나 되살린다.
`ED.hist`에 최대 20단계 되돌리기. 완료하면 `finalizeItem`이 투명 여백을 잘라낸다.

## 새 게임 추가하기

1. `<이름>/index.html` 한 파일로 만든다. `laundry/index.html`의 head(폰트·CSS 토큰)와
   `.back`(← 목록으로) 링크, 푸터 문구를 그대로 가져다 쓰면 톤이 맞는다.
2. 메인 `index.html`의 `.game.soon` 카드를 실제 `<a class="game" href="<이름>/index.html">`로
   바꾸고, 썸네일 SVG(viewBox `0 0 200 160`)를 그린다.
3. 진행도를 보여줄 거면 게임의 localStorage 키를 메인 아래쪽 스크립트에서 읽는다.
4. 푸시하면 몇 분 안에 Pages에 반영된다. 하드 새로고침으로 확인할 것.

## 작업 방식 (사용자 지시)

- 수정 요청을 받으면 **파일 수정 → `git add` → 커밋 → `main` 푸시까지 자동으로** 한다.
  매번 허락을 묻지 않는다.
- 커밋 메시지는 **한국어**로 쓴다. 형식은 `type(scope): 요약`
  (예: `fix(laundry): 도감 개수가 18로 잘못 표시되던 것`).
- 푸시 전에 **무엇이 바뀌는지 한 줄로만** 알린다. 긴 설명·계획 나열은 하지 않는다.
- 검증: 빌드가 없으므로 브라우저로 직접 열어 확인한다. 콘솔 에러가 없어야 하고,
  세탁 게임을 고쳤으면 **한 판을 끝까지 돌려** 결과 카드·움짤 만들기까지 눌러 본다.
