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
function busy(b){["savePng","makeGif"].forEach(id=>$(id).disabled=b)}
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
    $("outImg").src=await readURL(b); $("out").style.display="block"; saveFile("satan-keycap.png",b);
  }finally{busy(false)}
});
$("makeGif").addEventListener("click",async()=>{
  busy(true); $("out").style.display="none";
  try{
    try{await document.fonts.load('46px Jua')}catch(e){}
    const {GIFEncoder,quantize,applyPalette}=window.gifenc;
    const W=480,H=600,N=48, keep=rotY; PAUSE=true;
    const frames=[];
    for(let f=0;f<N;f++){rotY=keep+f/N*Math.PI*2; press=(f===N/2)?0.9:(f===N/2+1?0.4:0); poseAt(T+f*0.08); const c=snap(W,H); cardOverlay(c.getContext("2d"),W,H); frames.push(c.getContext("2d").getImageData(0,0,W,H).data); if(f%4===0){prog(0.02+0.45*f/N,"360도 촬영 중…"); await tick()}}
    rotY=keep; press=0; restoreSize(); PAUSE=false;
    const mkSample=()=>{const sm=new Uint8ClampedArray(frames[0].length*4); [0,12,24,36].forEach((k,i)=>sm.set(frames[k],i*frames[0].length)); return sm};
    // encode in a worker so the page keeps moving; frames are handed over, not copied
    let bytes=null, sent=false; const job=gifWorker(done=>prog(0.5+0.48*done/N,"움짤 만드는 중…"));
    if(job){try{await job.start(mkSample(),W,H,60); sent=true; for(let f=0;f<N;f++) job.frame(frames[f]); bytes=await job.finish()}
      catch(e){console.error("gif worker",e); if(sent) throw e}   // frames already handed over: report it rather than retry
      finally{job.close()}}
    if(!bytes){   // no worker (or it failed before any frame was sent): encode here, as before
    const sample=mkSample();
    const pal=quantize(sample,255,{format:"rgb565"}), TI=pal.length, palette=pal.concat([[0,0,0]]); const gif=GIFEncoder(); let prev=null;
    for(let f=0;f<N;f++){const idx=applyPalette(frames[f],pal,"rgb565"); let out=idx; if(prev){out=new Uint8Array(idx.length); for(let i=0;i<idx.length;i++) out[i]=idx[i]===prev[i]?TI:idx[i]}
      gif.writeFrame(out,W,H,f===0?{palette,delay:60,dispose:1}:{delay:60,transparent:true,transparentIndex:TI,dispose:1}); prev=idx; if(f%4===0){prog(0.5+0.48*f/N,"움짤 만드는 중…"); await tick()}}
    gif.finish(); bytes=gif.bytes()}
    outBlob=new Blob([bytes],{type:"image/gif"}); outExt="gif";
    $("outImg").src=await readURL(outBlob); $("out").style.display="block"; prog(1,`움짤 완성 · ${(outBlob.size/1048576).toFixed(1)}MB`); setTimeout(()=>{$("progress").style.display="none"},500);
  }catch(err){console.error(err); $("status").textContent="움짤을 만들지 못했어요."; PAUSE=false; restoreSize()}
  finally{busy(false)}
});
$("saveOut").addEventListener("click",()=>{if(outBlob) saveFile("satan-keycap."+outExt,outBlob)});
window.__k={S,rebuild,renderer,scene,setBg,pressKey,shot:(ry)=>{PAUSE=true; if(ry!=null) rotY=ry; poseAt(T); renderer.render(scene,camera); return cv.toDataURL("image/png")}};

/* back to the game list: only inside the "사탄의 장난감" site, not inside the Claude viewer (same rule as laundry) */
(function(){try{const host=location.hostname||""; const inClaude=/claude\.ai$|claudeusercontent|anthropic/.test(host)||window.top!==window; if(!inClaude) document.getElementById("backLink").hidden=false}catch(e){}})();
