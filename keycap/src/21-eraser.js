/* ---------- background eraser ---------- */
const ED={it:null, mode:"erase", hist:[], tol:42, work:null, edge:1};
const edCv=$("edCv"), edX=edCv.getContext("2d");
function openEditor(it,isNew){
  ED.it=it; ED.work=new Uint8Array(it.mask); ED.hist=[]; ED.edge=it.edge==null?1:it.edge; $("edEdge").value=ED.edge; setMode("erase");
  edCv.width=it.w; edCv.height=it.h; edDraw();
  $("edHint").textContent=isNew?"배경을 톡 누르면 지워져요. 먼저 '테두리 자동 지우기'를 눌러 보세요.":"지우고 싶은 배경을 톡 누르세요. 너무 지워졌으면 '되살리기'로 눌러 주세요.";
  $("editor").hidden=false; $("edDone").focus();
}
function closeEditor(apply){
  if(apply){ED.it.mask=ED.work; ED.it.edge=ED.edge; finalizeItem(ED.it); renderSlots(); resetRun()}
  $("editor").hidden=true; ED.it=null; setTimeout(nextInQueue,50);
}
function edDraw(){
  const it=ED.it, im=edX.createImageData(it.w,it.h);
  im.data.set(cleanRGBA(it,ED.work,ED.edge)); edX.putImageData(im,0,0);
}
function pushHist(){ED.hist.push(new Uint8Array(ED.work)); if(ED.hist.length>20) ED.hist.shift()}
function flood(px,py,erase){
  const it=ED.it, w=it.w, h=it.h, o=it.orig, m=ED.work, tol=ED.tol;
  const si=py*w+px; if(erase&&m[si]===0) return false; if(!erase&&m[si]===255) return false;
  const sr=o[si*4], sg=o[si*4+1], sb=o[si*4+2];
  const T2=tol*tol, F=tol*1.6, F2=F*F;
  const vis=new Uint8Array(w*h), st=new Int32Array(w*h); let sp=0; st[sp++]=si; vis[si]=1;
  while(sp){
    const i=st[--sp]; const dr=o[i*4]-sr, dg=o[i*4+1]-sg, db=o[i*4+2]-sb, d2=dr*dr+dg*dg+db*db;
    let expand=false;
    if(erase){ if(m[i]===0) expand=true; else if(d2<=T2){m[i]=0; expand=true; it.bgHas[i]=1; it.bg[i*3]=sr; it.bg[i*3+1]=sg; it.bg[i*3+2]=sb} else if(d2<=F2){const a=255*(Math.sqrt(d2)-tol)/(F-tol); if(a<m[i]) m[i]=a; it.bgHas[i]=1; it.bg[i*3]=sr; it.bg[i*3+1]=sg; it.bg[i*3+2]=sb} }
    else{ if(d2<=T2&&m[i]<255){m[i]=255; expand=true} }
    if(!expand) continue;
    const x=i%w, y=(i-x)/w;
    if(x>0&&!vis[i-1]){vis[i-1]=1; st[sp++]=i-1} if(x<w-1&&!vis[i+1]){vis[i+1]=1; st[sp++]=i+1}
    if(y>0&&!vis[i-w]){vis[i-w]=1; st[sp++]=i-w} if(y<h-1&&!vis[i+w]){vis[i+w]=1; st[sp++]=i+w}
  }
  return true;
}
function setMode(m){ED.mode=m; $("mErase").setAttribute("aria-pressed",String(m==="erase")); $("mRestore").setAttribute("aria-pressed",String(m==="restore"))}
$("mErase").addEventListener("click",()=>setMode("erase"));
$("mRestore").addEventListener("click",()=>setMode("restore"));
$("edTol").addEventListener("input",e=>{ED.tol=+e.target.value});
$("edEdge").addEventListener("input",e=>{ED.edge=+e.target.value; if(ED.it) edDraw()});
$("edDark").addEventListener("click",e=>{const on=document.querySelector(".edstage").classList.toggle("dark"); e.currentTarget.setAttribute("aria-pressed",String(on))});
edCv.addEventListener("pointerdown",e=>{
  if(!ED.it) return; const r=edCv.getBoundingClientRect(); const px=Math.floor((e.clientX-r.left)/r.width*ED.it.w), py=Math.floor((e.clientY-r.top)/r.height*ED.it.h);
  if(px<0||py<0||px>=ED.it.w||py>=ED.it.h) return;
  pushHist(); if(!flood(px,py,ED.mode==="erase")) ED.hist.pop(); edDraw();
});
$("edAuto").addEventListener("click",()=>{
  const it=ED.it, w=it.w, h=it.h, o=it.orig; pushHist();
  const pts=[]; for(let x=0;x<w;x+=10){pts.push([x,0],[x,h-1])} for(let y=0;y<h;y+=10){pts.push([0,y],[w-1,y])} pts.push([w-1,h-1]);
  const cs=[[0,0],[w-1,0],[0,h-1],[w-1,h-1]].map(([x,y])=>{const i=(y*w+x)*4; return [o[i],o[i+1],o[i+2]]});
  let n=0; for(const [x,y] of pts){const i=(y*w+x)*4; const near=cs.some(cc=>{const a=o[i]-cc[0],b=o[i+1]-cc[1],d=o[i+2]-cc[2]; return a*a+b*b+d*d<=ED.tol*ED.tol*1.5}); if(near&&ED.work[y*w+x]>0){if(flood(x,y,true)) n++}}
  if(!n){ED.hist.pop(); toast("테두리에서 지울 배경을 못 찾았어요. 배경을 직접 눌러 주세요.")}
  edDraw();
});
$("edUndo").addEventListener("click",()=>{if(ED.hist.length){ED.work=ED.hist.pop(); edDraw()}});
$("edReset").addEventListener("click",()=>{pushHist(); ED.work=new Uint8Array(ED.it.w*ED.it.h); for(let i=0;i<ED.work.length;i++) ED.work[i]=ED.it.orig[i*4+3]; edDraw()});
$("edSkip").addEventListener("click",()=>{ED.work=new Uint8Array(ED.it.w*ED.it.h).fill(255); closeEditor(true)});
$("edDone").addEventListener("click",()=>closeEditor(true));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("editor").hidden) closeEditor(true)});

