/* ---------- characters ---------- */
function trimCanvas(c){
  const w=c.width,h=c.height,d=c.getContext("2d").getImageData(0,0,w,h).data; let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(d[(y*w+x)*4+3]>16){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
  if(x1<0) return c; const o=document.createElement("canvas"); o.width=x1-x0+1; o.height=y1-y0+1; o.getContext("2d").drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height); return o;
}
/* The site's black cat (the same shapes as the logo on the main page, in a 64-unit box):
   no outline, big round pupils, no nose. Used as the character when no picture has been added. */
function drawSatanCat(x){
  const B="#2A2C33";
  x.lineJoin="round"; x.lineWidth=2.4;
  for(const s of [1,-1]){x.save(); if(s<0){x.translate(64,0); x.scale(-1,1)}
    const ear=new Path2D("M11 31 L12.6 7.2 Q13.2 5.4 14.8 6.6 L30.5 19 Z"); x.fillStyle=B; x.strokeStyle=B; x.fill(ear); x.stroke(ear);
    x.fillStyle="#4B4F5A"; x.fill(new Path2D("M15.2 25 L15.9 12.8 L25.2 20.2 Z")); x.restore()}
  x.fillStyle=B; x.beginPath(); x.ellipse(32,37,23.5,19.5,0,0,Math.PI*2); x.fill();
  for(const cx of [22.5,41.5]){
    x.fillStyle="#FFD45C"; x.beginPath(); x.arc(cx,37,7,0,Math.PI*2); x.fill();
    x.fillStyle="#121317"; x.beginPath(); x.arc(cx+0.3,37.8,5.6,0,Math.PI*2); x.fill();
    x.fillStyle="#FFFFFF"; x.beginPath(); x.arc(cx-1.9,35.2,1.9,0,Math.PI*2); x.fill(); x.beginPath(); x.arc(cx+2.3,40.2,0.9,0,Math.PI*2); x.fill()}
  x.fillStyle="rgba(255,143,176,.5)"; for(const cx of [14.5,49.5]){x.beginPath(); x.ellipse(cx,45.5,3.2,1.9,0,0,Math.PI*2); x.fill()}
}
function makePlaceholder(){const c=document.createElement("canvas"); c.width=320; c.height=300; const x=c.getContext("2d"); x.scale(5,5); drawSatanCat(x); return trimCanvas(c)}
const PLACEHOLDER={canvas:makePlaceholder(), cutout:true, v:{}};
/* fusion: a vertical slice of every character stitched into one body */
const MERGE=new Map(); let UID=0;
function mergedItem(list){
  const key=list.map(it=>(it.uid||(it.uid=++UID))+":"+it.canvas.width+"x"+it.canvas.height).join("|");
  if(MERGE.has(key)) return MERGE.get(key);
  const H=520, n=list.length, srcs=list.map(it=>warpSource(it,it.canvas)), ws=srcs.map(s=>s.width*H/s.height);
  const W=Math.max(2,Math.round(ws.reduce((a,w)=>a+w/n,0)));
  const cv=document.createElement("canvas"); cv.width=W; cv.height=H; const x=cv.getContext("2d");
  let px=0; const seams=[];
  srcs.forEach((s,i)=>{const sw=s.width/n; x.drawImage(s,sw*i,0,sw,s.height,px,0,ws[i]/n,H); px+=ws[i]/n; if(i<n-1) seams.push(px)});
  x.globalCompositeOperation="source-atop"; x.lineJoin="round";
  for(const sx of seams){const path=()=>{x.beginPath(); for(let yy=0;yy<=H;yy+=14){x.lineTo(sx+((yy/14)%2?5:-5),yy)}};
    path(); x.lineWidth=9; x.strokeStyle="rgba(255,255,255,.95)"; x.stroke(); path(); x.lineWidth=2.6; x.setLineDash([7,6]); x.strokeStyle="#4E5F73"; x.stroke(); x.setLineDash([])}
  x.globalCompositeOperation="source-over";
  const it={canvas:trimCanvas(cv), cutout:true, v:{}}; MERGE.set(key,it); return it;
}
function items(){return S.items.length?S.items:[PLACEHOLDER]}

const RAINBOW=[[255,90,110],[255,170,60],[250,220,60],[90,210,120],[80,170,255],[170,110,255]];
function tintCanvas(src,tint,k){
  const c=document.createElement("canvas"); c.width=src.width; c.height=src.height; const x=c.getContext("2d"); x.drawImage(src,0,0);
  const im=x.getImageData(0,0,c.width,c.height), d=im.data;
  for(let i=0;i<d.length;i+=4){const l=(.3*d[i]+.59*d[i+1]+.11*d[i+2])/255; for(let ch=0;ch<3;ch++){const tg=Math.min(255,tint[ch]*(0.5+0.65*l)); d[i+ch]=lerp(d[i+ch],tg,k)}}
  x.putImageData(im,0,0); return c;
}
function variant(it,kind){
  if(it.v[kind]) return it.v[kind];
  let out;
  if(kind==="gray"){
    const src=it.canvas; out=document.createElement("canvas"); out.width=src.width; out.height=src.height; const x=out.getContext("2d"); x.drawImage(src,0,0);
    const im=x.getImageData(0,0,out.width,out.height), d=im.data; for(let i=0;i<d.length;i+=4){const l=.3*d[i]+.59*d[i+1]+.11*d[i+2]; const v=46+l*0.76; d[i]=v; d[i+1]=v; d[i+2]=v+5} x.putImageData(im,0,0);
  }else if(kind==="pink") out=tintCanvas(it.canvas,[255,110,165],0.55);
  else if(kind.startsWith("rb")) out=tintCanvas(it.canvas,RAINBOW[+kind.slice(2)],0.5);
  it.v[kind]=out; return out;
}
function hairColor(it){
  if(it.hair) return it.hair;
  const c=it.canvas, w=c.width, h=Math.max(1,Math.round(c.height*0.14)); const d=c.getContext("2d").getImageData(0,0,w,h).data;
  let r=0,g=0,b=0,n=0; for(let i=0;i<d.length;i+=16){if(d[i+3]>200){r+=d[i];g+=d[i+1];b+=d[i+2];n++}}
  it.hair=n?`rgb(${r/n|0},${g/n|0},${b/n|0})`:"#8A6E62"; return it.hair;
}
function drawRaw(c,it,img,x,y,w,h){
  if(it.cutout){c.drawImage(img,x,y,w,h); return}
  const b=Math.max(3,w*0.045), r=Math.min(14,w*0.09);
  rrect(c,x,y,w,h,r); c.fillStyle="#FFFFFF"; c.fill();
  c.save(); rrect(c,x+b,y+b,w-2*b,h-2*b,r*0.7); c.clip(); c.drawImage(img,x+b,y+b,w-2*b,h-2*b); c.restore();
  c.lineWidth=1.2; c.strokeStyle="rgba(120,110,140,.35)"; rrect(c,x,y,w,h,r); c.stroke();
}
const TMP=document.createElement("canvas"), TMPX=TMP.getContext("2d");
// o: {x,y,w,h,anchor:'bottom'|'top'|'center',rot,sx,sy,flip,alpha,img,fx}
/* mesh warp: draws src into dst through an N x N grid of affine-mapped triangles */
const CARDS=new WeakMap();
function warpSource(it,img){
  if(it.cutout) return img;
  let m=CARDS.get(img); if(m) return m;
  const pad=1.1, c=document.createElement("canvas"); c.width=Math.round(img.width*pad); c.height=Math.round(img.height*pad);
  drawRaw(c.getContext("2d"),it,img,0,0,c.width,c.height); CARDS.set(img,c); return c;
}
function texTri(x,img,s0,s1,s2,d0,d1,d2){
  const cx=(d0[0]+d1[0]+d2[0])/3, cy=(d0[1]+d1[1]+d2[1])/3, g=(p)=>{const dx=p[0]-cx, dy=p[1]-cy, l=Math.hypot(dx,dy)||1; return [p[0]+dx/l*1.3, p[1]+dy/l*1.3]};
  const a0=g(d0),a1=g(d1),a2=g(d2);
  const [x0,y0]=s0,[x1,y1]=s1,[x2,y2]=s2,[u0,v0]=d0,[u1,v1]=d1,[u2,v2]=d2;
  const den=x0*(y2-y1)-x1*y2+x2*y1+(x1-x2)*y0; if(!den) return;
  const A=-(y0*(u2-u1)-y1*u2+y2*u1+(y1-y2)*u0)/den, B=(y1*v2+y0*(v1-v2)-y2*v1+(y2-y1)*v0)/den;
  const C=(x0*(u2-u1)-x1*u2+x2*u1+(x1-x2)*u0)/den, D=-(x1*v2+x0*(v1-v2)-x2*v1+(x2-x1)*v0)/den;
  const E=(x0*(y2*u1-y1*u2)+y0*(x1*u2-x2*u1)+(x2*y1-x1*y2)*u0)/den, F=(x0*(y2*v1-y1*v2)+y0*(x1*v2-x2*v1)+(x2*y1-x1*y2)*v0)/den;
  x.save(); x.beginPath(); x.moveTo(a0[0],a0[1]); x.lineTo(a1[0],a1[1]); x.lineTo(a2[0],a2[1]); x.closePath(); x.clip();
  x.transform(A,B,C,D,E,F); x.drawImage(img,0,0); x.restore();
}
function drawChar(c,it,o){
  c.save(); c.translate(o.x,o.y); if(o.rot) c.rotate(o.rot); c.scale((o.sx||1)*(o.flip?-1:1),o.sy||1);
  if(o.alpha!=null) c.globalAlpha*=o.alpha;
  const top=o.anchor==="top"?0:o.anchor==="center"?-o.h/2:-o.h;
  const img=o.img||it.canvas;
  if(o.fx||o.warp){
    const T=c.getTransform(), k=Math.max(0.5,Math.hypot(T.a,T.b));
    const px=o.warp?o.w*0.3:0, py=o.warp?o.h*0.3:0;
    const tw=Math.max(2,Math.ceil((o.w+2*px)*k)), th=Math.max(2,Math.ceil((o.h+2*py)*k));
    if(TMP.width<tw||TMP.height<th){TMP.width=Math.max(TMP.width,tw); TMP.height=Math.max(TMP.height,th)}
    TMPX.setTransform(1,0,0,1,0,0); TMPX.globalCompositeOperation="source-over"; TMPX.clearRect(0,0,Math.min(TMP.width,tw+4),Math.min(TMP.height,th+4));
    if(o.warp){
      const src=warpSource(it,img), sw=src.width, sh=src.height, N=8, V=[];
      for(let i=0;i<=N;i++){const row=[]; for(let j=0;j<=N;j++){const u=j/N, v=i/N, d=o.warp(u,v,i,j); row.push({s:[u*sw,v*sh], d:[(px+(u+d[0])*o.w)*k,(py+(v+d[1])*o.h)*k]})} V.push(row)}
      for(let i=0;i<N;i++)for(let j=0;j<N;j++){const a=V[i][j],b2=V[i][j+1],cc=V[i+1][j],d=V[i+1][j+1];
        texTri(TMPX,src,a.s,b2.s,d.s,a.d,b2.d,d.d); texTri(TMPX,src,a.s,d.s,cc.s,a.d,d.d,cc.d)}
      if(o.shade){TMPX.globalCompositeOperation="source-atop";
        for(let i=0;i<N;i++)for(let j=0;j<N;j++){const a=V[i][j],b2=V[i][j+1],cc=V[i+1][j],d=V[i+1][j+1];
          for(const [p,q,r,n] of [[a,b2,d,0],[a,d,cc,1]]){const sh=o.shade(i,j,n); if(!sh) continue; TMPX.beginPath(); TMPX.moveTo(p.d[0],p.d[1]); TMPX.lineTo(q.d[0],q.d[1]); TMPX.lineTo(r.d[0],r.d[1]); TMPX.closePath(); TMPX.fillStyle=sh; TMPX.fill()}}
        TMPX.globalCompositeOperation="source-over"}
    }else{TMPX.save(); TMPX.scale(tw/o.w,th/o.h); drawRaw(TMPX,it,img,0,0,o.w,o.h); TMPX.restore()}
    if(o.fx){TMPX.globalCompositeOperation="source-atop"; o.fx(TMPX,tw,th); TMPX.globalCompositeOperation="source-over"}
    c.drawImage(TMP,0,0,tw,th,-o.w/2-px,top-py,o.w+2*px,o.h+2*py);
  }else drawRaw(c,it,img,-o.w/2,top,o.w,o.h);
  c.restore();
}
function fitSize(it,box){const cw=it.canvas.width, ch=it.canvas.height, s=box/Math.max(cw,ch), pad=it.cutout?1:1.1; return {w:cw*s*pad, h:ch*s*pad}}

/* ---------- drum poses ---------- */
function drumPose(j,n,t,sz){
  const a=drumAngle(t), L=waterLevel(t);
  const surf=RG-L*2*RG;
  let iy=RG-sz.h/2-8;
  if(L>0.05){const floatY=surf-sz.h*0.18; iy=Math.min(iy,lerp(iy,floatY,clamp((L-0.05)/0.3)))+Math.sin(t*5+j)*3}
  const idle={x:(j-(n-1)/2)*44, y:iy, r:(j-(n-1)/2)*0.16+(t<1&&t>0.4?Math.sin(t*6+j)*0.08:0)};
  const ps=a+Math.PI/2+j*2*Math.PI/n+0.3*Math.sin(t*2.2+j), rs=Math.max(4,RG-10-Math.max(sz.w,sz.h)*0.42);
  const carry={x:Math.cos(ps)*rs, y:Math.sin(ps)*rs, r:a+j*0.8};
  const w1=ease((t-1.0)/.35), w3=ease((t-4.55)/.4);
  let p={x:lerp(idle.x,carry.x,w1), y:lerp(idle.y,carry.y,w1), r:lerp(idle.r,carry.r,w1)};
  if(w3>0){const settle={x:(j-(n-1)/2)*44, y:RG-sz.h/2-8, r:(j-(n-1)/2)*0.16}; let dr=((p.r-settle.r)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI; p={x:lerp(p.x,settle.x,w3), y:lerp(p.y,settle.y,w3), r:settle.r+dr*(1-w3)}}
  if(t>4.9){const u=t-4.9; p.y-=Math.abs(Math.sin(u*11))*12*Math.exp(-u*6)}
  return p;
}

/* ---------- front targets ---------- */
function targets(list,res){
  const n=list.length, out=[];
  if(res==="hung"){
    const hM=[160,132,112][n-1], gapX=[0,150,118][n-1];
    list.forEach((it,i)=>{const s=hM/Math.max(it.canvas.height,it.canvas.width*0.9), pad=it.cutout?1:1.1; const w=it.canvas.width*s*pad, h=it.canvas.height*s*pad; const x=DX+(i-(n-1)/2)*gapX; out.push({src:i,x,top:lineY(x)+6,w,h,anchor:"top"})});
    return out;
  }
  const hMax=[236,196,168][n-1], avail=340, gap=-6, base=494;
  const sizes=list.map((it,i)=>{const big=(n===3&&i===1)?1.08:1; const s=Math.min(hMax*big/it.canvas.height,(n===1?300:avail/n*1.25)*big/it.canvas.width); const pad=it.cutout?1:1.1; return {w:it.canvas.width*s*pad, h:it.canvas.height*s*pad}});
  if(res==="clone"&&n===1){const z=sizes[0]; const w=z.w*0.8, h=z.h*0.8; out.push({src:0,x:DX-w*0.5,by:base,w,h}); out.push({src:0,x:DX+w*0.5,by:base,w,h,flip:true,clone:true}); return out}
  if(res==="sleep"){const tot=sizes.reduce((a,b)=>a+b.h,0)+10*(n-1); const f=Math.min(1,330/tot); let cx=DX-Math.min(tot,330)/2; sizes.forEach((z,i)=>{const w=z.w*f,h=z.h*f; out.push({src:i,x:cx+h/2,by:base,w,h,lying:true}); cx+=h+10*f}); return out}
  let total=sizes.reduce((a,b)=>a+b.w,0)+gap*(n-1);
  if(total>avail){const f=avail/total; sizes.forEach(z=>{z.w*=f; z.h*=f}); total=avail}
  let cx=DX-total/2;
  sizes.forEach((sz,i)=>{const x=cx+sz.w/2; cx+=sz.w+gap; out.push({src:i,x,by:base+Math.abs(x-DX)*0.04,w:sz.w,h:sz.h})});
  if(n===3){const m=out.splice(1,1)[0]; out.push(m)}
  return out;
}

/* ---------- motion per result ---------- */
function motion(res,t,k){ // returns offsets
  const m={dx:0,dy:0,rot:0,sx:1,sy:1,flip:false};
  const b=Math.sin(t*3+k); m.sy*=1+0.015*b; m.sx*=1-0.01*b;
  const hop=(per,amp,ph)=>{const s=Math.sin((t*per+ph)*2*Math.PI); if(s>0){m.dy-=s*amp; m.sy*=1+0.07*s; m.sx*=1-0.05*s} else {m.sy*=1+0.13*s; m.sx*=1-0.1*s}};
  switch(res){
    case "fluffy": case "rainbow": hop(1.15,18,k*0.3); break;
    case "shrink": {const s=Math.abs(Math.sin(t*7+k)); m.dy-=s*6; m.rot=(Math.floor(t*3.5+k)%2?0.06:-0.06)*s; break;}
    case "faded": m.rot=0.05*Math.sin(t*0.9+k); m.sy*=0.97; m.dy+=2; break;
    case "pink": m.rot=0.1*Math.sin(t*1.6+k); m.flip=Math.floor(t*0.7+k*0.5)%2===1; break;
    case "foam": {const ph=((t+k*0.3)%1.6)/1.6; if(ph<0.28){const e=Math.sin(ph/0.28*Math.PI); m.rot=0.14*Math.sin(t*42)*e; m.sx*=1+0.05*e; m.sy*=1-0.04*e} break;}
    case "dizzy": m.rot=0.2*Math.sin(t*2.6+k); m.dx=7*Math.sin(t*1.3+k); m.dy-=Math.abs(Math.sin(t*2.6))*3; break;
    case "static": {m.dx=Math.sin(t*63)*2.2; m.dy=Math.cos(t*71)*1.5; const ph=((t+k*0.4)%1.3)/1.3; if(ph<0.25){const e=Math.sin(ph/0.25*Math.PI); m.dy-=e*22; m.sy*=1+0.08*e; m.sx*=1-0.06*e} break;}
    case "sock": m.rot=0.13*Math.sin(t*1.3+k); m.dy-=Math.abs(Math.sin(t*1.3))*2; break;
    case "gold": m.dy-=8+6*Math.sin(t*1.8+k); m.rot=0.03*Math.sin(t*1.1); break;
    case "fusion": m.rot=0.09*Math.sin(t*2.2+k); m.sx*=1+0.03*Math.sin(t*4.4); m.dy-=Math.abs(Math.sin(t*2.2))*6; break;
    case "satan": m.dy-=10+7*Math.sin(t*1.6+k); m.rot=0.06*Math.sin(t*0.9+k); m.sx*=1+0.02*Math.sin(t*3.2); break;
    case "catears": hop(0.8,8,k*0.4); m.rot=0.05*Math.sin(t*1.6+k); break;
    case "clone": hop(1.0,12,k*0.5); break;
    case "wrinkle": m.dx=Math.sin(t*48+k)*1.3; m.rot=0.03*Math.sin(t*2); break;
    case "fresh": {const ph=((t+k*0.3)%2.2)/2.2; if(ph<0.3){const e=Math.sin(ph/0.3*Math.PI); m.dy-=e*20; m.rot=-0.12*e} else m.rot=-0.05*Math.sin((ph-0.3)*8); break;}
    case "cat": m.sy*=0.96+0.02*Math.sin(t*2); m.sx*=1.02; m.rot=0.05*Math.sin(t*1.4+k); break;
  }
  return m;
}
