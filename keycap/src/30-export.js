/* ---------- export ---------- */
let downloads=null, outBlob=null, outExt="png";
(async()=>{try{if(window.claude&&typeof window.claude.use==="function") downloads=await window.claude.use("downloads")}catch(e){downloads=null}})();
async function saveFile(name,blob){
  if(!downloads){try{const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); toast("저장했어요. 안 되면 길게 눌러 저장해 주세요.")}catch(e){toast("길게 눌러 저장해 주세요.")} return}
  try{await downloads.save({filename:name,data:blob}); toast("저장했어요")}
  catch(e){const c=e&&e.code; if(c==="declined") toast("저장을 취소했어요"); else if(c==="rate_limited") toast("잠시 후 다시 눌러 주세요"); else {toast("여기서는 바로 저장이 안 돼요. 길게 눌러 저장해 주세요."); downloads=null}}
}
function readURL(f){return new Promise((res,rej)=>{const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f)})}
const tick=()=>new Promise(r=>setTimeout(r,0));
function prog(p,m){$("progress").style.display="block"; $("progress").firstElementChild.style.width=(p*100).toFixed(1)+"%"; if(m!=null) $("status").textContent=m}
function busy(b){["savePng","makeVid"].forEach(id=>$(id).disabled=b)}
function snap(W,H){ // render one frame at a given size and hand back a 2D canvas copy
  renderer.setPixelRatio(1); renderer.setSize(W,H,false); camera.aspect=W/H; camera.updateProjectionMatrix(); renderer.render(scene,camera);
  const c=document.createElement("canvas"); c.width=W; c.height=H; c.getContext("2d").drawImage(renderer.domElement,0,0,W,H); return c;
}
function restoreSize(){renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); resize(); camApply()}
/* a little die-cut sticker, like the ones on handmade goods for sale: white border, soft shadow, the site cat */
function watermark(x,W,H){
  const s=W/1080, bw=318*s, bh=92*s, cx=W-60*s-bw/2, cy=H-64*s-bh/2, r=bh/2, col=S.color;
  const fill=mixHex(col,"#FFFFFF",0.55), ink=mixHex(col,"#2A2230",0.78), edge=mixHex(col,"#FFFFFF",0.2);
  x.save(); x.translate(cx,cy); x.rotate(-0.07);
  const pill=(w,h,rr)=>{x.beginPath(); x.moveTo(-w/2+rr,-h/2); x.arcTo(w/2,-h/2,w/2,h/2,rr); x.arcTo(w/2,h/2,-w/2,h/2,rr); x.arcTo(-w/2,h/2,-w/2,-h/2,rr); x.arcTo(-w/2,-h/2,w/2,-h/2,rr); x.closePath()};
  x.shadowColor="rgba(60,30,70,.28)"; x.shadowBlur=14*s; x.shadowOffsetY=5*s;
  pill(bw+18*s,bh+18*s,r+9*s); x.fillStyle="#FFFFFF"; x.fill();      // the white die-cut border
  x.shadowColor="transparent";
  pill(bw,bh,r); x.fillStyle=fill; x.fill(); x.lineWidth=2.5*s; x.setLineDash([7*s,6*s]); x.strokeStyle=edge; pill(bw-12*s,bh-12*s,r-6*s); x.stroke(); x.setLineDash([]);
  x.save(); x.translate(-bw/2+20*s,-30*s); x.scale(60*s/64,60*s/64); drawSatanCat(x); x.restore();
  x.font=`${38*s}px Jua, sans-serif`; x.textAlign="left"; x.textBaseline="middle"; x.fillStyle=ink; x.fillText("사탄의 키캡",-bw/2+90*s,2*s);
  x.fillStyle="#FFD66B"; for(const [px,py,k] of [[bw/2-4*s,-bh/2+4*s,1],[bw/2+10*s,-bh/2+26*s,0.6]]){x.beginPath(); for(let i=0;i<8;i++){const a=i*Math.PI/4, rr=(i%2?5:13)*s*k; x.lineTo(px+Math.cos(a)*rr,py+Math.sin(a)*rr)} x.closePath(); x.fill()}
  x.restore();
}
function cardOverlay(x,W,H){ // the title and a little list, as a label sticker at the top left (+ the corner sticker)
  const s=W/1080, col=S.color, title=S.name?`${S.name}의 키캡`:"나의 아티산 키캡";
  const sub=`${OPT.shape[S.shape]} · ${OPT.mat[S.mat]} · ${OPT.deco[S.deco]} · ${OPT.sw[S.sw].split(" · ")[0]}`;
  x.save(); x.font=`${46*s}px Jua, sans-serif`; const tw=x.measureText(title).width; x.font=`${23*s}px "Noto Sans KR", sans-serif`; const sw=x.measureText(sub).width;
  const bw=Math.max(tw,sw)+64*s, bh=112*s, r=26*s, fill=mixHex(col,"#FFFFFF",0.72), ink=mixHex(col,"#2A2230",0.8), soft=mixHex(col,"#2A2230",0.55), edge=mixHex(col,"#FFFFFF",0.3);
  x.translate(56*s+bw/2,58*s+bh/2); x.rotate(-0.035);
  const box=(w,h,rr)=>{x.beginPath(); x.moveTo(-w/2+rr,-h/2); x.arcTo(w/2,-h/2,w/2,h/2,rr); x.arcTo(w/2,h/2,-w/2,h/2,rr); x.arcTo(-w/2,h/2,-w/2,-h/2,rr); x.arcTo(-w/2,-h/2,w/2,-h/2,rr); x.closePath()};
  x.shadowColor="rgba(60,30,70,.26)"; x.shadowBlur=14*s; x.shadowOffsetY=5*s;
  box(bw+18*s,bh+18*s,r+9*s); x.fillStyle="#FFFFFF"; x.fill(); x.shadowColor="transparent";   // white die-cut border
  box(bw,bh,r); x.fillStyle=fill; x.fill();
  x.setLineDash([7*s,6*s]); x.lineWidth=2.5*s; x.strokeStyle=edge; box(bw-12*s,bh-12*s,r-6*s); x.stroke(); x.setLineDash([]);
  x.textAlign="left"; x.textBaseline="alphabetic";
  x.font=`${46*s}px Jua, sans-serif`; x.fillStyle=ink; x.fillText(title,-bw/2+32*s,-bh/2+56*s);
  x.font=`${23*s}px "Noto Sans KR", sans-serif`; x.fillStyle=soft; x.fillText(sub,-bw/2+32*s,-bh/2+92*s);
  // a heart doodle on the corner, like a sticker sheet
  x.fillStyle="#FF8FB0"; x.strokeStyle="#FFFFFF"; x.lineWidth=5*s; heart(x,bw/2-4*s,-bh/2+2*s,17*s); x.stroke(); x.fill();
  x.restore(); watermark(x,W,H);
}
$("savePng").addEventListener("click",async()=>{
  busy(true); try{
    try{await document.fonts.load('46px Jua')}catch(e){}
    PAUSE=true; camApply(); poseAt(T); const c=snap(1080,1350); restoreSize(); PAUSE=false;   // exactly the preview's view
    cardOverlay(c.getContext("2d"),1080,1350);
    const b=await new Promise(r=>c.toBlob(r,"image/png")); outBlob=b; outExt="png";
    showOut("img",await readURL(b)); saveFile("satan-keycap.png",b);
  }finally{busy(false)}
});
/* The keycap video: the same framing as the saved image card (camera, 4:5, title overlay), one slow full
   turn with three presses, and the switch sound recorded into it. It replaces the silent 360° GIF. */
function pickMime(){const list=["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=avc1","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"];
  for(const m of list){try{if(window.MediaRecorder&&MediaRecorder.isTypeSupported(m)) return m}catch(e){}} return null}
function showOut(kind,url){const img=$("outImg"), vid=$("outVid");
  img.style.display=kind==="img"?"block":"none"; vid.style.display=kind==="video"?"block":"none";
  if(kind==="img") img.src=url; else {vid.src=url; vid.play().catch(()=>{})}
  $("out").style.display="block"}
/* Smoothness: the frames are drawn straight on the WebGL canvas and recorded from it, with the title and
   sticker as a flat overlay drawn by the GPU in the same frame. Copying every frame into a 2D canvas made the
   page wait for the GPU each frame, and the video dropped to a few frames a second. Each frame is also asked
   for at a fixed time (frame i at i/30 s), and the turn/presses follow the frame number, not the clock. */
$("makeVid").addEventListener("click",async()=>{
  const mime=pickMime();
  if(!mime||!cv.captureStream){toast("이 브라우저는 영상 만들기를 지원하지 않아요. 이미지로 저장해 주세요."); return}
  busy(true); $("out").style.display="none";
  const W=600, H=750, FPS=30, DUR=8, N=FPS*DUR, presses=[1.0,3.4,5.8].map(t=>Math.round(t*FPS)), keep=rotY;
  let dest=null, a=null, hud=null, ac0=renderer.autoClear;
  try{
    try{await document.fonts.load('46px Jua')}catch(e){}
    a=ac(); if(a&&a.state!=="running") try{await a.resume()}catch(e){}
    const p=loadPack(S.sw); if(p) await p;                          // the recorded clicks have to be ready first
    // the overlay: drawn once into a texture, laid over every frame by an orthographic pass
    const oc=document.createElement("canvas"); oc.width=W; oc.height=H; cardOverlay(oc.getContext("2d"),W,H);
    const ot=new THREE.CanvasTexture(oc); ot.encoding=THREE.sRGBEncoding;
    hud={scene:new THREE.Scene(),cam:new THREE.OrthographicCamera(-W/2,W/2,H/2,-H/2,-1,1),tex:ot,
      mat:new THREE.MeshBasicMaterial({map:ot,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}),geo:new THREE.PlaneGeometry(W,H)};
    hud.scene.add(new THREE.Mesh(hud.geo,hud.mat));
    PAUSE=true; renderer.setPixelRatio(1); renderer.setSize(W,H,false); camera.aspect=W/H; camera.updateProjectionMatrix(); camApply();   // the preview's own camera and tilt
    const draw=i=>{rotY=keep+Math.min(i,N)/N*Math.PI*2; poseAt(T); renderer.autoClear=true; renderer.render(scene,camera); renderer.autoClear=false; renderer.render(hud.scene,hud.cam); renderer.autoClear=ac0};
    draw(0); await new Promise(r=>requestAnimationFrame(r));
    const stream=cv.captureStream(FPS), track=stream.getVideoTracks()[0];
    if(a&&S.sound&&a.createMediaStreamDestination){dest=a.createMediaStreamDestination(); outNode(a).connect(dest); dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t))}
    const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6e6}), chunks=[];
    rec.ondataavailable=e=>{if(e.data&&e.data.size) chunks.push(e.data)}; const stopped=new Promise(r=>rec.onstop=r);
    rec.start(250); const t0=performance.now(); let i=0;
    await new Promise(res=>{const loop=()=>{const due=(performance.now()-t0)/1000*FPS;
      if(due>=i){ // one new frame per 1/30 s; a late frame is still drawn (never skipped), so the turn stays even
        if(presses.includes(i)) pressKey();
        draw(i); i++;
        prog(Math.min(1,i/N),`영상 녹화 중… ${Math.min(100,Math.round(100*i/N))}%`)}
      if(i<=N+6) requestAnimationFrame(loop); else res()}; requestAnimationFrame(loop)});
    rec.stop(); await stopped;
    outExt=mime.includes("mp4")?"mp4":"webm"; outBlob=new Blob(chunks,{type:mime.split(";")[0]});
    showOut("video",URL.createObjectURL(outBlob));
    prog(1,`영상 완성 · ${W}×${H} · ${DUR}초 · ${(outBlob.size/1048576).toFixed(1)}MB`); setTimeout(()=>{$("progress").style.display="none"},500);
  }catch(err){console.error(err); $("status").textContent="영상을 만들지 못했어요. 이미지로 저장해 주세요."; $("progress").style.display="none"}
  finally{renderer.autoClear=ac0; if(hud){hud.tex.dispose(); hud.mat.dispose(); hud.geo.dispose()} if(dest) try{outNode(a).disconnect(dest)}catch(e){}
    rotY=keep; PAUSE=false; restoreSize(); busy(false)}
});
$("saveOut").addEventListener("click",()=>{if(outBlob) saveFile("satan-keycap."+outExt,outBlob)});
window.__k={S,rebuild,renderer,scene,setBg,pressKey,shot:(ry)=>{PAUSE=true; if(ry!=null) rotY=ry; poseAt(T); renderer.render(scene,camera); return cv.toDataURL("image/png")}};

/* back to the game list: only inside the "사탄의 장난감" site, not inside the Claude viewer (same rule as laundry) */
(function(){try{const host=location.hostname||""; const inClaude=/claude\.ai$|claudeusercontent|anthropic/.test(host)||window.top!==window; if(!inClaude) document.getElementById("backLink").hidden=false}catch(e){}})();
