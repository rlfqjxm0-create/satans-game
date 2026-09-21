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
function restoreSize(){renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); resize()}
function cardOverlay(x,W,H){ // name tag + little title, like a product card
  x.save(); const s=W/1080;
  x.font=`${46*s}px Jua, sans-serif`; x.textAlign="left"; x.fillStyle=S.bg==="night"?"#FFE38A":"#4A3A5A"; x.fillText(S.name?`${S.name}의 키캡`:"나의 아티산 키캡",60*s,110*s);
  x.font=`${24*s}px "Noto Sans KR", sans-serif`; x.fillStyle=S.bg==="night"?"rgba(255,255,255,.7)":"rgba(74,58,90,.65)";
  x.fillText(`${OPT.shape[S.shape]} · ${OPT.mat[S.mat]} · ${OPT.deco[S.deco]} · ${OPT.sw[S.sw].split(" · ")[0]}`,60*s,156*s);
  x.textAlign="right"; x.fillText("사탄의 키캡",W-60*s,H-60*s);
  x.restore();
}
$("savePng").addEventListener("click",async()=>{
  busy(true); try{
    try{await document.fonts.load('46px Jua')}catch(e){}
    PAUSE=true; const c=snap(1080,1350); restoreSize(); PAUSE=false;
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
$("makeVid").addEventListener("click",async()=>{
  const mime=pickMime(), probe=document.createElement("canvas");
  if(!mime||!probe.captureStream){toast("이 브라우저는 영상 만들기를 지원하지 않아요. 이미지로 저장해 주세요."); return}
  busy(true); $("out").style.display="none";
  const W=720, H=900, DUR=8, presses=[1.0,3.4,5.8], keep=rotY; let dest=null, a=null, c=null;
  try{
    try{await document.fonts.load('46px Jua')}catch(e){}
    a=ac(); if(a&&a.state!=="running") try{await a.resume()}catch(e){}
    const p=loadPack(S.sw); if(p) await p;                          // the recorded clicks have to be ready first
    c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d");
    c.style.cssText="position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none"; document.body.appendChild(c);
    x.fillStyle="#000"; x.fillRect(0,0,W,H);
    const stream=c.captureStream(30);
    if(a&&S.sound&&a.createMediaStreamDestination){dest=a.createMediaStreamDestination(); outNode(a).connect(dest); dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t))}
    const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8e6}), chunks=[];
    rec.ondataavailable=e=>{if(e.data&&e.data.size) chunks.push(e.data)}; const stopped=new Promise(r=>rec.onstop=r);
    PAUSE=true; renderer.setPixelRatio(1); renderer.setSize(W,H,false); camera.aspect=W/H; camera.updateProjectionMatrix();
    rec.start(250); const t0=performance.now(); let next=0;
    await new Promise(res=>{const loop=()=>{const t=(performance.now()-t0)/1000;
      if(next<presses.length&&t>=presses[next]){next++; pressKey()}
      rotY=keep+Math.min(t,DUR)/DUR*Math.PI*2; poseAt(T); renderer.render(scene,camera);
      x.drawImage(renderer.domElement,0,0,W,H); cardOverlay(x,W,H);
      prog(Math.min(1,t/DUR),`영상 녹화 중… ${Math.min(100,Math.round(100*t/DUR))}%`);
      if(t<DUR+0.25) requestAnimationFrame(loop); else res()}; requestAnimationFrame(loop)});
    rec.stop(); await stopped;
    outExt=mime.includes("mp4")?"mp4":"webm"; outBlob=new Blob(chunks,{type:mime.split(";")[0]});
    showOut("video",URL.createObjectURL(outBlob));
    prog(1,`영상 완성 · ${W}×${H} · ${DUR}초 · ${(outBlob.size/1048576).toFixed(1)}MB`); setTimeout(()=>{$("progress").style.display="none"},500);
  }catch(err){console.error(err); $("status").textContent="영상을 만들지 못했어요. 이미지로 저장해 주세요."; $("progress").style.display="none"}
  finally{if(dest) try{outNode(a).disconnect(dest)}catch(e){} if(c) c.remove(); rotY=keep; PAUSE=false; restoreSize(); busy(false)}
});
$("saveOut").addEventListener("click",()=>{if(outBlob) saveFile("satan-keycap."+outExt,outBlob)});
window.__k={S,rebuild,renderer,scene,setBg,pressKey,shot:(ry)=>{PAUSE=true; if(ry!=null) rotY=ry; poseAt(T); renderer.render(scene,camera); return cv.toDataURL("image/png")}};

/* back to the game list: only inside the "사탄의 장난감" site, not inside the Claude viewer (same rule as laundry) */
(function(){try{const host=location.hostname||""; const inClaude=/claude\.ai$|claudeusercontent|anthropic/.test(host)||window.top!==window; if(!inClaude) document.getElementById("backLink").hidden=false}catch(e){}})();
