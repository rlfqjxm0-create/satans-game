/* ---------- slots & files ---------- */
function renderSlots(){
  const el=$("slots"); el.innerHTML="";
  S.items.forEach((it,i)=>{const d=document.createElement("div"); d.className="slot";
    const p=document.createElement("button"); p.type="button"; p.className="pick"; p.setAttribute("aria-label",`그림 ${i+1} 배경 고치기`); const im=document.createElement("img"); im.src=it.thumb; im.alt=""; p.appendChild(im); p.addEventListener("click",()=>openEditor(it,false)); d.appendChild(p);
    const tg=document.createElement("span"); tg.className="edit"; tg.textContent="고치기"; d.appendChild(tg);
    const x=document.createElement("button"); x.type="button"; x.className="x"; x.textContent="×"; x.setAttribute("aria-label",`그림 ${i+1} 빼기`); x.addEventListener("click",()=>{S.items.splice(i,1); renderSlots(); resetRun()}); d.appendChild(x); el.appendChild(d)});
  if(S.items.length<1){const a=document.createElement("button"); a.type="button"; a.className="add"; a.innerHTML='<span class="plus">+</span>그림 고르기'; a.addEventListener("click",()=>$("file").click()); el.appendChild(a)}
}
function readURL(f){return new Promise((res,rej)=>{const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f)})}
function loadImg(src){return new Promise((res,rej)=>{const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src})}
async function processFile(f){
  const img=await loadImg(await readURL(f));
  const sc=Math.min(1,800/Math.max(img.naturalWidth,img.naturalHeight));
  const w=Math.max(1,Math.round(img.naturalWidth*sc)), h=Math.max(1,Math.round(img.naturalHeight*sc));
  const c=document.createElement("canvas"); c.width=w; c.height=h; const x=c.getContext("2d"); x.drawImage(img,0,0,w,h);
  const id=x.getImageData(0,0,w,h), d=id.data; let tr=0,tot=0; for(let i=3;i<d.length;i+=16){tot++; if(d[i]<200) tr++}
  const mask=new Uint8Array(w*h); for(let i=0;i<w*h;i++) mask[i]=d[i*4+3];
  const it={orig:d, w, h, mask, v:{}, bg:new Uint8Array(w*h*3), bgHas:new Uint8Array(w*h), edge:1};
  finalizeItem(it);
  return {it, hasAlpha:tr/tot>0.02};
}
/* turns the user's erase mask into a clean cutout: drops stray specks, trims the halo left
   by the old background, softens the edge inward only, and un-mixes background colour from edge pixels */
function cleanRGBA(it,work,edge){
  const w=it.w,h=it.h,n=w*h,o=it.orig,out=new Uint8ClampedArray(n*4),a=new Uint8Array(n);
  let edited=false; for(let i=0;i<n;i++){a[i]=Math.min(o[i*4+3],work[i]); if(work[i]<255) edited=true}
  if(edited){
    const lab=new Int32Array(n).fill(-1), st=new Int32Array(n), sizes=[];
    for(let i=0;i<n;i++){ if(a[i]<128||lab[i]>=0) continue; const id=sizes.length; let sp=0,cnt=0; st[sp++]=i; lab[i]=id;
      while(sp){const p=st[--sp]; cnt++; const x=p%w;
        if(x>0&&lab[p-1]<0&&a[p-1]>=128){lab[p-1]=id; st[sp++]=p-1}
        if(x<w-1&&lab[p+1]<0&&a[p+1]>=128){lab[p+1]=id; st[sp++]=p+1}
        if(p>=w&&lab[p-w]<0&&a[p-w]>=128){lab[p-w]=id; st[sp++]=p-w}
        if(p+w<n&&lab[p+w]<0&&a[p+w]>=128){lab[p+w]=id; st[sp++]=p+w}}
      sizes.push(cnt)}
    let L=0; for(const s of sizes) if(s>L) L=s;
    const keep=Math.max(30,L*0.012);
    for(let i=0;i<n;i++){ if(lab[i]>=0){ if(sizes[lab[i]]<keep) a[i]=0 } else if(a[i]<128){ // faint pixels only survive next to a kept shape
      const x=i%w; let near=false; if(x>0&&lab[i-1]>=0&&sizes[lab[i-1]]>=keep) near=true; else if(x<w-1&&lab[i+1]>=0&&sizes[lab[i+1]]>=keep) near=true; else if(i>=w&&lab[i-w]>=0&&sizes[lab[i-w]]>=keep) near=true; else if(i+w<n&&lab[i+w]>=0&&sizes[lab[i+w]]>=keep) near=true; if(!near) a[i]=0 } }
    for(let k=0;k<edge;k++){const b=a.slice(); for(let i=0;i<n;i++){ if(!b[i]) continue; const x=i%w; let m=b[i]; if(x>0&&b[i-1]<m)m=b[i-1]; if(x<w-1&&b[i+1]<m)m=b[i+1]; if(i>=w&&b[i-w]<m)m=b[i-w]; if(i+w<n&&b[i+w]<m)m=b[i+w]; a[i]=m}}
    {const b=a.slice(); for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x, v=b[i]; if(!v) continue; let s=0,mn=v; for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const q=b[i+dy*w+dx]; s+=q; if(q<mn) mn=q} if(mn<v) a[i]=Math.min(v,Math.round(s/9))}}
  }
  for(let i=0;i<n;i++){
    let r=o[i*4],g=o[i*4+1],bb=o[i*4+2]; const al=a[i];
    if(edited&&al>0&&al<250){
      const x=i%w; let cr=0,cg=0,cb=0,cn=0;
      for(let dy=-2;dy<=2;dy++){const yy=((i-x)/w)+dy; if(yy<0||yy>=h) continue; for(let dx=-2;dx<=2;dx++){const xx=x+dx; if(xx<0||xx>=w) continue; const q=yy*w+xx; if(it.bgHas[q]){cr+=it.bg[q*3]; cg+=it.bg[q*3+1]; cb+=it.bg[q*3+2]; cn++}}}
      if(cn){const f=Math.max(al/255,0.35); cr/=cn; cg/=cn; cb/=cn; r=(r-(1-f)*cr)/f; g=(g-(1-f)*cg)/f; bb=(bb-(1-f)*cb)/f}
    }
    out[i*4]=r; out[i*4+1]=g; out[i*4+2]=bb; out[i*4+3]=al;
  }
  return out;
}
function finalizeItem(it){
  const c=document.createElement("canvas"); c.width=it.w; c.height=it.h; const x=c.getContext("2d"); const im=x.createImageData(it.w,it.h), d=im.data;
  d.set(cleanRGBA(it,it.mask,it.edge==null?1:it.edge)); let cut=false;
  x.putImageData(im,0,0);
  let transparentShare=0; for(let i=0;i<it.w*it.h;i+=4){if(d[i*4+3]<200) transparentShare++} cut=transparentShare/(it.w*it.h/4)>0.02;
  it.cutout=cut; it.canvas=cut?trimCanvas(c):c; it.v={}; it.hair=null;
  const t=document.createElement("canvas"), ts=Math.min(1,150/Math.max(it.canvas.width,it.canvas.height)); t.width=Math.max(1,Math.round(it.canvas.width*ts)); t.height=Math.max(1,Math.round(it.canvas.height*ts)); t.getContext("2d").drawImage(it.canvas,0,0,t.width,t.height);
  it.thumb=t.toDataURL("image/png");
}
const queue=[];
$("file").addEventListener("change",async e=>{
  const files=[...e.target.files]; e.target.value=""; const room=1-S.items.length;
  if(files.length>room) toast("캐릭터는 1명만 들어가요. 넣은 그림을 빼고 다시 골라 주세요.");
  let fail=0;
  for(const f of files.slice(0,room)){try{const {it,hasAlpha}=await processFile(f); S.items.push(it); if(!hasAlpha) queue.push(it)}catch(err){fail++}}
  if(fail) toast("읽지 못한 그림이 있어요. PNG나 JPG로 넣어 주세요.");
  renderSlots(); resetRun(); nextInQueue();
});
function nextInQueue(){if($("editor").hidden&&queue.length) openEditor(queue.shift(),true)}
renderSlots();
