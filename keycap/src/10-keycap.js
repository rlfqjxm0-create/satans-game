/* ================= 사탄 클리커 v3 ================= */
const $=id=>document.getElementById(id);
const ICO=n=>'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-'+n+'"/></svg> ';   // one-tone button icons (sprite in head.html)
/* 바탕화면 키캡 (keycap-desktop): the same page, opened by the desktop program with ?desktop=1 - a transparent
   background, no menus, only the keycap. 40-desktop.js does the rest. */
const DESK=/[?&]desktop=1/.test(location.search); if(DESK) document.documentElement.classList.add("desk");
let DRAW_GATE=null;   // desktop: draws fewer frames while nothing moves
function toast(m){const t=$("toast"); t.textContent=m; t.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("show"),2600)}
const INK="#4E5F73";
/* GPU clean-up. rebuild() runs on every option click, so the meshes it throws away must give their
   geometry / materials / textures back - three.js never frees them by itself (46 clicks used to leave
   173 geometries and 16 textures behind). Things built once and shared go into KEEP and are never freed. */
const KEEP=new WeakSet(), keep=o=>{KEEP.add(o); return o};
const TEX_SLOTS=["map","alphaMap","bumpMap","normalMap","roughnessMap","metalnessMap","emissiveMap","clearcoatMap"];
function freeMat(m){if(!m||KEEP.has(m)) return; for(const k of TEX_SLOTS){const t=m[k]; if(t&&!KEEP.has(t)) t.dispose()} m.dispose()}
function freeTree(o){o.traverse(n=>{if(n.geometry&&!KEEP.has(n.geometry)) n.geometry.dispose(); if(n.material) (Array.isArray(n.material)?n.material:[n.material]).forEach(freeMat); if(n.isInstancedMesh&&n.dispose) n.dispose()})}
const S={items:[], shape:"cherry", mat:"resin", color:"#FFB8D0", charPos:"inside", deco:"cat", decoMat:"gloss", decoColor:"#FFFFFF", glitter:"star", base:"clear", baseColor:"#CFE3FF", sw:"mango", rgb:"rainbow", rgbColor:"#FF6FB5", bg:"peach", bgImg:null, name:"", palette:[], sound:true, glitColor:"", glow:false, standSize:1, bgBlur:"0", bgSrc:null, capOp:null, baseOp:null, swColor:"", earGap:1, earBack:0, earSize:1, earRot:0, earInner:true, ears:"none", eyes:"none", shine:"many", nose:"none", mouth:"none", extra:[], eyeColor:"", odd:false, eyeColor2:"#3E6FD8"};
const OPT={
  shape:{cherry:"체리",pudding:"푸딩",round:"동글",heart:"하트",soft:"말랑"},
  mat:{resin:"투명 레진",jelly:"젤리",gloss:"유광",matte:"무광",holo:"홀로그램"},
  charPos:{inside:"레진 속에 세우기",lie:"레진 속에 눕히기",top:"윗면 프린트",stand:"아크릴 스탠드",none:"안 넣기"},
  deco:{none:"없음",cat:"고양이 귀",bunny:"토끼 귀",horn:"사탄 뿔",bow:"리본",halo:"헤일로",star:"별",heart:"하트"},
  base:{clear:"투명",tint:"컬러 투명",gloss:"유광",matte:"무광",holo:"홀로그램"},
  decoMat:{gloss:"유광",matte:"무광",holo:"홀로그램"},
  glitter:{none:"없음",star:"별가루",snow:"눈송이",heart:"하트",aurora:"오로라",pearl:"진주",sakura:"벚꽃잎",confetti:"하트 컨페티"},
  sw:{mango:"망고스틴축",frog:"개구리축",tico:"저소음축",violet:"바이올렛축",caramel:"카라멜마끼아또축",black:"흑축"},
  rgb:{off:"끄기",solid:"고정",breath:"숨쉬기",rainbow:"무지개"},
  bg:{peach:"피치 노을",lilac:"라일락",soda:"소다",sunset:"핑크 선셋",night:"밤하늘"}
};
const BASE_COLORS=["#FFB8D0","#FFD9A0","#FFF1A8","#BDEBD2","#A8D8FF","#C9B8FF","#FFFFFF","#3A3F4B"];
const DECO_COLORS=["#FFFFFF","#FF8FB0","#FFD45C","#7FC8F0","#9BE39A","#B28CFF","#2C2F36","#E3344B"];
const BGS={peach:["#FFE3D3","#FFC9DE","#E7D3FF"],lilac:["#F3E8FF","#D9CCFF","#BFD5FF"],soda:["#E4FFF6","#BFEFFF","#D8D3FF"],sunset:["#FFD6E7","#FFB4C8","#B9A4FF"],night:["#12143A","#2E2766","#6A4C9C"],glow:["#020403","#06100A","#020403"]};   // glow: 야광 (lights off)
// stem colour of each switch (연핑크 · 연초록 · 파랑 · 보라 · 검정)
const SWC={mango:"#FFB3CE",frog:"#A6E3B4",tico:"#3E8EEB",violet:"#9B6BFF",caramel:"#D9A066",black:"#26282E"};
const swColor=()=>S.swColor||SWC[S.sw];   // the stem colour: the switch's own, or one the user picked
const lin=(h)=>new THREE.Color(h).convertSRGBToLinear();

/* ---------- renderer / scene ---------- */
const cv=$("cv");
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:DESK,powerPreference:DESK?"low-power":"default"}); if(DESK) renderer.setClearColor(0x000000,0);
renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.92;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
/* r128 asks the GPU "did this shader link?" right after every compile, which makes the page wait for
   the compile. Without the check, the warm-up's compiles run in the background instead of freezing the
   spinning keycap for a few hundred ms each (that was the stutter while it turned on its own). */
renderer.debug.checkShaderErrors=false;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(31,4/5,1,600);
camera.position.set(0,32,90); camera.lookAt(0,6,0); camera.fov=31;
(function(){ // soft studio environment built from panels (no image files)
  const pm=new THREE.PMREMGenerator(renderer), es=new THREE.Scene();
  const g=new THREE.SphereGeometry(80,32,16), cols=[], pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){const y=pos.getY(i)/80; const c=new THREE.Color().setHSL(0.8,0.25,0.36+0.3*Math.max(0,y)); cols.push(c.r,c.g,c.b)}
  g.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));
  es.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.BackSide,vertexColors:true})));
  const panel=(x,y,z,w,h,s,col)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(col||0xffffff).multiplyScalar(s),side:THREE.DoubleSide})); m.position.set(x,y,z); m.lookAt(0,0,0); es.add(m)};
  panel(-40,50,30,50,30,3.4); panel(46,26,24,26,50,1.6,0xffe6f2); panel(0,60,-40,60,20,1.4); panel(-50,10,-20,20,40,1.2,0xdde8ff); panel(0,-30,50,80,10,0.45);
  scene.environment=keep(pm.fromScene(es,0.04).texture);
})();
const hemiL=new THREE.HemisphereLight(0xffffff,0xd6c8ee,0.35); scene.add(hemiL);
const keyL=new THREE.DirectionalLight(0xffffff,0.95); keyL.position.set(-30,60,40); scene.add(keyL);
const rimL=new THREE.DirectionalLight(0xffd9f0,0.55); rimL.position.set(40,20,-40); scene.add(rimL);

/* ---------- procedural textures ---------- */
function canvasTex(w,h,fn,srgb){const c=document.createElement("canvas"); c.width=w; c.height=h; fn(c.getContext("2d"),w,h); const t=new THREE.CanvasTexture(c); if(srgb) t.encoding=THREE.sRGBEncoding; return t}
const NOISE=canvasTex(256,256,(x,w,h)=>{const im=x.createImageData(w,h), r=mulberry32(11); for(let i=0;i<im.data.length;i+=4){const v=110+r()*70; im.data[i]=im.data[i+1]=im.data[i+2]=v; im.data[i+3]=255} x.putImageData(im,0,0)});
NOISE.wrapS=NOISE.wrapT=THREE.RepeatWrapping; NOISE.repeat.set(3,3);
function spriteTex(kind){return canvasTex(64,64,(x)=>{x.translate(32,32);
  const glow=x.createRadialGradient(0,0,0,0,0,30); glow.addColorStop(0,"rgba(255,255,255,.9)"); glow.addColorStop(0.35,"rgba(255,255,255,.35)"); glow.addColorStop(1,"rgba(255,255,255,0)"); x.fillStyle=glow; x.fillRect(-32,-32,64,64);
  x.fillStyle="#FFFFFF";
  if(kind==="snow"){x.strokeStyle="#FFFFFF"; x.lineWidth=4; x.lineCap="round"; for(let i=0;i<3;i++){x.save(); x.rotate(i*Math.PI/3); x.beginPath(); x.moveTo(0,-22); x.lineTo(0,22); x.moveTo(0,-14); x.lineTo(-6,-20); x.moveTo(0,-14); x.lineTo(6,-20); x.moveTo(0,14); x.lineTo(-6,20); x.moveTo(0,14); x.lineTo(6,20); x.stroke(); x.restore()}}
  else if(kind==="heart"){heart(x,0,4,20); x.fill()}
  else {star4(x,0,0,26); x.fill()}
})}
const SPRITES={star:spriteTex("star"),aurora:spriteTex("star"),snow:spriteTex("snow"),heart:spriteTex("heart")};

/* hologram: view-dependent rainbow sheen injected into the standard shader */
/* hologram: a soft pastel rainbow (pink / mint / lavender) breathing over the surface. `vivid` is the old strong
   rainbow, kept for the aurora / heart glitter; the keycap and base use the pastel one (the strong one was ugly). */
function holoize(mat,vivid){
  const body=vivid?`vec3 rb=0.55+0.45*cos(6.2831*(f*1.3+vec3(0.0,0.33,0.67)+vViewPosition.y*0.02));
      gl_FragColor.rgb=mix(gl_FragColor.rgb,gl_FragColor.rgb*0.35+rb*0.8,0.55*f+0.22);`
   :`vec3 rb=0.86+0.14*cos(6.2831*(f*0.9+vec3(0.0,0.33,0.67)+vViewPosition.y*0.015));
      vec3 pastel=mix(vec3(1.0),rb,0.85);
      gl_FragColor.rgb=mix(gl_FragColor.rgb,gl_FragColor.rgb*0.45+pastel*0.62,0.42*f+0.18);`;
  mat.onBeforeCompile=(sh)=>{sh.fragmentShader=sh.fragmentShader.replace("#include <tonemapping_fragment>",`
    { vec3 vd=normalize(vViewPosition); float f=1.0-abs(dot(normalize(normal),vd)); ${body} }
    #include <tonemapping_fragment>`)};
  mat.customProgramCacheKey=()=>vivid?"holoV":"holo"; return mat;
}
function surfMat(kind,hex,extra){
  const col=lin(hex), o=Object.assign({color:col},extra||{});
  if(kind==="matte") return new THREE.MeshStandardMaterial(Object.assign(o,{roughness:0.78,metalness:0,bumpMap:NOISE,bumpScale:0.035}));
  if(kind==="holo") return holoize(new THREE.MeshPhysicalMaterial(Object.assign(o,{roughness:0.16,metalness:0.08,clearcoat:1,clearcoatRoughness:0.06})));
  return new THREE.MeshPhysicalMaterial(Object.assign(o,{roughness:0.2,clearcoat:1,clearcoatRoughness:0.06}));
}

/* ---------- background ---------- */
function setBg(){
  const prev=scene.background; setBgNow(); if(prev&&prev!==scene.background&&prev.isTexture&&!KEEP.has(prev)) prev.dispose();
}
function setBgNow(){
  if(DESK){scene.background=null; return}   // the desktop shows through
  $("bgBlurRow").hidden=!S.bgImg;
  if(S.bgImg){scene.background=S.bgImg; document.documentElement.style.setProperty("--stage","#EEE"); return}
  const st=BGS[S.bg]; scene.background=canvasTex(8,640,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h); st.forEach((c,i)=>g.addColorStop(i/(st.length-1),c)); x.fillStyle=g; x.fillRect(0,0,w,h)},true);
  document.documentElement.style.setProperty("--stage",st[0]);
}

/* ---------- geometry helpers ---------- */
function roundedBox(w,h,d,r){const s=new THREE.Shape(); const x=-w/2,y=-d/2; s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+d-r); s.quadraticCurveTo(x+w,y+d,x+w-r,y+d); s.lineTo(x+r,y+d); s.quadraticCurveTo(x,y+d,x,y+d-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  const b=Math.min(0.8,r*0.4); const g=new THREE.ExtrudeGeometry(s,{depth:h-b*2,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:4,curveSegments:10}); g.rotateX(-Math.PI/2); g.translate(0,-h/2+b,0); return g}
// unit cross-section of a keycap shape (max |x|,|z| = 1)
function section(kind,n,M){
  const pts=[];
  if(kind==="heart"){const raw=[]; for(let i=0;i<M;i++){const t=i/M*Math.PI*2; raw.push([16*Math.pow(Math.sin(t),3),-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))])}
    let mx=0,mz=0,cz=0; raw.forEach(p=>{mx=Math.max(mx,Math.abs(p[0])); cz+=p[1]}); cz/=raw.length; raw.forEach(p=>mz=Math.max(mz,Math.abs(p[1]-cz))); const s=Math.max(mx,mz);
    // blend toward a circle so the heart reads soft and chubby
    return raw.map((p,i)=>{const t=i/M*Math.PI*2, hx=p[0]/s, hz=(p[1]-cz)/s, cx=Math.sin(t), czz=-Math.cos(t)*0.95; return [lerp(hx,cx,0.3),lerp(hz,czz,0.22)]})}
  for(let i=0;i<M;i++){const a=i/M*Math.PI*2, c=Math.cos(a), s=Math.sin(a); pts.push([Math.sign(c)*Math.pow(Math.abs(c),2/n),Math.sign(s)*Math.pow(Math.abs(s),2/n)])}
  return pts;
}
// every top is flat like the cherry profile (dish 0, dome 0) - the domed heart top looked bloated
const PROFILES={
  cherry:{sec:"sq",bw:18,tw:13.6,h:9,n0:9,n1:7,dish:0,dome:0,bev:0.7,tilt:0},
  pudding:{sec:"circle",bw:18.6,tw:12.4,h:11,n0:2,n1:2,dish:0,dome:0,bev:2.6,tilt:0},
  round:{sec:"circle",bw:17.5,tw:14.5,h:9.5,n0:2,n1:2,dish:0,dome:0,bev:2.2,tilt:0},
  heart:{sec:"heart",bw:19,tw:16,h:9,n0:0,n1:0,dish:0,dome:0,bev:2.2,tilt:0},
  // a wide soft body with a big flat top - made for faces (ears and faces are presets: 15-faces.js)
  soft:{sec:"sq",bw:18.6,tw:15.2,h:9,n0:3.4,n1:3,dish:0,dome:0,bev:1.3,tilt:0}
};
const FIXED_SEC={heart:1};   // one outline at every height (super-ellipses change with height)
function capGeometry(p,flat){
  const M=96, L=22, K=12, verts=[], idx=[], rings=[];
  const secAt=(v)=>FIXED_SEC[p.sec]?section(p.sec,0,M):section("se",lerp(p.n0,p.n1,v),M);
  const ring=(sec,hw,y,tilt)=>{const r=[]; for(const [ux,uz] of sec){r.push(verts.length/3); verts.push(ux*hw,y+(tilt?-uz*hw*tilt:0),uz*hw)} return r};
  for(let l=0;l<=L;l++){const v=l/L; const w=lerp(p.bw,p.tw,Math.pow(v,1.2))/2, y=v*(p.h-p.bev); rings.push(ring(secAt(v),w,y,p.tilt*v))}
  for(let l=1;l<=7;l++){const a=l/7*Math.PI/2; const w=p.tw/2-p.bev*(1-Math.cos(a)); const y=p.h-p.bev+Math.sin(a)*p.bev; rings.push(ring(secAt(1),w,y,p.tilt))}
  const topW=p.tw/2-p.bev, dish=flat?0:p.dish, dome=flat?Math.min(p.dome,0.6):p.dome;
  for(let k=1;k<K;k++){const f=1-k/K; const y=p.h+dome*(1-f*f)-dish*(1-f*f); rings.push(ring(secAt(1),topW*f,y,p.tilt))}
  const center=verts.length/3; verts.push(0,p.h+dome-dish,0);
  for(let r=0;r<rings.length-1;r++){const A=rings[r],B=rings[r+1]; for(let i=0;i<M;i++){const i2=(i+1)%M; idx.push(A[i],B[i],A[i2]); idx.push(A[i2],B[i],B[i2])}}
  const last=rings[rings.length-1]; for(let i=0;i<M;i++) idx.push(last[i],center,last[(i+1)%M]);
  const bc=verts.length/3; verts.push(0,0,0); const first=rings[0]; for(let i=0;i<M;i++) idx.push(first[(i+1)%M],bc,first[i]);
  const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3)); g.setIndex(idx); g.computeVertexNormals();
  g.userData={topY:p.h+dome-dish, topW, sec:secAt(1)}; return g;
}

/* ---------- the keychain switch tester (after the reference photos) ---------- */
const root=new THREE.Group(); scene.add(root);
const shadowTex=canvasTex(128,128,(x)=>{const g=x.createRadialGradient(64,64,4,64,64,64); g.addColorStop(0,"rgba(40,20,60,.32)"); g.addColorStop(1,"rgba(40,20,60,0)"); x.fillStyle=g; x.fillRect(0,0,128,128)});
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(52,52),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false})); shadow.rotation.x=-Math.PI/2; shadow.position.y=-14.4; scene.add(shadow);
let clearMat=new THREE.MeshPhysicalMaterial({color:lin("#EEF4FF"),roughness:0.04,transmission:0.95,transparent:true,clearcoat:1,clearcoatRoughness:0.03,envMapIntensity:1.6,depthWrite:false,side:THREE.DoubleSide});
const acrylicMat=clearMat;
const block=new THREE.Mesh(roundedBox(21,14,21,2.4),clearMat); block.position.y=-7; block.renderOrder=3; root.add(block);
// inner edges of the acrylic (a slightly tinted inner cavity makes the thickness read)
const cavity=new THREE.Mesh(roundedBox(16.2,9.2,16.2,1.2),new THREE.MeshPhysicalMaterial({color:lin("#DDE8FF"),roughness:0.1,transmission:0.9,transparent:true,opacity:0.9,depthWrite:false})); cavity.position.y=-4.8; root.add(cavity);
const metal=new THREE.MeshStandardMaterial({color:0xDADFE8,metalness:1,roughness:0.22});
const gold=new THREE.MeshStandardMaterial({color:0xE8C27A,metalness:1,roughness:0.25});
const sw=new THREE.Group(); root.add(sw);
const whiteP=new THREE.MeshStandardMaterial({color:lin("#F6F4F2"),roughness:0.55,bumpMap:NOISE,bumpScale:0.02});
const bot=new THREE.Mesh(roundedBox(14.6,4.4,14.6,0.8),new THREE.MeshPhysicalMaterial({color:lin("#FBF8F4"),roughness:0.45,transmission:0.35,transparent:true,bumpMap:NOISE,bumpScale:0.02})); bot.position.y=-2.9; sw.add(bot);
for(const sd of [-1,1]){const clip=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.4,5),whiteP); clip.position.set(sd*8,-2,0); sw.add(clip)}
for(const [x,z] of [[-3.2,-2.2],[1.6,-3.8]]){const pin=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,4,8),gold); pin.position.set(x,-6.4,z); sw.add(pin)}
const topHousingGeo=(()=>{const p={sec:"sq",bw:15,tw:11.4,h:4.2,n0:8,n1:6,dish:0,dome:0,bev:0.8,tilt:0}; return capGeometry(p,true)})();
const topHousing=new THREE.Mesh(topHousingGeo,new THREE.MeshPhysicalMaterial({color:lin("#F4F8FF"),roughness:0.08,transmission:0.9,transparent:true,clearcoat:1,depthWrite:false})); topHousing.position.y=0; topHousing.scale.y=0.82; topHousing.renderOrder=2; sw.add(topHousing);
const spring=(()=>{const pts=[]; for(let i=0;i<=120;i++){const a=i/120*Math.PI*2*6; pts.push(new THREE.Vector3(Math.cos(a)*1.6,-3.6+i/120*5.4,Math.sin(a)*1.6))} return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),240,0.18,6,false),metal)})(); sw.add(spring);
const stemMat=new THREE.MeshPhysicalMaterial({color:lin(swColor()),roughness:0.35,clearcoat:0.5});
const stem=new THREE.Group(); const stemBase=new THREE.Mesh(roundedBox(6,2.4,6,0.8),stemMat); stemBase.position.y=2.6; stem.add(stemBase);
{const s1=new THREE.Mesh(new THREE.BoxGeometry(4.2,3.2,1.25),stemMat); s1.position.set(0,4.6,0); stem.add(s1); const s2=new THREE.Mesh(new THREE.BoxGeometry(1.25,3.2,4.2),stemMat); s2.position.set(0,4.6,0); stem.add(s2)}
sw.add(stem);
// keychain: jump ring, a few links and a clasp hanging off the side
const chain=new THREE.Group(); root.add(chain);
(function(){ // jump ring -> hanging chain of interlocking links -> lobster clasp -> key ring
  const jr=new THREE.Mesh(new THREE.TorusGeometry(1.5,0.34,12,28),metal); jr.position.set(11.9,-2.6,0); jr.rotation.y=Math.PI/2; chain.add(jr);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(12.6,-3.6,0),new THREE.Vector3(15.2,-8.2,1.2),new THREE.Vector3(17.2,-11.6,2.6),new THREE.Vector3(18.4,-13.2,3.6)]);
  const L=curve.getLength(), linkLen=2.0, step=linkLen*0.78, n=Math.floor(L/step), linkGeo=new THREE.TorusGeometry(0.62,0.2,10,20); linkGeo.scale(1,1.55,1);
  const up=new THREE.Vector3(0,1,0), q=new THREE.Quaternion(), q2=new THREE.Quaternion();
  for(let i=0;i<=n;i++){const u=Math.min(1,i*step/L), p=curve.getPointAt(u), t=curve.getTangentAt(u);
    const m=new THREE.Mesh(linkGeo,metal); m.position.copy(p); q.setFromUnitVectors(up,t); q2.setFromAxisAngle(t,i%2?Math.PI/2:0); m.quaternion.copy(q2.multiply(q)); chain.add(m)}
  const end=curve.getPointAt(1);
  const clasp=new THREE.Group(); const body=new THREE.Mesh(new THREE.TorusGeometry(1.3,0.42,12,28,Math.PI*1.75),metal); body.scale.set(1,1.5,1); clasp.add(body);
  // the arc (radius 1.3, stretched 1.5 in y) opens between angle 0 and 315°: its ends are (1.3,0) and (0.919,-1.379).
  // The gate bridges exactly those two points, and a bead at each end hides the tube's flat cuts (the seam looked broken).
  const e1=new THREE.Vector3(1.3,0,0), e2=new THREE.Vector3(1.3*Math.cos(Math.PI*1.75),1.3*Math.sin(Math.PI*1.75)*1.5,0), gv=e1.clone().sub(e2), gl=gv.length();
  const gate=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,gl+0.5,10),metal); gate.position.copy(e1).add(e2).multiplyScalar(0.5); gate.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),gv.normalize()); clasp.add(gate);
  for(const e of [e1,e2]){const bead=new THREE.Mesh(new THREE.SphereGeometry(0.42,12,10),metal); bead.position.copy(e); clasp.add(bead)}
  clasp.position.set(end.x+0.4,end.y-2.4,end.z); clasp.rotation.z=-0.3; chain.add(clasp);
  const kr=new THREE.Mesh(new THREE.TorusGeometry(3.8,0.4,14,44),metal); kr.position.set(end.x+0.4,end.y-2.4-3.1,end.z); kr.rotation.set(0.12,Math.PI/2+0.35,0.1); chain.add(kr)})();   // through the clasp's loop, in the plane across it
// RGB light under the switch
const rgbLight=new THREE.PointLight(0xff66cc,0,40,1.6); rgbLight.position.set(0,-3,0); root.add(rgbLight);
const glowTex=canvasTex(128,128,(x)=>{const g=x.createRadialGradient(64,64,6,64,64,64); g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(0.4,"rgba(255,255,255,.4)"); g.addColorStop(1,"rgba(255,255,255,0)"); x.fillStyle=g; x.fillRect(0,0,128,128)});
keep(NOISE); keep(shadowTex); keep(glowTex);   // shared by many materials - never freed
const rgbGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff66cc,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0})); rgbGlow.scale.set(34,34,1); rgbGlow.position.set(0,-2,0); root.add(rgbGlow);
const rgbFloor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshBasicMaterial({map:glowTex,color:0xff66cc,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0})); rgbFloor.rotation.x=-Math.PI/2; rgbFloor.position.y=-14.3; scene.add(rgbFloor);

/* ---------- keycap ---------- */
const capGroup=new THREE.Group(); capGroup.position.y=5.2; root.add(capGroup);
let capMesh=null, charGroup=null, decoGroup=null, parts=null, partSys=null, capGeo=null;
/* 불투명도: how much of the resin / jelly / clear base is body rather than see-through. Defaults per material; the
   desktop program adds 0.2 (over a real desktop the glassy look had no weight - requested), capped at 0.95. */
const OP_DEF={resin:0.45,jelly:0.7,clear:0.14,tint:0.3};
const capOp=()=>Math.min(0.95,(S.capOp==null?OP_DEF[S.mat]||0.5:S.capOp/100)+(DESK?0.2:0));
const baseOp=()=>Math.min(0.95,(S.baseOp==null?OP_DEF[S.base]||0.5:S.baseOp/100)+(DESK?0.2:0));
function capMaterial(){
  const col=lin(S.color);
  switch(S.mat){
    case "resin": return new THREE.MeshPhysicalMaterial({color:col,roughness:0.04,transmission:1-capOp(),transparent:true,clearcoat:1,clearcoatRoughness:0.03,side:THREE.DoubleSide,envMapIntensity:1.6,depthWrite:false});
    case "jelly": return new THREE.MeshPhysicalMaterial({color:col,roughness:0.32,transmission:1-capOp(),transparent:true,clearcoat:0.8,clearcoatRoughness:0.2,side:THREE.DoubleSide,envMapIntensity:1.3,depthWrite:false});
    case "holo": return surfMat("holo",S.color);
    case "matte": return surfMat("matte",S.color);
    default: return surfMat("gloss",S.color);
  }
}
const SQ=new WeakMap();
function charCanvas(sq){ // character drawn into a square canvas ("contain"), for textures - made once per picture
  const it=S.items[0]||PLACEHOLDER, src=it.canvas; if(!sq) return src; if(SQ.has(src)) return SQ.get(src);
  const s=Math.max(src.width,src.height), c=document.createElement("canvas"); c.width=c.height=Math.min(1024,s); const k=c.width/s; c.getContext("2d").drawImage(src,(c.width-src.width*k)/2,(c.height-src.height*k)/2,src.width*k,src.height*k); SQ.set(src,c); return c;
}
function texOf(c){const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t}
/* the character picture is uploaded to the GPU once, not on every option click (it was re-sent each
   time - up to 1024x1024). One slot per use; a new picture replaces and frees the old one. */
const CHAR_TEX={};
function charTex(slot,src){const e=CHAR_TEX[slot]; if(e&&e.src===src) return e.tex; if(e){KEEP.delete(e.tex); e.tex.dispose()}
  const tex=keep(texOf(src)); CHAR_TEX[slot]={src,tex}; return tex}
const CAP_GEO={};
function capGeoFor(p,flat){const k=S.shape+(flat?"/flat":""); return CAP_GEO[k]||(CAP_GEO[k]=keep(capGeometry(p,flat)))}
function buildChar(p,g){
  const grp=new THREE.Group(); const see=S.mat==="resin"||S.mat==="jelly";
  const it=S.items[0]||PLACEHOLDER, topY=g.userData.topY;
  /* one piece of clear acrylic cut around the character, printed on both faces (the 아크릴 스탠드 look).
     The print is opaque with alpha-to-coverage: the antialiasing smooths its outline, where a hard alpha
     cut-off used to leave jagged pixel steps (and it still sorts as an opaque object inside the resin). */
  const acrylic=(H,T,order)=>{
    const cut=acrylicOutline(it), W=H*cut.ar, piece=new THREE.Group();
    const shape=new THREE.Shape(); cut.pts.forEach(([u,v],i)=>{const x=(u-0.5)*W, y=(1-v)*H; i?shape.lineTo(x,y):shape.moveTo(x,y)}); shape.closePath();
    const bev=Math.min(0.18,T*0.2), body=new THREE.ExtrudeGeometry(shape,{depth:T,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:3,curveSegments:6}); body.translate(0,0,-T/2);
    const acr=new THREE.MeshPhysicalMaterial({color:lin("#F4F8FF"),roughness:0.03,transmission:DESK?0.65:0.85,transparent:true,clearcoat:1,clearcoatRoughness:0.02,envMapIntensity:2.2,depthWrite:false});
    const m=new THREE.Mesh(body,acr); m.renderOrder=order; piece.add(m);
    const printMat=new THREE.MeshPhysicalMaterial({map:charTex("stand",cut.img),alphaTest:0.02,alphaToCoverage:true,roughness:0.12,clearcoat:1,clearcoatRoughness:0.04,envMapIntensity:1.1,side:THREE.FrontSide});
    const front=new THREE.Mesh(new THREE.PlaneGeometry(W,H),printMat); front.position.set(0,H/2,T/2-0.06); piece.add(front);
    const backMat=printMat.clone(); backMat.side=THREE.BackSide; backMat.color=lin("#E9EEF6");
    const back=new THREE.Mesh(new THREE.PlaneGeometry(W,H),backMat); back.position.set(0,H/2,-T/2+0.06); piece.add(back);
    return {piece,W,H,ar:cut.ar};
  };
  if(S.charPos==="inside"&&see){ // standing up inside the resin
    const ar=acrylicOutline(it).ar, H=Math.min(p.h*0.74,p.tw*0.92/ar), a=acrylic(H,0.8,1);
    a.piece.position.y=p.h*0.48-H/2; grp.add(a.piece)}
  if(S.charPos==="lie"&&see){ // lying flat inside the resin, the same size as the top print
    const ar=acrylicOutline(it).ar, L=2*g.userData.topW*0.96*0.9, H=ar>=1?L/ar:L, a=acrylic(H,0.8,1);
    a.piece.rotation.x=-Math.PI/2; a.piece.position.set(0,p.h*0.42,H/2); grp.add(a.piece)}
  if(S.charPos==="top"){ // printed onto the flat top, clipped to the cap's outline
    const sec=g.userData.sec, w=g.userData.topW*0.96, shape=new THREE.Shape(); sec.forEach(([ux,uz],i)=>{const x=ux*w, y=-uz*w; i?shape.lineTo(x,y):shape.moveTo(x,y)});
    const sg=new THREE.ShapeGeometry(shape,1), pos=sg.attributes.position, uv=[]; for(let i=0;i<pos.count;i++) uv.push(pos.getX(i)/(2*w)+0.5,pos.getY(i)/(2*w)+0.5); sg.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2)); sg.rotateX(-Math.PI/2);
    // blended edges (tiny alphaTest only drops empty pixels) - 0.2 used to cut a jagged outline
    const m=new THREE.Mesh(sg,new THREE.MeshPhysicalMaterial({map:charTex("top",charCanvas(true)),transparent:true,alphaTest:0.02,roughness:0.3,clearcoat:0.6,polygonOffset:true,polygonOffsetFactor:-4})); m.position.y=topY+0.04; grp.add(m)}
  if(S.charPos==="stand"){ // standing on top of the keycap
    const a=acrylic(12.5*S.standSize,1.3,5); a.piece.position.y=topY; grp.add(a.piece); grp.userData.standTop=topY+a.H}
  return grp;
}
/* trace the character's silhouette (with a clear margin) the way an acrylic cutter would */
const CUTS=new WeakMap();
function acrylicOutline(it){
  if(CUTS.has(it.canvas)) return CUTS.get(it.canvas);   // keyed by the picture, not the slot: erasing the background makes a new picture
  const src=it.canvas, pad=0.06, G=120, s=G/Math.max(src.width,src.height)/(1+pad*2);
  const gw=Math.round(src.width*s+G*pad*2*(src.width/Math.max(src.width,src.height)))+4, gh=Math.round(src.height*s+G*pad*2*(src.height/Math.max(src.width,src.height)))+4;
  const c=document.createElement("canvas"); c.width=gw; c.height=gh; const x=c.getContext("2d"); const ox=(gw-src.width*s)/2, oy=(gh-src.height*s)/2; x.drawImage(src,ox,oy,src.width*s,src.height*s);
  const a=x.getImageData(0,0,gw,gh).data, R=Math.max(2,Math.round(G*pad)), B=new Uint8Array(gw*gh);
  for(let y=0;y<gh;y++) for(let xx=0;xx<gw;xx++){ if(a[(y*gw+xx)*4+3]<60) continue; for(let dy=-R;dy<=R;dy++) for(let dx=-R;dx<=R;dx++){ if(dx*dx+dy*dy>R*R) continue; const X=xx+dx, Y=y+dy; if(X>=0&&Y>=0&&X<gw&&Y<gh) B[Y*gw+X]=1}}
  // Moore-neighbour boundary trace starting from the top-most filled cell
  let start=-1; for(let i=0;i<B.length;i++) if(B[i]){start=i; break}
  const at=(X,Y)=>X>=0&&Y>=0&&X<gw&&Y<gh&&B[Y*gw+X];
  const dirs=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  let cx=start%gw, cy=(start-cx)/gw, d=0; const pts=[[cx,cy]];
  for(let step=0;step<gw*gh*2;step++){let found=false; for(let k2=0;k2<8;k2++){const nd=(d+6+k2)%8, nx=cx+dirs[nd][0], ny=cy+dirs[nd][1]; if(at(nx,ny)){cx=nx; cy=ny; d=nd; found=true; break}} if(!found) break; if(cx===pts[0][0]&&cy===pts[0][1]) break; pts.push([cx,cy])}
  // simplify + round the corners like a laser-cut edge
  const rdp=(P,eps)=>{if(P.length<3) return P; let dmax=0,idx=0; const [x1,y1]=P[0],[x2,y2]=P[P.length-1], L=Math.hypot(x2-x1,y2-y1)||1; for(let i=1;i<P.length-1;i++){const dd=Math.abs((y2-y1)*P[i][0]-(x2-x1)*P[i][1]+x2*y1-y2*x1)/L; if(dd>dmax){dmax=dd; idx=i}} if(dmax>eps){const l=rdp(P.slice(0,idx+1),eps), r=rdp(P.slice(idx),eps); return l.slice(0,-1).concat(r)} return [P[0],P[P.length-1]]};
  let poly=rdp(pts,0.8); for(let it2=0;it2<2;it2++){const o=[]; for(let i=0;i<poly.length;i++){const p=poly[i], q=poly[(i+1)%poly.length]; o.push([p[0]*0.75+q[0]*0.25,p[1]*0.75+q[1]*0.25],[p[0]*0.25+q[0]*0.75,p[1]*0.25+q[1]*0.75])} poly=o}
  // texture: the character centred in the same frame as the outline
  const img=document.createElement("canvas"); const K=Math.min(8,1024/Math.max(gw,gh)); img.width=Math.round(gw*K); img.height=Math.round(gh*K); img.getContext("2d").drawImage(src,ox*K,oy*K,src.width*s*K,src.height*s*K);
  const out={pts:poly.map(([X,Y])=>[X/gw,Y/gh]),ar:gw/gh,img}; CUTS.set(it.canvas,out); return out;
}
function lathe(points,seg){return new THREE.LatheGeometry(points.map(([x,y])=>new THREE.Vector2(x,y)),seg||32)}
function sitOn(geo){geo.computeBoundingBox(); const b=geo.boundingBox; geo.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2); return geo}
/* Decorations. Their shapes never change with the colour or material, so each geometry is built once and
   reused (GEO). Every keycap top is flat, so ears and horns stand right on topY:
   - their base is flat (anything the bevel pushed below 0 is pressed up to 0), so they touch the top all
     along the base and nothing is sunk into it;
   - ears lean outward by shape (the tip is shifted), not by tilting the mesh - tilting lifted one corner of
     the base off the top and pushed the other corner into it;
   - pair() shrinks them until both bases fit inside the flat part of the top (small tops like 푸딩). */
const DECO_GEO={};
const GEO=(k,f)=>DECO_GEO[k]||(DECO_GEO[k]=keep(f()));
function flatBase(g2){const p=g2.attributes.position; for(let i=0;i<p.count;i++) if(p.getY(i)<0) p.setY(i,0); g2.computeVertexNormals(); return g2}
function earShape(half,height,lean,y0){const s=new THREE.Shape(), h=height, L=lean;
  s.moveTo(-half,y0); s.quadraticCurveTo(-half*0.9+L*0.45,y0+h*0.55,L-0.2,y0+h*0.97); s.quadraticCurveTo(L,y0+h*1.03,L+0.2,y0+h*0.97);
  s.quadraticCurveTo(half*0.9+L*0.45,y0+h*0.55,half,y0); s.lineTo(-half,y0); return s}
function longEarShape(half,height,lean,y0){const s=new THREE.Shape(), h=height, L=lean;
  s.moveTo(-half,y0); s.bezierCurveTo(-half*1.6+L*0.3,y0+h*0.36,-half*1.35+L,y0+h*0.94,L,y0+h); s.bezierCurveTo(half*1.35+L,y0+h*0.94,half*1.6+L*0.3,y0+h*0.36,half,y0); s.lineTo(-half,y0); return s}
function buildDeco(p,g){
  const grp=new THREE.Group(), top=g.userData.topY, w=g.userData.topW;
  const main=surfMat(S.decoMat,S.decoColor), accentPink=surfMat(S.decoMat==="holo"?"holo":"gloss","#FFB8C9");
  const add=(geo,mat,x,y,z,rx,ry,rz)=>{const o=new THREE.Mesh(geo,mat); o.position.set(x,y,z); o.rotation.set(rx||0,ry||0,rz||0); grp.add(o); return o};
  const soft=(shape,depth,bev,bevSize)=>new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bev,bevelSize:bevSize==null?bev:bevSize,bevelSegments:6,curveSegments:28});
  const stand=S.charPos==="stand", floatBase=stand?(top+12.5*S.standSize+1):top;
  const F=fenceTable(p), inTop=(x,z)=>Math.hypot(x,z)<=fenceAt(F.R,Math.atan2(z,x))*w*0.97;
  // biggest scale (<=1) at which both bases (half-width hx, half-depth hz) sit inside the flat top
  const pair=(hx,hz,x0,z)=>{for(let f=1;f>=0.45;f-=0.05){const x=Math.max(x0,hx*f+0.25);
      if([-1,1].every(sd=>[[-1,-1],[1,-1],[-1,1],[1,1]].every(([a,b])=>inTop(sd*x+a*hx*f,z+b*hz*f)))) return {f,x}}
    return {f:0.45,x:Math.max(x0,hx*0.45+0.25)}};
  switch(S.deco){
    case "cat":{ // pointed cat ears, leaning a little outward
      const z=-w*0.2, {f,x}=pair(2.6,0.9,w*0.56,z);
      for(const sd of [-1,1]){
        const eg=GEO("cat.ear"+sd,()=>{const g2=soft(earShape(2.5,5.6,sd*1.0,0),0.9,0.45,0.26); g2.translate(0,0,-0.45); return flatBase(g2)});
        const ig=GEO("cat.inner"+sd,()=>{const g2=soft(earShape(1.35,3.8,sd*0.8,0.7),0.4,0.2,0.14); g2.translate(0,0,0.55); return flatBase(g2)});
        add(eg,main,sd*x,top,z).scale.setScalar(f); add(ig,accentPink,sd*x,top,z).scale.setScalar(f)}
      break;}
    case "bunny":{ // long, soft bunny ears
      const z=-w*0.18, {f,x}=pair(1.9,0.9,w*0.4,z);
      for(const sd of [-1,1]){
        const eg=GEO("bun.ear"+sd,()=>{const g2=soft(longEarShape(1.5,7.9,sd*0.9,0),0.9,0.45,0.4); g2.translate(0,0,-0.45); return flatBase(g2)});
        const ig=GEO("bun.inner"+sd,()=>{const g2=soft(longEarShape(0.72,5.8,sd*0.75,1),0.4,0.2); g2.translate(0,0,0.55); return flatBase(g2)});
        add(eg,main,sd*x,top,z).scale.setScalar(f); add(ig,accentPink,sd*x,top,z).scale.setScalar(f)}
      break;}
    case "horn":{ // classic little devil horns: chunky at the base, curving up and inward to a point
      const hm=surfMat(S.decoMat,S.decoColor==="#FFFFFF"?"#26262B":S.decoColor), z=-w*0.15, {f,x}=pair(1.35,1.35,w*0.5,z);
      for(const sd of [-1,1]){
        const tg=GEO("horn3.tube"+sd,()=>{const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(0,0,0),new THREE.Vector3(0,1.6,0),new THREE.Vector3(-sd*0.5,3.1,0),new THREE.Vector3(-sd*1.6,3.9,0));
          const t=new THREE.TubeGeometry(curve,40,1.3,20,false), pos=t.attributes.position, v=new THREE.Vector3();
          for(let i=0;i<pos.count;i++){const seg=Math.floor(i/21)/40, pt=curve.getPoint(seg); v.set(pos.getX(i),pos.getY(i),pos.getZ(i)).sub(pt).multiplyScalar(lerp(1,0.07,Math.pow(seg,0.9))).add(pt); pos.setXYZ(i,v.x,v.y,v.z)}
          t.computeVertexNormals(); return t});   // the curve starts straight up, so the base ring lies flat on the top
        const h=add(tg,hm,sd*x,top,z); h.scale.setScalar(f);
        add(GEO("horn2.tip",()=>new THREE.SphereGeometry(1.3*0.07,10,8)),hm,sd*x-sd*1.6*f,top+3.9*f,z).scale.setScalar(f);
        add(GEO("horn2.base",()=>new THREE.CircleGeometry(1.3,24)),hm,sd*x,top+0.001,z,Math.PI/2).scale.setScalar(f)}   // closes the tube's bottom
      break;}
    case "bow":{ // two pleated loops, a knot and notched tails, standing upright
      const lg=GEO("bow.loop",()=>{const s=new THREE.Shape(); s.moveTo(0,0.8); s.bezierCurveTo(1.6,2.6,4.2,3.6,5.2,2.6); s.bezierCurveTo(6,1.6,5.8,-1.2,5,-2); s.bezierCurveTo(3.9,-2.9,1.6,-1.8,0,-0.8); s.lineTo(0,0.8); const g2=soft(s,0.9,0.45); g2.translate(0,0,-0.45); return g2});
      const fg=GEO("bow.fold",()=>{const s=new THREE.Shape(); s.moveTo(0.6,0.3); s.bezierCurveTo(2,1.2,3.6,1.5,4.3,0.9); s.lineTo(4.1,0.3); s.bezierCurveTo(3.2,0.6,2,0.3,0.6,-0.2); s.lineTo(0.6,0.3); return soft(s,0.2,0.12)});
      const tgm=GEO("bow.tail",()=>{const s=new THREE.Shape(); s.moveTo(-0.7,0); s.lineTo(0.7,0); s.lineTo(2.2,-4.2); s.lineTo(1.2,-3.6); s.lineTo(0.6,-4.4); s.lineTo(-0.4,-0.6); s.lineTo(-0.7,0); const g2=soft(s,0.5,0.25); g2.translate(0,0,-0.6); return g2});
      const bowG=new THREE.Group();
      for(const sd of [-1,1]){const o=new THREE.Mesh(lg,main); o.scale.x=sd; bowG.add(o);
        const fm=new THREE.Mesh(fg,accentPink.clone()); fm.material.opacity=0.35; fm.material.transparent=true; fm.scale.x=sd; fm.position.z=0.62; bowG.add(fm)}
      for(const sd of [-1,1]){const o=new THREE.Mesh(tgm,main); o.scale.x=sd; o.position.set(sd*0.3,-0.4,-0.2); o.rotation.z=sd*0.1; bowG.add(o)}
      const knot=new THREE.Mesh(GEO("bow.knot",()=>new THREE.SphereGeometry(1.3,24,16)),main); knot.scale.set(1.05,1.25,0.8); bowG.add(knot);
      const bb=new THREE.Box3().setFromObject(bowG); bowG.position.set(0,top-bb.min.y,-w*0.1); grp.add(bowG);
      break;}
    case "halo":{
      const col=lin(S.decoColor==="#FFFFFF"?"#FFE38A":S.decoColor);
      const hm=S.decoMat==="holo"?surfMat("holo","#FFF3B0",{emissive:col,emissiveIntensity:0.5}):new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:S.decoMat==="matte"?0.45:0.75,roughness:S.decoMat==="matte"?0.6:0.25,metalness:0.2});
      const R=Math.max(4.2,w*0.62), y=floatBase+3.4, Rk=R.toFixed(2);   // a little above the head, not floating far off
      const ring=add(GEO("halo.ring"+Rk,()=>new THREE.TorusGeometry(R,0.5,20,64)),hm,0,y,0,Math.PI/2); ring.userData.float=y;
      const glow=new THREE.Mesh(GEO("halo.glow"+Rk,()=>new THREE.TorusGeometry(R,1.3,16,64)),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.16,blending:THREE.AdditiveBlending,depthWrite:false})); glow.rotation.x=Math.PI/2; glow.position.y=y; grp.add(glow); glow.userData.float=y;
      const gs=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,transparent:true,opacity:0.22,blending:THREE.AdditiveBlending,depthWrite:false})); gs.scale.set(R*2.6,R*0.9,1); gs.position.y=y; grp.add(gs); gs.userData.float=y;
      grp.userData.halo=[ring,glow,gs]; break;}
    case "star": case "heart":{
      const geo=GEO("deco2."+S.deco,()=>{let s2=new THREE.Shape();
        if(S.deco==="star"){for(let i=0;i<10;i++){const a=i/10*Math.PI*2-Math.PI/2, r=i%2?2:4.2; const x=Math.cos(a)*r, y=-Math.sin(a)*r; i?s2.lineTo(x,y):s2.moveTo(x,y)} s2.closePath()}
        else { // a clear heart: round lobes and a deep dip between them at the top
          s2.moveTo(0,-4.1); s2.bezierCurveTo(-1.5,-2.7,-4.9,-0.9,-4.9,1.9); s2.bezierCurveTo(-4.9,4.1,-3.4,5.2,-2.3,5.2);
          s2.bezierCurveTo(-1.1,5.2,-0.25,4.3,0,2.7); s2.bezierCurveTo(0.25,4.3,1.1,5.2,2.3,5.2);
          s2.bezierCurveTo(3.4,5.2,4.9,4.1,4.9,1.9); s2.bezierCurveTo(4.9,-0.9,1.5,-2.7,0,-4.1)}
        const g2=soft(s2,1.4,S.deco==="heart"?0.75:1.2); g2.center(); return g2});
      const mat=S.decoColor==="#FFFFFF"?surfMat(S.decoMat,S.deco==="star"?"#FFD45C":"#FF8FB0"):main;
      const fy=floatBase+(stand?4.5:5.6); const o=add(geo,mat,0,fy,0,0,0,0); grp.userData.spin=o; o.userData.float=fy; break;}
  }
  return grp;
}
const mixHex=(a,b,t)=>"#"+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
function nameSticker(txt){ // a die-cut name sticker: white border, a label in the keycap's colour, tiny heart
  const c=S.color, lab0=mixHex(c,"#FFFFFF",0.8), lab1=mixHex(c,"#FFFFFF",0.58), acc=mixHex(c,"#1E1A24",0.12), ink=mixHex(c,"#2A2230",0.74), spark=mixHex(c,"#FFFFFF",0.35);
  return canvasTex(512,192,(x,w,h)=>{x.font='64px Jua, sans-serif'; const tw=Math.min(x.measureText(txt).width,300); const bw=tw+150, bh=112, bx=(w-bw)/2, by=(h-bh)/2;
    x.shadowColor="rgba(60,40,90,.25)"; x.shadowBlur=10; x.shadowOffsetY=4; rrect(x,bx-10,by-10,bw+20,bh+20,(bh+20)/2); x.fillStyle="#FFFFFF"; x.fill(); x.shadowColor="transparent";
    rrect(x,bx,by,bw,bh,bh/2); const g=x.createLinearGradient(0,by,0,by+bh); g.addColorStop(0,lab0); g.addColorStop(1,lab1); x.fillStyle=g; x.fill();
    x.setLineDash([8,6]); x.lineWidth=3; x.strokeStyle="rgba(255,255,255,.9)"; rrect(x,bx+10,by+10,bw-20,bh-20,(bh-20)/2); x.stroke(); x.setLineDash([]);
    x.fillStyle=acc; heart(x,bx+48,h/2+2,15); x.fill(); x.fillStyle="#FFFFFF"; x.beginPath(); x.arc(bx+42,h/2-6,4,0,7); x.fill();
    x.fillStyle=ink; x.textAlign="left"; x.textBaseline="middle"; x.fillText(txt,bx+84,h/2+4,300);
    x.fillStyle=spark; star4(x,bx+bw-24,by+22,12); x.fill()},true)}
let nameMesh=null;
function baseMaterial(){
  const c=lin(S.baseColor);
  switch(S.base){
    case "tint": return new THREE.MeshPhysicalMaterial({color:c,roughness:0.05,transmission:1-baseOp(),transparent:true,clearcoat:1,envMapIntensity:1.5,depthWrite:false,side:THREE.DoubleSide});
    case "gloss": return surfMat("gloss",S.baseColor);
    case "matte": return surfMat("matte",S.baseColor);
    case "holo": return surfMat("holo",S.baseColor);
    default: return new THREE.MeshPhysicalMaterial({color:lin("#EEF4FF"),roughness:0.04,transmission:1-baseOp(),transparent:true,clearcoat:1,clearcoatRoughness:0.03,envMapIntensity:1.6,depthWrite:false,side:THREE.DoubleSide});
  }
}
function applyBase(){
  const oldBase=clearMat; clearMat=baseMaterial(); block.material=clearMat; freeMat(oldBase); const see=S.base==="clear"||S.base==="tint"; cavity.visible=see; bot.visible=see||true;
  if(nameMesh){root.remove(nameMesh); freeTree(nameMesh); nameMesh=null}
  if(S.name){nameMesh=new THREE.Mesh(new THREE.PlaneGeometry(18,6.75),new THREE.MeshPhysicalMaterial({map:nameSticker(S.name),transparent:true,alphaTest:0.05,roughness:0.35,clearcoat:0.6,polygonOffset:true,polygonOffsetFactor:-3}));
    nameMesh.position.set(0,-7.4,11.36); nameMesh.rotation.z=0; nameMesh.renderOrder=6; root.add(nameMesh)}
}

/* ---------- glitter: real little 3D flakes that tumble like a snow globe ---------- */
/* One row per kind. glow = soft light in the flake's OWN shape, drawn on a plane that tumbles with the
   flake (so a star glows as a star, not as a round blob); the flake itself hides the plane's middle.
   rad (worked out in makeParticles) = how far a flake plus its glow reaches from its centre. */
const GLITTERS={
  star:{n:60,scale:0.42,grav:4.2,shape:"star",self:true},   // self: the body itself shines - no light around it
  snow:{n:30,scale:1.0,grav:2.6,shape:"snow",self:true},
  heart:{n:28,scale:1.0,grav:4.2,shape:"heart"},
  aurora:{n:46,scale:0.8,grav:4.2,shape:"hex"},
  pearl:{n:34,scale:0.62,grav:5.2,shape:"pearl"},
  sakura:{n:26,scale:0.95,grav:1.9,shape:"petal",flutter:true},
  confetti:{n:44,scale:0.72,grav:3.2,shape:"cheart",multi:["#FF8FB8","#FFD45C","#8FD3FF","#B8A2FF","#9BE3B0"]}
};
const GLIT_BASE={star:"#FFD66B",snow:"#FFFFFF",heart:"#FF8FB8",aurora:"#FFFFFF",pearl:"#FFF3EE",sakura:"#FFC2D4",confetti:"#FFFFFF"};
const GLIT_R={star:1.02,snow:1.07,heart:1.12,hex:0.77,pearl:0.62,petal:1.03,cheart:1.1};   // unit radius of each shape
const GLIT_GEO={}, GLIT_MAT={}, GLOW_TEX={}, GLOW_MAT={};
/* A dark resin/jelly cap: the flakes were dulled to muddy colours by the dark resin in front of them. There every
   kind lights up in its own colour and gets a soft light around it (drawn after the cap, so the tint can't dull it). */
const DARK_GLOW={tex:"dot",size:2.3,amt:0.6,lo:0.3,speed:[0.7,1.9]};
function darkCap(){if(!(S.mat==="resin"||S.mat==="jelly")) return false; const c=new THREE.Color(S.color); return (0.299*c.r+0.587*c.g+0.114*c.b)<0.4}
function glowOf(G){if(G.self) return null; const d=darkCap(); return G.glow?(d?Object.assign({},G.glow,{amt:G.glow.amt*1.3}):G.glow):(d?DARK_GLOW:null)}
function starPts(r0,r1,n){const p=[]; for(let i=0;i<n*2;i++){const a=i/(n*2)*Math.PI*2-Math.PI/2, r=i%2?r1:r0; p.push([Math.cos(a)*r,Math.sin(a)*r])} return p}
function snowPts(){const p=[]; for(let i=0;i<24;i++){const a=i/24*Math.PI*2, r=[1,0.35,0.62,0.35][i%4]; p.push([Math.cos(a)*r,Math.sin(a)*r])} return p}
function heartShape(k){const s=new THREE.Shape(); s.moveTo(0,-3.4*k); s.bezierCurveTo(-1.6*k,-2.2*k,-4.6*k,-0.6*k,-4.6*k,1.6*k); s.bezierCurveTo(-4.6*k,3.6*k,-2.9*k,4.6*k,-1.7*k,4.6*k); s.bezierCurveTo(-0.8*k,4.6*k,-0.2*k,4.1*k,0,3.3*k);
  s.bezierCurveTo(0.2*k,4.1*k,0.8*k,4.6*k,1.7*k,4.6*k); s.bezierCurveTo(2.9*k,4.6*k,4.6*k,3.6*k,4.6*k,1.6*k); s.bezierCurveTo(4.6*k,-0.6*k,1.6*k,-2.2*k,0,-3.4*k); return s}
function polyShape(pts){const s=new THREE.Shape(); pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y)); s.closePath(); return s}
function glitterGeo(shape){
  if(GLIT_GEO[shape]) return GLIT_GEO[shape];
  let g;
  if(shape==="pearl") g=new THREE.SphereGeometry(0.62,18,14);
  else{
    const ext=(s,d,b)=>new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:10});
    if(shape==="star") g=ext(polyShape(starPts(0.95,0.42,5)),0.14,0.07);
    else if(shape==="snow") g=ext(polyShape(snowPts()),0.14,0.07);
    else if(shape==="heart") g=ext(heartShape(0.24),0.14,0.07);
    else if(shape==="cheart") g=ext(heartShape(0.24),0.04,0.02);      // thin paper confetti
    else if(shape==="petal"){const s=new THREE.Shape(); s.moveTo(0,-1); s.bezierCurveTo(0.95,-0.55,1.05,0.5,0.36,1); s.lineTo(0,0.76); s.lineTo(-0.36,1); s.bezierCurveTo(-1.05,0.5,-0.95,-0.55,0,-1); g=ext(s,0.05,0.03)}
    else g=ext(polyShape(starPts(0.7,0.7,3)),0.14,0.07);              // aurora: hexagon
    g.center();
  }
  return (GLIT_GEO[shape]=keep(g));
}
// pearl: a faint pastel sheen only at grazing angles (holoize is far too strong for a pearl)
function pearlize(mat){mat.onBeforeCompile=(sh)=>{sh.fragmentShader=sh.fragmentShader.replace("#include <tonemapping_fragment>",`
    { vec3 vd=normalize(vViewPosition); float f=1.0-abs(dot(normalize(normal),vd));
      vec3 rb=0.8+0.2*cos(6.2831*(f*1.1+vec3(0.0,0.33,0.67)));
      gl_FragColor.rgb=mix(gl_FragColor.rgb,gl_FragColor.rgb*rb+0.08,0.55*f); }
    #include <tonemapping_fragment>`)}; mat.customProgramCacheKey=()=>"pearl"; return mat}
function glitterMat(kind){
  const dark=darkCap(), key=kind+"|"+S.glitColor+(dark?"|d":""); if(GLIT_MAT[key]) return GLIT_MAT[key];
  const col=lin(S.glitColor||GLIT_BASE[kind]); let m;
  if(kind==="star") m=new THREE.MeshStandardMaterial({color:col,metalness:0.75,roughness:0.18,emissive:col,emissiveIntensity:0.85});
  else if(kind==="snow") m=new THREE.MeshPhysicalMaterial({color:col,metalness:0,roughness:0.28,clearcoat:1,clearcoatRoughness:0.1,emissive:S.glitColor?col:lin("#E6F1FF"),emissiveIntensity:0.6});
  else if(kind==="heart") m=holoize(new THREE.MeshPhysicalMaterial({color:col,metalness:0.25,roughness:0.14,clearcoat:1,emissive:col,emissiveIntensity:0.2}),true);
  else if(kind==="pearl") m=pearlize(new THREE.MeshPhysicalMaterial({color:col,metalness:0.05,roughness:0.16,clearcoat:1,clearcoatRoughness:0.05,emissive:col,emissiveIntensity:0.1}));
  else if(kind==="sakura") m=new THREE.MeshPhysicalMaterial({color:col,metalness:0,roughness:0.45,clearcoat:0.4,side:THREE.DoubleSide,emissive:col,emissiveIntensity:0.14});
  else if(kind==="confetti") m=new THREE.MeshStandardMaterial({color:0xffffff,metalness:0.1,roughness:0.5,side:THREE.DoubleSide,emissive:0x000000});
  else m=holoize(new THREE.MeshPhysicalMaterial({color:col,metalness:0.7,roughness:0.1,clearcoat:1}),true);
  // star dust and snowflakes light up themselves (not just a rim of light around them)
  if(kind==="star"){m.emissiveIntensity=1.25; m.metalness=0.35; m.toneMapped=false}
  if(kind==="snow"){m.emissiveIntensity=0.95; m.toneMapped=false}
  if(dark&&m.emissive){ // on a dark cap every flake glows in its own colour
    if(kind==="confetti"){m.emissive.set(0xffffff); m.emissiveIntensity=0.35}
    else{m.emissive.copy(col); m.emissiveIntensity=Math.max(m.emissiveIntensity||0,kind==="star"||kind==="snow"?1.3:0.75)}
    m.toneMapped=false}
  /* The body itself bright: flakes used to be drawn before the resin and then covered by it, which dulled them no matter
     how strongly they glowed. These are drawn AFTER the cap instead (still fully opaque), so nothing lies over them. */
  if(kind==="star"||kind==="snow"||dark){m.transparent=true; m.opacity=1; m.depthWrite=true; m.userData.front=true}
  m.userData.e0=m.emissiveIntensity||0;
  return (GLIT_MAT[key]=keep(m));
}
// the glow texture: a soft round light, brightest in the middle (an outline-shaped blur made a bright rim around the
// flake instead of the flake itself glowing); star dust also gets four faint rays, like a twinkling star
function glitGlowTex(tex){
  if(GLOW_TEX[tex]) return GLOW_TEX[tex];
  const t=canvasTex(128,128,(x)=>{x.translate(64,64);
    const g=x.createRadialGradient(0,0,0,0,0,62); g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(0.18,"rgba(255,255,255,.75)"); g.addColorStop(0.45,"rgba(255,255,255,.22)"); g.addColorStop(1,"rgba(255,255,255,0)");
    x.fillStyle=g; x.fillRect(-64,-64,128,128);
    if(tex==="star"){x.globalCompositeOperation="lighter"; for(const a of [0,Math.PI/2]){x.save(); x.rotate(a+Math.PI/4*0);
      const r=x.createLinearGradient(-62,0,62,0); r.addColorStop(0,"rgba(255,255,255,0)"); r.addColorStop(0.5,"rgba(255,255,255,.55)"); r.addColorStop(1,"rgba(255,255,255,0)");
      x.fillStyle=r; x.beginPath(); x.ellipse(0,0,62,2.6,0,0,7); x.fill(); x.restore()}}});
  return (GLOW_TEX[tex]=keep(t));
}
function glowMat(gl,kind){
  const key=gl.tex+"|"+kind+"|"+S.glitColor; if(GLOW_MAT[key]) return GLOW_MAT[key];
  const base=kind==="star"?"#FFD98A":kind==="snow"?"#DDEBFF":kind==="confetti"?"#FFF1D6":mixHex(GLIT_BASE[kind]||"#FFFFFF","#FFFFFF",0.35);
  const col=S.glitColor?new THREE.Color(S.glitColor).lerp(new THREE.Color("#FFFFFF"),0.4):new THREE.Color(base);
  return (GLOW_MAT[key]=keep(new THREE.MeshBasicMaterial({map:glitGlowTex(gl.tex),color:col.convertSRGBToLinear(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})));
}
const GLOW_PLANE=keep(new THREE.PlaneGeometry(1,1));

/* Keeping the glitter inside the cap, in all three directions.
   Sideways: the cap's own cross-section, not a square box (a square let flakes out of the heart and the
   round cap's corners). FENCE.R[a] = distance from the centre to the outline along angle a for a unit
   section; FENCE.E is the same, looking a few degrees either side at the heart's concave notch.
   Up/down: the real top surface (SA and round tops are dished, the heart is domed, every top edge is
   rounded) and the flake's own size - a flat 90%-of-height ceiling let big flakes poke through the top
   whenever the key was pressed. Checked headless: every kind x every shape, thousands of shaken frames. */
const FENCE_N=180, FENCES={};
function fenceTable(p){const key=p.sec+p.n0+"/"+p.n1; if(FENCES[key]) return FENCES[key];
  const secs=FIXED_SEC[p.sec]?[section(p.sec,0,96)]:[section("se",p.n0,96),section("se",p.n1,96)], R=new Float32Array(FENCE_N);
  for(let k=0;k<FENCE_N;k++){const a=k/FENCE_N*Math.PI*2, dx=Math.cos(a), dz=Math.sin(a); let best=Infinity;
    for(const sec of secs) for(let i=0;i<sec.length;i++){const [x1,z1]=sec[i],[x2,z2]=sec[(i+1)%sec.length], ex=x2-x1, ez=z2-z1, den=ex*dz-dx*ez; if(Math.abs(den)<1e-12) continue;
      const t=(ex*z1-x1*ez)/den, u=(dx*z1-dz*x1)/den; if(t>0&&u>=0&&u<1&&t<best) best=t}
    R[k]=best}
  const win=FIXED_SEC[p.sec]?9:0, E=new Float32Array(FENCE_N);
  for(let k=0;k<FENCE_N;k++){let m=R[k]; for(let j=-win;j<=win;j++) m=Math.min(m,R[(k+j+FENCE_N)%FENCE_N]); E[k]=m}
  return (FENCES[key]={R,E})}
function fenceAt(T,a){const f=((a/(Math.PI*2))%1+1)%1*FENCE_N, i=Math.floor(f)%FENCE_N; return lerp(T[i],T[(i+1)%FENCE_N],f-Math.floor(f))}
// half-width of the cap wall at height y (same formula as capGeometry, bevel included)
function wallW(p,y){const yb=p.h-p.bev; if(y<=yb) return lerp(p.bw,p.tw,Math.pow(clamp(y/yb),1.2))/2;
  const s=clamp((y-yb)/p.bev); return p.tw/2-p.bev*(1-Math.sqrt(1-s*s))}
// height of the top surface at relative radius rho (1 = the wall's top edge), dish / dome / rounded edge included
function capTopY(p,flat,rho){const hw=p.tw/2, topW=hw-p.bev, rTop=topW/hw, dish=flat?0:p.dish, dome=flat?Math.min(p.dome,0.6):p.dome;
  if(rho<=rTop){const f=rho/rTop; return p.h+(dome-dish)*(1-f*f)}
  const c=clamp(1-(1-Math.min(rho,1))*hw/p.bev,0,1); return p.h-p.bev+Math.sqrt(1-c*c)*p.bev}
function fenceLim(F,a,w,rad){const r=fenceAt(F.E,a)*w; return Math.max(0,Math.min(r*0.72,r-rad-0.45))}
// hv = how far the flake reaches up/down right now: flat flakes reach less when lying flat (see stepParticles)
function ceilAt(sys,x,z,hv){const {p,flat,F,rad}=sys, hw=p.tw/2, rr=Math.hypot(x,z), R=fenceAt(F.R,Math.atan2(z,x))*hw, rho=rr/R, d=rad/R;
  return Math.min(capTopY(p,flat,Math.max(0,rho-d)),capTopY(p,flat,rho+d))-(hv==null?rad:hv)-0.12}
function makeParticles(p,g){
  if(S.glitter==="none"||!(S.mat==="resin"||S.mat==="jelly")) return null;
  const kind=S.glitter, G=GLITTERS[kind]; if(!G) return null;
  const N=G.n, flat=S.charPos==="top"||S.charPos==="stand", F=fenceTable(p);
  const gl=glowOf(G); let rad=GLIT_R[G.shape]*G.scale*1.15; if(gl) rad=Math.max(rad,gl.size*G.scale*1.15/2*0.8);
  const mesh=new THREE.InstancedMesh(glitterGeo(G.shape),glitterMat(kind),N); mesh.renderOrder=mesh.material.userData.front?3:1; mesh.frustumCulled=false;
  if(G.multi){const c=new THREE.Color(); for(let i=0;i<N;i++){c.copy(lin(S.glitColor||G.multi[i%G.multi.length])); mesh.setColorAt(i,c)} mesh.instanceColor.needsUpdate=true}
  let glow=null; if(gl){glow=new THREE.InstancedMesh(GLOW_PLANE,glowMat(gl,kind),N); glow.renderOrder=4; glow.frustumCulled=false; const c=new THREE.Color(1,1,1); for(let i=0;i<N;i++) glow.setColorAt(i,c)}
  const pos=new Float32Array(N*3), vel=new Float32Array(N*3), rot=new Float32Array(N*3), spin=new Float32Array(N*3), r=mulberry32(9);
  const sys={mesh,glow,gl,G,pos,vel,rot,spin,rest:new Uint8Array(N),N,p,flat,F,rad,floor:rad*0.75+0.12,dummy:new THREE.Object3D(),tc:new THREE.Color()};
  for(let i=0;i<N;i++){const y=sys.floor+r()*p.h*0.25, a=r()*Math.PI*2, rr=Math.sqrt(r())*fenceLim(F,a,wallW(p,y),rad);
    pos[i*3]=Math.cos(a)*rr; pos[i*3+1]=Math.min(y,ceilAt(sys,pos[i*3],Math.sin(a)*rr)); pos[i*3+2]=Math.sin(a)*rr;
    for(let k=0;k<3;k++){rot[i*3+k]=r()*6.28; spin[i*3+k]=(r()*2-1)*0.4}}
  return sys;
}
function stirParticles(){if(!partSys) return; const {vel,spin,N}=partSys; for(let i=0;i<N;i++){const a=Math.random()*Math.PI*2; vel[i*3]+=Math.cos(a)*(5+Math.random()*9); vel[i*3+1]+=9+Math.random()*14; vel[i*3+2]+=Math.sin(a)*(5+Math.random()*9); for(let k2=0;k2<3;k2++) spin[i*3+k2]+=(Math.random()*2-1)*9}}
const BB_Q=new THREE.Quaternion();
function stepParticles(dt,t){
  if(!partSys) return; if(partSys.glow){capGroup.getWorldQuaternion(BB_Q); BB_Q.invert().multiply(camera.quaternion)}   // glow faces the camera
  const sys=partSys, {mesh,glow,gl,G,pos,vel,rot,spin,rest,N,p,F,rad,floor,dummy,tc}=sys, grav=G.grav, lit=S.glow?1.5:1;
  for(let i=0;i<N;i++){const ix=i*3;
    vel[ix+1]-=grav*dt; const d=1-2.4*dt; vel[ix]*=d; vel[ix+1]*=d; vel[ix+2]*=d;
    if(G.flutter){vel[ix]+=Math.sin(t*1.7+i*1.3)*2.2*dt; vel[ix+2]+=Math.cos(t*1.3+i*0.7)*2.2*dt}   // petals drift side to side
    pos[ix]+=vel[ix]*dt; pos[ix+1]+=vel[ix+1]*dt; pos[ix+2]+=vel[ix+2]*dt;
    // turn first, so the limits below see the flake exactly as it is drawn this frame
    const sd=1-1.5*dt; for(let k2=0;k2<3;k2++){rot[ix+k2]+=spin[ix+k2]*dt; spin[ix+k2]*=sd}
    if(rest[i]) rot[ix]=lerp(rot[ix],Math.round(rot[ix]/Math.PI)*Math.PI+Math.PI/2,dt*3);   // settled flakes lie flat-ish
    // vertical reach of this flake as it is tilted now: a flat piece reaches rad*|sin(tilt)| (+ its thickness)
    const ny=-Math.sin(rot[ix])*Math.cos(rot[ix+1]), hv=G.shape==="pearl"?rad:rad*Math.sqrt(Math.max(0,1-ny*ny))+0.1*G.scale, fl=Math.max(floor*0.4,hv+0.05);
    if(pos[ix+1]<fl){pos[ix+1]=fl; vel[ix+1]=0; for(let k2=0;k2<3;k2++) spin[ix+k2]*=0.9}
    {const px=pos[ix], pz=pos[ix+2], rr=Math.hypot(px,pz);
      if(rr>1e-6){const lim=fenceLim(F,Math.atan2(pz,px),wallW(p,pos[ix+1]),rad);
        if(rr>lim){const ux=px/rr, uz=pz/rr, vr=vel[ix]*ux+vel[ix+2]*uz; pos[ix]=ux*lim; pos[ix+2]=uz*lim; if(vr>0){vel[ix]-=1.4*vr*ux; vel[ix+2]-=1.4*vr*uz}}}}
    {const top=ceilAt(sys,pos[ix],pos[ix+2],hv); if(pos[ix+1]>top){pos[ix+1]=Math.max(fl,top); if(vel[ix+1]>0) vel[ix+1]*=-0.3}}
    rest[i]=pos[ix+1]<=fl+0.01?1:0;
    const s=G.scale*(0.85+0.3*hash(i+40));
    dummy.position.set(pos[ix],pos[ix+1],pos[ix+2]); dummy.rotation.set(rot[ix],rot[ix+1],rot[ix+2]); dummy.scale.setScalar(s); dummy.updateMatrix(); mesh.setMatrixAt(i,dummy.matrix);
    if(glow){dummy.quaternion.copy(BB_Q); dummy.scale.setScalar(s*gl.size); dummy.updateMatrix(); glow.setMatrixAt(i,dummy.matrix);
      const sp=gl.speed, w=0.5+0.5*Math.sin(t*(sp[0]+hash(i+300)*(sp[1]-sp[0]))+hash(i+500)*6.28), lo=gl.lo;
      glow.setColorAt(i,tc.setScalar((lo+(1-lo)*w*w)*gl.amt*lit))}
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(glow){glow.instanceMatrix.needsUpdate=true; glow.instanceColor.needsUpdate=true}
}

function rebuild(){
  const p=PROFILES[S.shape], flat=S.charPos==="top"||S.charPos==="stand";
  capGroup.children.forEach(freeTree);
  while(capGroup.children.length) capGroup.remove(capGroup.children[0]);
  capGeo=capGeoFor(p,flat);
  capMesh=new THREE.Mesh(capGeo,capMaterial()); capMesh.renderOrder=2; capMesh.userData.col=lin(S.color); capGroup.add(capMesh);
  if(S.ears!=="none") capGroup.add(buildEars(p,capGeo,capMesh.material));
  if(hasFace()) capGroup.add(buildFace(p,capGeo));
  if(S.charPos!=="none"){charGroup=buildChar(p,capGeo); capGroup.add(charGroup)}
  partSys=makeParticles(p,capGeo); if(partSys){capGroup.add(partSys.mesh); if(partSys.glow) capGroup.add(partSys.glow); stepParticles(0.001,0)}
  decoGroup=buildDeco(p,capGeo); capGroup.add(decoGroup);
  applyBase();
  stemMat.color.copy(lin(swColor()));
  writeHash(); $("standRow").hidden=S.charPos!=="stand"; syncOpUI();
}
function syncOpUI(){$("capOpRow").hidden=!(S.mat==="resin"||S.mat==="jelly"); $("baseOpRow").hidden=!(S.base==="clear"||S.base==="tint");
  $("capOp").value=Math.round((S.capOp==null?OP_DEF[S.mat]||0.5:S.capOp/100)*100); $("baseOp").value=Math.round((S.baseOp==null?OP_DEF[S.base]||0.5:S.baseOp/100)*100)}
let opJob=0; $("capOp").addEventListener("input",e=>{S.capOp=+e.target.value; if(!opJob) opJob=requestAnimationFrame(()=>{opJob=0; rebuild()})});
$("baseOp").addEventListener("input",e=>{S.baseOp=+e.target.value; applyBase(); writeHash()});

/* ---------- interaction: turn, pinch/scroll zoom, two-finger / right-drag pan, tap to press ---------- */
let rotY=-0.55, rotX=0.0, velY=0, idle=0, press=0, pressV=0, pressed=false, PAUSE=false;
const CAM={zoom:1,panX:0,panY:0,locked:false}, HOME={rotY:-0.55,rotX:0};
const ptrs=new Map(); let gesture=null;
function camApply(){const d=90*CAM.zoom, tgt=new THREE.Vector3(CAM.panX,6+CAM.panY,0); camera.position.set(CAM.panX,tgt.y+48*CAM.zoom,d*0.9); camera.lookAt(tgt)}
cv.addEventListener("pointerdown",e=>{try{cv.setPointerCapture&&cv.setPointerCapture(e.pointerId)}catch(err){} ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1) gesture={mode:(e.button===2||e.shiftKey)?"pan":"turn",x0:e.clientX,y0:e.clientY,t:performance.now(),moved:false};
  else if(ptrs.size===2){const [a,b]=[...ptrs.values()]; gesture={mode:"pinch",d0:Math.hypot(a.x-b.x,a.y-b.y),z0:CAM.zoom,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,px:CAM.panX,py:CAM.panY,moved:true}}});
cv.addEventListener("contextmenu",e=>e.preventDefault());
// phones: the preview frame docks at the top; the tabs dock under it (--barh) and the bar gets a shadow once stuck
(function(){const fr=cv.closest(".frame"); if(!fr) return; const set=()=>{const st=getComputedStyle(fr).position==="sticky";
    document.documentElement.style.setProperty("--barh",st?fr.offsetHeight+"px":"0px"); const box=fr.closest(".layout"); fr.classList.toggle("stuck",st&&((box&&box.scrollTop>4)||window.scrollY>4))};
  addEventListener("scroll",set,{passive:true}); const box0=fr.closest(".layout"); if(box0) box0.addEventListener("scroll",set,{passive:true}); addEventListener("resize",set); new ResizeObserver(set).observe(fr); set()})();
// quick taps on the keycap must not zoom the page (iOS double-tap zoom, pinch-zoom of the whole page)
cv.addEventListener("touchend",e=>{if(e.cancelable) e.preventDefault()},{passive:false});
["gesturestart","gesturechange"].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});
cv.addEventListener("pointermove",e=>{if(!ptrs.has(e.pointerId)||!gesture) return; const prev=ptrs.get(e.pointerId); const dx=e.clientX-prev.x, dy=e.clientY-prev.y; ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY}); idle=0;
  if(gesture.mode==="pinch"&&ptrs.size===2){const [a,b]=[...ptrs.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); if(!CAM.locked){CAM.zoom=clamp(gesture.z0*gesture.d0/Math.max(20,d),0.45,1.8); const mx=(a.x+b.x)/2, my=(a.y+b.y)/2; CAM.panX=clamp(gesture.px-(mx-gesture.mx)*0.08*CAM.zoom,-25,25); CAM.panY=clamp(gesture.py+(my-gesture.my)*0.08*CAM.zoom,-20,25); camApply()} return}
  if(Math.hypot(e.clientX-gesture.x0,e.clientY-gesture.y0)>6) gesture.moved=true;
  if(CAM.locked) return;
  if(gesture.mode==="pan"){CAM.panX=clamp(CAM.panX-dx*0.08*CAM.zoom,-25,25); CAM.panY=clamp(CAM.panY+dy*0.08*CAM.zoom,-20,25); camApply()}
  else{rotY+=dx*0.012; velY=dx*0.012; rotX=clamp(rotX+dy*0.006,-0.3,0.45)}});
function up(e){const g=gesture; ptrs.delete(e.pointerId); if(g&&ptrs.size===0){if(!g.moved&&g.mode==="turn"&&performance.now()-g.t<350) pressKey(); gesture=null}}
cv.addEventListener("pointerup",up); cv.addEventListener("pointercancel",up);
cv.addEventListener("wheel",e=>{e.preventDefault(); if(CAM.locked) return; CAM.zoom=clamp(CAM.zoom*(1+Math.sign(e.deltaY)*0.08),0.45,1.8); camApply()},{passive:false});
function pressKey(){pressed=true; sfx("down"); stirParticles(); try{navigator.vibrate&&navigator.vibrate(12)}catch(e){} setTimeout(()=>{pressed=false; sfx("up")},130); idle=0}
function resetView(){CAM.zoom=1; CAM.panX=0; CAM.panY=0; rotY=HOME.rotY; rotX=HOME.rotX; velY=0; camApply()}
camApply();

/* switch sounds */
let AC=null, MASTER=null;
function outNode(a){if(!MASTER){MASTER=a.createGain(); MASTER.connect(a.destination)} return MASTER}   // every sound goes through here
function ac(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==="suspended") AC.resume(); return AC}catch(e){return null}}
let NB=null; function noiseBuf(a){if(NB) return NB; const b=a.createBuffer(1,a.sampleRate*0.2,a.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; NB=b; return b}
function burst(a,t0,lo,hi,vol,dec){const s=a.createBufferSource(); s.buffer=noiseBuf(a); const bp=a.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=Math.sqrt(lo*hi); bp.Q.value=Math.max(0.3,Math.sqrt(lo*hi)/(hi-lo)); const g=a.createGain(); g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(0.0001,t0+dec); s.connect(bp).connect(g).connect(outNode(a)); s.start(t0); s.stop(t0+dec+0.02)}
function thump(a,t0,f,vol,dec){const o=a.createOscillator(), g=a.createGain(); o.type="sine"; o.frequency.setValueAtTime(f,t0); o.frequency.exponentialRampToValueAtTime(f*0.6,t0+dec); g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(0.0001,t0+dec); o.connect(g).connect(outNode(a)); o.start(t0); o.stop(t0+dec+0.02)}
function chime(a,t0){[1568,2093,2637].forEach((f,i)=>{const o=a.createOscillator(), g=a.createGain(); o.type="sine"; o.frequency.value=f; g.gain.setValueAtTime(0.0001,t0+i*0.05); g.gain.linearRampToValueAtTime(0.035,t0+i*0.05+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t0+i*0.05+0.5); o.connect(g).connect(outNode(a)); o.start(t0+i*0.05); o.stop(t0+i*0.05+0.55)})}
/* The owner's own keyboard recordings (the same packs her desktop timer uses), in sounds/<switch>/.
   Every press plays a different key - now and then a space/enter/shift/backspace - so pressing the
   keycap sounds like typing instead of one clip on repeat. gain evens the packs out (key RMS 841~1216). */
const PACKS={mango:{keys:10,spec:1,gain:1.1},frog:{keys:10,spec:1,gain:0.96},tico:{keys:24,spec:4,gain:0.8},
  violet:{keys:10,spec:1,gain:1.12},caramel:{keys:10,spec:1,gain:1.01},black:{keys:10,spec:1,gain:1.04}};
const PACK_BUF={}, PACK_LOAD={}, PACK_DONE={};
function loadPack(id){
  if(PACK_LOAD[id]||!PACKS[id]) return PACK_LOAD[id]; const P=PACKS[id], names=[];
  for(let i=1;i<=P.keys;i++) names.push("key"+i); for(const k of ["space","enter","shift","back"]) for(let i=1;i<=P.spec;i++) names.push(k+i);
  // decoding needs no user gesture on an offline context, and AudioBuffers play on any context
  let dec=null; try{dec=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,1,44100)}catch(e){}
  if(!dec){PACK_DONE[id]=true; return (PACK_LOAD[id]=Promise.resolve())}
  return (PACK_LOAD[id]=Promise.all(names.map(n=>fetch(`sounds/${id}/${n}.wav`).then(r=>r.ok?r.arrayBuffer():Promise.reject(r.status))
      .then(b=>new Promise((ok,no)=>dec.decodeAudioData(b,ok,no))).then(buf=>[n,buf]).catch(()=>null)))
    .then(list=>{const pb={key:[],space:[],enter:[],shift:[],back:[]}; let got=0;
      for(const it of list){if(!it) continue; pb[it[0].replace(/\d+$/,"")].push(it[1]); got++}
      if(got&&pb.key.length) PACK_BUF[id]=pb; PACK_DONE[id]=true}));   // nothing loaded (opened as a file) -> the synth below stays
}
let lastKeys=[];
function pickSound(pb){
  const r=Math.random(); let kind="key";
  if(r<0.06&&pb.space.length) kind="space"; else if(r<0.1&&pb.enter.length) kind="enter";
  else if(r<0.13&&pb.shift.length) kind="shift"; else if(r<0.15&&pb.back.length) kind="back";
  const list=pb[kind]; let i=Math.floor(Math.random()*list.length);
  if(kind==="key"&&list.length>3){for(let n=0;n<8&&lastKeys.includes(i);n++) i=Math.floor(Math.random()*list.length); lastKeys=[i,...lastKeys].slice(0,2)}
  return list[i];
}
function playPack(a){const pb=PACK_BUF[S.sw]; if(!pb) return false;
  const src=a.createBufferSource(); src.buffer=pickSound(pb); src.playbackRate.value=0.98+Math.random()*0.04;
  const g=a.createGain(); g.gain.value=PACKS[S.sw].gain; src.connect(g).connect(outNode(a)); src.start(); return true}
// changing the switch: let its sounds arrive before the demo press, so it is heard with the new switch
function previewSwitch(){ac(); const p=loadPack(S.sw); if(PACK_BUF[S.sw]||!p) pressKey(); else p.then(pressKey,pressKey)}
function sfx(kind){if(!S.sound) return; const a=ac(); if(!a) return; const p=loadPack(S.sw), id=S.sw;
  if(PACK_BUF[id]){if(kind==="down") playPack(a); return}   // a recording already holds the whole keystroke
  // still arriving (a press right after the page opens): play the recording as soon as it lands instead
  // of the synth - it used to answer the very first press with the synth's "둥"
  if(p&&!PACK_DONE[id]){if(kind==="down"){const t0=performance.now(); p.then(()=>{if(PACK_BUF[id]&&S.sw===id&&performance.now()-t0<700) playPack(a)})} return}
  const t=a.currentTime; const deep=S.mat==="resin"||S.mat==="jelly"?0.9:1.1;   // fallback when the files can't load
  if(kind==="down"){burst(a,t+0.02,500*deep,2200*deep,0.7,0.06); thump(a,t+0.02,170*deep,0.45,0.09)}
  else{burst(a,t,700*deep,2600*deep,0.3,0.04); thump(a,t,230*deep,0.18,0.05)}}

/* ---------- loop ---------- */
function resize(){const r=cv.getBoundingClientRect(); if(DESK){renderer.setSize(r.width,r.height,false); camera.aspect=r.width/Math.max(1,r.height); camera.updateProjectionMatrix(); return}   // desktop: the window's own shape
  renderer.setSize(r.width,r.width*5/4,false); camera.aspect=4/5; camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(cv); resize();
let last=performance.now(), T=0;
const RGB_TMP=new THREE.Color(), RGB_BASE=new THREE.Color(), RGB_NEON=new THREE.Color(), RGB_HSL={h:0,s:0,l:0}, GLOW_P=new THREE.Vector3(), GLOW_D=new THREE.Vector3(); let rgbHex=null;   // reused every frame (no garbage)
function applyRGB(t){
  if(rgbHex!==S.rgbColor){RGB_BASE.copy(lin(S.rgbColor)); rgbHex=S.rgbColor}
  let on=S.rgb!=="off", col=RGB_BASE, k=1;
  if(S.rgb==="rainbow") col=RGB_TMP.setHSL((t*0.12)%1,0.9,0.6).convertSRGBToLinear();
  if(S.rgb==="breath") k=0.35+0.65*(0.5+0.5*Math.sin(t*2.2));
  let boost=1; if(S.glow&&on){col.getHSL(RGB_HSL); col=RGB_NEON.setHSL(RGB_HSL.h,1,0.5); boost=3.6}   // 야광: 쨍한 형광색, past the dimmed exposure
  rgbLight.color.copy(col); rgbLight.intensity=on?2.4*k*boost:0;
  rgbGlow.material.color.copy(col).multiplyScalar(boost); rgbGlow.material.opacity=on?Math.min(1,0.55*k*(boost>1?1.5:1)):0;
  // An opaque base hides the light, and the glow card (which always faces the camera) cut through its walls
  // in a hard diagonal. There the glow sits right behind the base instead, so it shows as a soft halo around it.
  const see=(S.base==="clear"||S.base==="tint")&&baseOp()<0.6;   // a base made nearly opaque with the slider hides the light inside it, too
  if(see){rgbGlow.position.set(0,-2,0); rgbGlow.scale.set(34,34,1)}
  else{root.updateMatrixWorld(); GLOW_P.set(0,-4,0); root.localToWorld(GLOW_P); GLOW_D.copy(GLOW_P).sub(camera.position).normalize(); GLOW_P.addScaledVector(GLOW_D,17); root.worldToLocal(GLOW_P);
    rgbGlow.position.copy(GLOW_P); rgbGlow.scale.set(48,48,1); rgbGlow.material.opacity=on?0.7*k:0}
  rgbFloor.material.color.copy(col).multiplyScalar(boost); rgbFloor.material.opacity=on?Math.min(1,0.45*k*(boost>1?1.6:1)):0;
  if(clearMat.emissive) clearMat.emissive.copy(col).multiplyScalar(on?(see?0.18:0.05)*k*boost:0);   // opaque: a faint tint, like light bleeding through
}
/* 야광 모드: the lights dim and the cap (in its own colour) and the glitter glow from inside, breathing slowly */
const NEON=new THREE.Color("#39FF6A").convertSRGBToLinear();
/* 야광 모드 is the lights going out: exposure drops, and the cap, its decorations and the glitter glow neon green
   like glow-in-the-dark plastic (breathing slowly). Every material's own emissive is kept in userData to go back. */
function glowMat_(m,on,k){if(!m||!m.emissive) return; const u=m.userData; if(!u.em0){u.em0=m.emissive.clone(); u.ei0=m.emissiveIntensity||0}
  if(on){m.emissive.copy(NEON); m.emissiveIntensity=(m.toneMapped===false?0.9:2.6)*k} else if(u.glowOn){m.emissive.copy(u.em0); m.emissiveIntensity=u.ei0} u.glowOn=on}
function applyGlow(t){const on=S.glow;
  renderer.toneMappingExposure=on?0.3:0.92;
  hemiL.intensity=on?0.12:0.35; keyL.intensity=on?0.3:0.95; rimL.intensity=on?0.2:0.55;
  const k=0.85+0.15*Math.sin(t*1.3);
  if(capMesh&&capMesh.material.emissive){if(on){capMesh.material.emissive.copy(NEON); capMesh.material.emissiveIntensity=1.6*k} else {capMesh.material.emissive.copy(capMesh.userData.col); capMesh.material.emissiveIntensity=0}}
  for(const key in GLIT_MAT) glowMat_(GLIT_MAT[key],on,k);
  if(decoGroup){if(!decoGroup.userData.mats){const L=[]; decoGroup.traverse(o=>{if(o.material&&!L.includes(o.material)) L.push(o.material)}); decoGroup.userData.mats=L} decoGroup.userData.mats.forEach(m=>glowMat_(m,on,k))}
}
function poseAt(t){
  root.rotation.set(rotX,rotY,0);
  capGroup.position.y=5.2-press*2.4; stem.position.y=-press*2.4;
  if(decoGroup&&decoGroup.userData.halo){decoGroup.userData.halo.forEach(o=>o.position.y=o.userData.float+Math.sin(t*2)*0.45)}
  if(decoGroup&&decoGroup.userData.spin){const o=decoGroup.userData.spin; o.rotation.set(0,Math.sin(t*1.1)*0.6,0); o.position.y=o.userData.float+Math.sin(t*1.8)*0.5}
  applyRGB(t); applyGlow(t);
}
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now; T+=dt; idle+=dt;
  // the slow self-spin waits for the warm-up (it would stutter through its compiles); 12 s at most
  if(!gesture&&!CAM.locked){rotY+=velY; velY*=0.92; if(idle>2.5&&(warmDone||idle>12)) rotY+=dt*0.35}
  const target=pressed?1:0; pressV+=(target-press)*dt*260; pressV*=0.72; press+=pressV*dt*8; press=clamp(press,-0.2,1.1);
  stepParticles(dt,T);
  if(!PAUSE&&ONSCREEN&&(!DRAW_GATE||DRAW_GATE(now))){poseAt(T); renderer.render(scene,camera)}
  requestAnimationFrame(frame);
}
let ONSCREEN=true; try{new IntersectionObserver(es=>{ONSCREEN=es[es.length-1].isIntersecting},{rootMargin:"80px"}).observe(cv)}catch(e){}
requestAnimationFrame(frame);

/* ---------- palette from the character ---------- */
function extractPalette(it){
  const c=it.canvas, w=Math.min(120,c.width), h=Math.round(c.height*w/c.width), t=document.createElement("canvas"); t.width=w; t.height=h; const x=t.getContext("2d"); x.drawImage(c,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data, bins=new Map();
  for(let i=0;i<d.length;i+=4){if(d[i+3]<200) continue; const k=((d[i]>>4)<<8)|((d[i+1]>>4)<<4)|(d[i+2]>>4); bins.set(k,(bins.get(k)||0)+1)}
  const out=[]; for(const [k] of [...bins.entries()].sort((a,b)=>b[1]-a[1])){const r=((k>>8)&15)*17, g=((k>>4)&15)*17, b=(k&15)*17; if(out.every(o=>Math.abs(o[0]-r)+Math.abs(o[1]-g)+Math.abs(o[2]-b)>90)) out.push([r,g,b]); if(out.length>=5) break}
  return out.map(([r,g,b])=>"#"+[r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("").toUpperCase());
}

/* ---------- first-use hitches ----------
   The first time a look is drawn the GPU compiles its shader: 0.37~0.69 s froze the page on the first
   홀로그램 / 윗면 프린트 / 아크릴 스탠드 / 눈송이 (measured). warmUp() builds every look once, one per idle moment,
   and compiles it. The throw-away materials are kept alive (never disposed) so their programs stay cached. */
const WARM_KEEP=[]; let warmDone=false;
function warmUp(){
  const jobs=[];
  for(const m of Object.keys(OPT.mat)) jobs.push({mat:m});
  for(const sh of Object.keys(OPT.shape)) jobs.push({shape:sh});
  for(const c of ["top","stand","lie"]) jobs.push({charPos:c});
  for(const d of Object.keys(OPT.deco)) for(const dm of Object.keys(OPT.decoMat)) jobs.push({deco:d,decoMat:dm});
  for(const gl of Object.keys(OPT.glitter)) jobs.push({mat:"resin",glitter:gl},{mat:"resin",glitter:gl,color:"#2C2F36"});
  for(const b of Object.keys(OPT.base)) jobs.push({base:b});
  jobs.push({shape:"soft",ears:"cat",eyes:"round",nose:"tri",mouth:"w",extra:["blush"]},{ears:"dog"});
  // a compile holds the page for tens to hundreds of ms (r128 waits for the GPU), so steps run only while
  // nothing on screen is moving: the keycap stands still before its self-spin starts, or is scrolled away
  const step=()=>{if(!jobs.length){warmDone=true; return}
    const still=!ONSCREEN||(!gesture&&idle>0.4&&!(idle>2.5&&(warmDone||idle>12))&&Math.abs(velY)<1e-3&&Math.abs(pressV)<0.05);
    if(PAUSE||!still){setTimeout(step,150); return}
    // snapshot the user's settings now (not once at the start): a step must never undo a change they just made
    const tmp=new THREE.Group(), saved=Object.assign({},S);
    try{Object.assign(S,jobs.shift()); const p=PROFILES[S.shape], flat=S.charPos==="top"||S.charPos==="stand", cg=capGeoFor(p,flat);
      tmp.add(new THREE.Mesh(cg,capMaterial())); tmp.add(new THREE.Mesh(cg,baseMaterial()));
      if(S.charPos!=="none") tmp.add(buildChar(p,cg));
      const ps=makeParticles(p,cg); if(ps){tmp.add(ps.mesh); if(ps.glow) tmp.add(ps.glow)}
      tmp.add(buildDeco(p,cg));
      if(S.ears!=="none") tmp.add(buildEars(p,cg,capMaterial())); if(hasFace()) tmp.add(buildFace(p,cg));
      scene.add(tmp); renderer.compile(scene,camera)}
    catch(e){console.error("warm-up",e)}
    finally{Object.assign(S,saved); scene.remove(tmp);
      tmp.traverse(n=>{if(n.geometry&&!KEEP.has(n.geometry)) n.geometry.dispose(); if(n.material) (Array.isArray(n.material)?n.material:[n.material]).forEach(m=>{if(!KEEP.has(m)) WARM_KEEP.push(m)})})}
    setTimeout(step,16)};   // one look per frame
  setTimeout(step,16);
}

/* ---------- UI ---------- */
function chipGroup(id,key,labels,after){const el=$(id); el.innerHTML="";
  for(const k of Object.keys(labels)){const b=document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=labels[k]; if(key==="sw"){const d=document.createElement("span"); d.className="dot"; d.style.background=SWC[k]; b.prepend(d)} b.setAttribute("aria-pressed",String(S[key]===k));
    b.addEventListener("click",()=>{S[key]=k; if(key==="bg") S.bgImg=null; [...el.children].forEach(c=>c.setAttribute("aria-pressed",String(c===b))); if(after) after(k); else rebuild(); if(key==="sw") previewSwitch()}); el.appendChild(b)}}
function swatches(id,key,list){const el=$(id); el.innerHTML="";
  const all=[...S.palette,...list].filter((c,i,a)=>a.indexOf(c)===i);
  all.forEach(col=>{const b=document.createElement("button"); b.type="button"; b.className="sw"+(S.palette.includes(col)?" mine":""); if(col) b.style.background=col; else if(key==="eyeColor"||key==="eyeColor2"){b.style.background="#3B2F37"; b.title="기본 눈 색"} else {b.style.background="conic-gradient(#FFD66B,#FF8FB8,#8FD3FF,#B8A2FF,#FFD66B)"; b.title="기본 색"} b.setAttribute("aria-label",col||"기본 색"); b.setAttribute("aria-pressed",String(S[key]===col)); b.addEventListener("click",()=>{S[key]=col; [...el.children].forEach(c=>c.setAttribute("aria-pressed",String(c===b))); if(key==="baseColor") applyBase(); else if(key!=="rgbColor") rebuild()}); el.appendChild(b)});
  const pick=document.createElement("input"); pick.type="color"; pick.className="sw pick"; pick.value=S[key]||"#FFD66B"; pick.setAttribute("aria-label","직접 고르기"); pick.addEventListener("input",()=>{S[key]=pick.value.toUpperCase(); if(key==="baseColor") applyBase(); else if(key!=="rgbColor") rebuild()}); el.appendChild(pick);
}
function renderUI(){
  chipGroup("shapeChips","shape",OPT.shape); chipGroup("matChips","mat",OPT.mat); chipGroup("posChips","charPos",OPT.charPos); chipGroup("decoChips","deco",OPT.deco); chipGroup("decoMatChips","decoMat",OPT.decoMat);
  chipGroup("glitChips","glitter",OPT.glitter,()=>{rebuild(); pressKey()}); chipGroup("baseChips","base",OPT.base,()=>{applyBase(); writeHash(); syncOpUI()}); swatches("baseSw","baseColor",["#CFE3FF","#FFD1E3","#FFF1B8","#CDEFE0","#DCCBFF","#FFFFFF","#2C2F36"]); chipGroup("swChips","sw",OPT.sw); chipGroup("rgbChips","rgb",OPT.rgb,()=>{}); chipGroup("bgChips","bg",OPT.bg,()=>setBg());
  swatches("glitSw","glitColor",["","#FFD66B","#FFFFFF","#FF8FB8","#8FD3FF","#B8A2FF","#9BE3B0","#FFB38A"]);
  swatches("swSw","swColor",["","#FFB3CE","#A6E3B4","#3E8EEB","#9B6BFF","#D9A066","#26282E","#FFFFFF","#FF6B6B","#FFD66B"]);
  swatches("colSw","color",BASE_COLORS); swatches("decoSw","decoColor",DECO_COLORS); swatches("rgbSw","rgbColor",["#FF6FB5","#FF4D4D","#FFB547","#6BFF9E","#4DC3FF","#8C6BFF","#FFFFFF"]);
}
$("name").addEventListener("input",e=>{S.name=e.target.value.trim(); $("count").textContent=`${[...e.target.value].length}/6`; applyBase(); writeHash()});
$("lookalike").addEventListener("click",()=>{const it=S.items[0]; if(!it){toast("먼저 캐릭터 그림을 넣어 주세요"); return} S.palette=extractPalette(it); if(!S.palette.length) return; S.color=S.palette[0]; S.decoColor=S.palette[1]||S.palette[0]; S.rgbColor=S.palette[2]||S.palette[0]; renderUI(); rebuild(); pressKey(); toast("캐릭터 색으로 칠했어요")});
$("dice").addEventListener("click",()=>{const pk=(o)=>{const k=Object.keys(o); return k[Math.floor(Math.random()*k.length)]};
  S.shape=pk(OPT.shape); S.mat=pk(OPT.mat); S.deco=pk(OPT.deco); S.decoMat=pk(OPT.decoMat); S.glitter=pk(OPT.glitter); S.sw=pk(OPT.sw); S.rgb=pk(OPT.rgb); loadPack(S.sw);
  const cols=[...S.palette,...BASE_COLORS]; S.color=cols[Math.floor(Math.random()*cols.length)]; const dc=[...S.palette,...DECO_COLORS]; S.decoColor=dc[Math.floor(Math.random()*dc.length)];
  renderUI(); rebuild(); pressKey()});
function glowLabel(){const b=$("glowBtn"); b.setAttribute("aria-pressed",String(S.glow)); b.innerHTML=ICO("moon")+(S.glow?"야광 켜짐":"야광 모드")}
$("glowBtn").addEventListener("click",()=>{S.glow=!S.glow; if(!S.bgImg){if(S.glow){S.bg0=S.bg; S.bg="glow"} else S.bg=S.bg0&&S.bg0!=="glow"?S.bg0:"peach"; setBg(); renderUI()} glowLabel(); writeHash()});
$("snd").addEventListener("click",e=>{S.sound=!S.sound; e.currentTarget.setAttribute("aria-pressed",String(S.sound)); e.currentTarget.innerHTML=S.sound?ICO("sound")+"타건음 켜짐":ICO("mute")+"타건음 꺼짐"});
$("pressBtn").addEventListener("click",()=>{ac(); pressKey()});
$("camLock").addEventListener("click",e=>{CAM.locked=!CAM.locked; velY=0; e.currentTarget.setAttribute("aria-pressed",String(CAM.locked)); e.currentTarget.innerHTML=CAM.locked?ICO("lock")+"카메라 고정됨":ICO("unlock")+"카메라 고정"});
$("camReset").addEventListener("click",()=>{resetView(); toast("원래 위치로 돌아왔어요")});
$("bgFile").addEventListener("change",async e=>{const f=e.target.files[0]; e.target.value=""; if(!f) return;
  try{const img=await new Promise((res,rej)=>{const r=new FileReader(); r.onload=()=>{const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=r.result}; r.onerror=rej; r.readAsDataURL(f)});
    const c=document.createElement("canvas"); c.width=800; c.height=1000; const x=c.getContext("2d"); const k=Math.max(800/img.width,1000/img.height); x.drawImage(img,(800-img.width*k)/2,(1000-img.height*k)/2,img.width*k,img.height*k);
    S.bgSrc=c; S.bgBlur="0"; applyBgBlur(); [...$("bgChips").children].forEach(b=>b.setAttribute("aria-pressed","false")); toast("배경 이미지를 넣었어요")}catch(err){toast("이미지를 읽지 못했어요")}});
function applyBgBlur(){if(!S.bgSrc) return; const src=S.bgSrc, W=src.width, H=src.height, rad={"0":0,"1":9,"2":24}[S.bgBlur]||0; let out=src;
  if(rad){out=document.createElement("canvas"); out.width=W; out.height=H; const x=out.getContext("2d");
    x.drawImage(src,0,0);
    if("filter" in CanvasRenderingContext2D.prototype){
      // blur a copy with a margin of the picture's own colours around it, then cut the middle out: blurring the picture
      // alone mixes in the empty space outside, so the edges stayed sharp (the preview's border)
      const P=rad*3, big=document.createElement("canvas"); big.width=W+2*P; big.height=H+2*P; const b=big.getContext("2d");
      b.drawImage(src,0,0,big.width,big.height); b.drawImage(src,P,P);
      for(const [sx,sy,sw,sh,dx,dy,dw,dh] of [[0,0,W,1,P,0,W,P],[0,H-1,W,1,P,H+P,W,P],[0,0,1,H,0,P,P,H],[W-1,0,1,H,W+P,P,P,H]]) b.drawImage(src,sx,sy,sw,sh,dx,dy,dw,dh);   // stretch the edge rows outwards
      const bl=document.createElement("canvas"); bl.width=big.width; bl.height=big.height; const bx=bl.getContext("2d"); bx.filter=`blur(${rad}px)`; bx.drawImage(big,0,0);
      x.drawImage(bl,P,P,W,H,0,0,W,H)}
    else{ // no canvas filter (older Safari): shrink step by step, then grow step by step - smooth, not blocky
      let cur=src, w=W, h=H; const steps=[]; const goal=rad>12?1/24:1/9;
      while(w>W*goal*1.5){w=Math.max(2,Math.round(w/2)); h=Math.max(2,Math.round(h/2)); const c=document.createElement("canvas"); c.width=w; c.height=h; const cx=c.getContext("2d"); cx.imageSmoothingQuality="high"; cx.drawImage(cur,0,0,w,h); cur=c; steps.push([w,h])}
      for(let k=steps.length-2;k>=0;k--){const [w2,h2]=steps[k], c=document.createElement("canvas"); c.width=w2; c.height=h2; const cx=c.getContext("2d"); cx.imageSmoothingQuality="high"; cx.drawImage(cur,0,0,w2,h2); cur=c}
      x.imageSmoothingQuality="high"; x.drawImage(cur,0,0,W,H)}}
  S.bgImg=texOf(out); setBg(); chipGroup("bgBlurChips","bgBlur",{"0":"안 흐리게","1":"살짝","2":"많이"},()=>applyBgBlur())}
$("bgPick").addEventListener("click",()=>$("bgFile").click());
let standJob=0; $("standSize").addEventListener("input",e=>{S.standSize=(+e.target.value)/100; if(!standJob) standJob=requestAnimationFrame(()=>{standJob=0; rebuild()})});
function writeHash(){try{const o={bs:S.base,bc:S.baseColor,s:S.shape,m:S.mat,c:S.color,p:S.charPos,d:S.deco,dm:S.decoMat,dc:S.decoColor,g:S.glitter,w:S.sw,r:S.rgb,rc:S.rgbColor,b:S.bg,n:S.name,gc:S.glitColor,gl:S.glow?1:0,ss:Math.round(S.standSize*100),co:S.capOp,bo:S.baseOp,wc:S.swColor,fe:[S.ears,S.eyes,S.shine,S.nose,S.mouth,S.extra.join("."),S.eyeColor,S.odd?S.eyeColor2||"0":"",Math.round(S.earGap*100),Math.round(S.earBack*10),Math.round(S.earSize*100),Math.round(S.earRot),S.earInner?1:0]}; history.replaceState(null,"","#k="+encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(o))))))}catch(e){}}
function readHash(){try{const m=((window.KEYCAP_FILE&&window.KEYCAP_FILE.hash)||location.hash).match(/#k=(.+)/); if(!m) return; const o=JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
  const opt=(set,v,d)=>Object.prototype.hasOwnProperty.call(set,v)?v:d, col=(v,d)=>/^#[0-9A-Fa-f]{6}$/.test(v||"")?v.toUpperCase():d;
  Object.assign(S,{base:opt(OPT.base,o.bs,S.base),baseColor:col(o.bc,S.baseColor),shape:opt(PROFILES,o.s,S.shape),mat:opt(OPT.mat,o.m,S.mat),color:col(o.c,S.color),
    charPos:opt(OPT.charPos,o.p,S.charPos),deco:opt(OPT.deco,o.d,S.deco),decoMat:opt(OPT.decoMat,o.dm,S.decoMat),decoColor:col(o.dc,S.decoColor),glitter:opt(OPT.glitter,o.g,S.glitter),
    sw:opt(OPT.sw,o.w,S.sw),rgb:opt(OPT.rgb,o.r,S.rgb),rgbColor:col(o.rc,S.rgbColor),bg:opt(OPT.bg,o.b,S.bg),name:typeof o.n==="string"?o.n.slice(0,6):"",glitColor:/^#[0-9A-Fa-f]{6}$/.test(o.gc||"")?o.gc.toUpperCase():"",glow:o.gl===1,standSize:(o.ss>=70&&o.ss<=170)?o.ss/100:1,capOp:(o.co>=10&&o.co<=100)?o.co:null,baseOp:(o.bo>=10&&o.bo<=100)?o.bo:null,swColor:/^#[0-9A-Fa-f]{6}$/.test(o.wc||"")?o.wc.toUpperCase():""});
  if(o.s==="catface"||o.s==="bunnyface"){S.shape="soft"; S.ears=o.s==="catface"?"cat":"bunny"}   // old links: the face shapes became 말랑 + ear presets
  const fe=Array.isArray(o.fe)?o.fe:[];
  if(fe.length){FACE_KEYS.forEach((k,i)=>{S[k]=opt(OPT[k],fe[i],S[k])}); S.extra=String(fe[5]||"").split(".").filter(k=>OPT.extra[k]); S.eyeColor=col(fe[6],""); S.odd=!!fe[7]; S.eyeColor2=fe[7]==="0"?"":col(fe[7],"#3E6FD8");
    const num=(v,lo,hi,d)=>(typeof v==="number"&&v>=lo&&v<=hi)?v:d; S.earGap=num(fe[8],60,150,100)/100; S.earBack=num(fe[9],-40,40,0)/10; S.earSize=num(fe[10],70,140,100)/100; S.earRot=num(fe[11],-45,45,0); S.earInner=fe[12]!==0}
  $("name").value=S.name}catch(e){}}
$("share").addEventListener("click",async()=>{writeHash(); try{await navigator.clipboard.writeText(location.href); toast("조합 링크를 복사했어요 (캐릭터 그림은 친구가 직접 넣어요)")}catch(e){toast("주소창의 링크를 복사해서 보내 주세요")}});
function resetRun(){rebuild()}
