let CUR_PIN="#E8C49A";
/* ---------- shapes ---------- */
function rrect(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function star4(c,x,y,r){c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2, rr=i%2?r*0.34:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath()}
function star5(c,x,y,r){c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2, rr=i%2?r*0.47:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath()}
function heart(c,x,y,r){c.beginPath();c.moveTo(x,y+r*0.9);c.bezierCurveTo(x-r*1.3,y,x-r*0.7,y-r*1.05,x,y-r*0.35);c.bezierCurveTo(x+r*0.7,y-r*1.05,x+r*1.3,y,x,y+r*0.9);c.closePath()}
function bubble(c,x,y,r,a){if(a<=0.01) return; c.save();c.globalAlpha*=a;c.beginPath();c.arc(x,y,r,0,7);c.fillStyle="rgba(255,255,255,.4)";c.fill();c.lineWidth=Math.max(1,r*0.14);c.strokeStyle="rgba(120,160,215,.8)";c.stroke();c.beginPath();c.arc(x-r*0.35,y-r*0.35,r*0.24,0,7);c.fillStyle="#FFFFFF";c.fill();c.restore()}
function foamBlob(c,x,y,r){c.beginPath();c.arc(x,y,r,0,7);c.fillStyle="#FFFFFF";c.fill();c.lineWidth=1.6;c.strokeStyle="rgba(120,155,205,.6)";c.stroke();c.beginPath();c.arc(x-r*.3,y-r*.35,r*.22,0,7);c.fillStyle="rgba(205,228,255,.95)";c.fill()}
function drop(c,x,y,s,col){c.beginPath();c.moveTo(x,y-s*1.5);c.bezierCurveTo(x+s*0.4,y-s*0.7,x+s,y-s*0.1,x+s,y+s*0.35);c.arc(x,y+s*0.35,s,0,Math.PI);c.bezierCurveTo(x-s,y-s*0.1,x-s*0.4,y-s*0.7,x,y-s*1.5);c.closePath();c.fillStyle=col;c.fill();c.fillStyle="rgba(255,255,255,.8)";c.beginPath();c.ellipse(x-s*0.35,y+s*0.1,s*0.22,s*0.34,0.4,0,7);c.fill()}
function angerMark(c,x,y,s){c.save();c.translate(x,y);c.strokeStyle="#EF4D63";c.lineWidth=s*0.22;c.lineCap="round";for(let k=0;k<4;k++){c.save();c.rotate(k*Math.PI/2);c.beginPath();c.moveTo(s*0.22,-s*0.78);c.quadraticCurveTo(s*0.28,-s*0.28,s*0.78,-s*0.22);c.stroke();c.restore()}c.restore()}
function outline(c,w){c.lineWidth=w||2.2; c.strokeStyle=INK; c.lineJoin="round"; c.lineCap="round"; c.stroke()}

/* speech bubble: (x,y) = bottom centre of the body, tail tip points toward tipX.
   Body and tail are one closed path so they fill and outline as a single shape. */
function speech(c,x,y,text,k,opt){
  if(k<=0.01||!text) return; opt=opt||{};
  const fs=opt.fs||19;
  c.save(); c.font=`${fs}px Jua, sans-serif`;
  const ph=fs+18, r=Math.min(15,ph/2-3), rw=10;
  const pw=Math.max(c.measureText(text).width+30, 2*r+2*rw+18);
  x=clamp(x,pw/2+8,LW-pw/2-8); y=clamp(y,ph+8,LH-18);
  const tipX=opt.tipX==null?x-pw*0.25:opt.tipX;
  const dir=tipX<x?-1:1;
  const x0=-pw/2, x1=pw/2, y0=-ph, y1=0;
  const tx=clamp(tipX-x+dir*-6, x0+r+rw+2, x1-r-rw-2);   // tail root centre, always on the straight bottom edge
  const tipx=tx+dir*12, tipy=y1+14;
  const s=easeBack(k);
  c.translate(x,y+tipy); c.scale(s,s); c.translate(0,-tipy);
  const path=()=>{
    c.beginPath();
    c.moveTo(x0+r,y0); c.lineTo(x1-r,y0); c.quadraticCurveTo(x1,y0,x1,y0+r);
    c.lineTo(x1,y1-r); c.quadraticCurveTo(x1,y1,x1-r,y1);
    c.lineTo(tx+rw,y1);
    if(dir<0){c.bezierCurveTo(tx+rw*0.35,y1,tx+2,y1+5,tipx,tipy); c.bezierCurveTo(tx-3,y1+7,tx-rw*0.6,y1+0.5,tx-rw,y1)}
    else{c.bezierCurveTo(tx+rw*0.6,y1+0.5,tx+3,y1+7,tipx,tipy); c.bezierCurveTo(tx-2,y1+5,tx-rw*0.35,y1,tx-rw,y1)}
    c.lineTo(x0+r,y1); c.quadraticCurveTo(x0,y1,x0,y1-r);
    c.lineTo(x0,y0+r); c.quadraticCurveTo(x0,y0,x0+r,y0); c.closePath();
  };
  c.save(); c.translate(0,3); path(); c.fillStyle="rgba(40,80,120,.12)"; c.fill(); c.restore();
  path(); c.fillStyle="#FFFFFF"; c.fill(); c.lineWidth=2.2; c.strokeStyle=INK; c.lineJoin="round"; c.lineCap="round"; c.stroke();
  c.fillStyle="#2E4153"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(text,0,-ph/2+1);
  c.restore();
}

/* ---------- props ---------- */
function clothespin(c,x,y,a,col){c.save(); c.translate(x,y); c.globalAlpha*=a==null?1:a; rrect(c,-3.5,-7,7,15,2.5); c.fillStyle=col||CUR_PIN; c.fill(); outline(c,1.4); c.beginPath(); c.moveTo(-3.5,0); c.lineTo(3.5,0); c.stroke(); c.restore()}
function teePath(c,s){c.beginPath(); c.moveTo(-10*s,0); c.quadraticCurveTo(0,6*s,10*s,0); c.lineTo(20*s,6*s); c.lineTo(15*s,16*s); c.lineTo(11*s,14*s); c.lineTo(11*s,34*s); c.quadraticCurveTo(0,36*s,-11*s,34*s); c.lineTo(-11*s,14*s); c.lineTo(-15*s,16*s); c.lineTo(-20*s,6*s); c.closePath()}
function drawTee(c,s,col,deco){teePath(c,s); c.fillStyle=col; c.fill(); if(deco){c.save(); teePath(c,s); c.clip(); deco(c,s); c.restore()} teePath(c,s); outline(c,1.6); c.beginPath(); c.moveTo(-5*s,2.4*s); c.quadraticCurveTo(0,5.5*s,5*s,2.4*s); c.stroke()}
function sockPath(c,s){c.beginPath(); c.moveTo(-9*s,0); c.lineTo(9*s,0); c.lineTo(9*s,24*s); c.quadraticCurveTo(10*s,28*s,15*s,28*s); c.lineTo(22*s,28*s); c.quadraticCurveTo(29*s,28.5*s,29*s,34*s); c.quadraticCurveTo(29*s,40*s,22*s,40*s); c.lineTo(-1*s,40*s); c.quadraticCurveTo(-10*s,40*s,-10*s,31*s); c.closePath()}
function drawSock(c,s,base,stripe,patch){
  sockPath(c,s); c.fillStyle=base; c.fill();
  c.save(); sockPath(c,s); c.clip();
  c.fillStyle=patch||stripe; c.beginPath(); c.arc(-5*s,37*s,8*s,0,7); c.fill(); c.beginPath(); c.arc(27*s,34*s,7*s,0,7); c.fill();
  if(stripe){c.fillStyle=stripe; c.fillRect(-12*s,10*s,24*s,3.4*s); c.fillRect(-12*s,17*s,24*s,3.4*s)}
  c.fillStyle="rgba(255,255,255,.85)"; c.fillRect(-12*s,0,24*s,6*s);
  c.restore();
  sockPath(c,s); outline(c,Math.max(1.3,1.6*s)); c.beginPath(); c.moveTo(-9*s,6*s); c.lineTo(9*s,6*s); c.lineWidth=1.1*s; c.stroke();
  c.strokeStyle="rgba(78,95,115,.35)"; c.lineWidth=1*s; for(let i=-6;i<=6;i+=3){c.beginPath(); c.moveTo(i*s,1*s); c.lineTo(i*s,5.4*s); c.stroke()}
}
function towelPath(c,w,h){rrect(c,-w/2,0,w,h,3)}
function drawTowel(c,w,h,col,deco){towelPath(c,w,h); c.fillStyle=col; c.fill(); c.save(); towelPath(c,w,h); c.clip(); c.fillStyle="rgba(255,255,255,.7)"; c.fillRect(-w/2,h-9,w,3.5); if(deco) deco(c,w,h); c.restore(); towelPath(c,w,h); outline(c,1.6); c.strokeStyle=INK; c.lineWidth=1.2; for(let x=-w/2+3;x<=w/2-2;x+=4){c.beginPath(); c.moveTo(x,h); c.lineTo(x,h+3.5); c.stroke()}}
function drawDuck(c,x,y,s,col,beak){
  c.save(); c.translate(x,y); c.scale(s,s);
  c.beginPath(); c.moveTo(-18,0); c.quadraticCurveTo(-22,-14,-8,-14); c.quadraticCurveTo(-4,-28,8,-26); c.quadraticCurveTo(20,-24,16,-10); c.quadraticCurveTo(24,-6,20,0); c.closePath(); c.fillStyle=col||"#FFD95C"; c.fill(); outline(c,2);
  c.beginPath(); c.ellipse(19,-17,6,3.4,0.2,0,7); c.fillStyle=beak||"#FF9F5A"; c.fill(); outline(c,1.6);
  c.fillStyle=INK; c.beginPath(); c.arc(10,-20,1.9,0,7); c.fill();
  c.fillStyle="rgba(255,140,160,.55)"; c.beginPath(); c.ellipse(8,-14,3,1.8,0,0,7); c.fill();
  c.beginPath(); c.moveTo(-10,-8); c.quadraticCurveTo(-2,-2,6,-8); c.strokeStyle=INK; c.lineWidth=1.5; c.stroke();
  c.restore();
}
function drawBottle(c,x,y,col){ // x,y = bottom centre
  c.save(); c.translate(x,y);
  rrect(c,-8,-60,16,12,4); c.fillStyle="#FFFFFF"; c.fill(); outline(c,1.8);
  rrect(c,-19,-50,38,50,12); c.fillStyle=col; c.fill(); outline(c,2.2);
  rrect(c,-13,-40,26,24,7); c.fillStyle="#FFFFFF"; c.fill(); outline(c,1.4);
  c.fillStyle=col; heart(c,0,-29,6); c.fill();
  c.fillStyle="rgba(255,255,255,.5)"; rrect(c,-15,-46,4,30,2); c.fill();
  c.restore();
}
function drawTowelStack(c,x,y,cols){ // bottom-left
  c.save(); c.translate(x,y);
  [[0,-12,58,12,cols[1]],[4,-22,50,11,cols[2]]].forEach(([dx,dy,w,h,col])=>{rrect(c,dx,dy,w,h,5.5); c.fillStyle=col; c.fill(); outline(c,1.8); c.fillStyle="rgba(255,255,255,.65)"; c.fillRect(dx+10,dy+1.5,4,h-3); c.fillRect(dx+w-15,dy+1.5,4,h-3)});
  c.restore();
}
function drawBasket(c,x,y,th){ // bottom centre
  c.save(); c.translate(x,y);
  // clothes peeking
  c.save(); c.translate(-10,-52); c.rotate(-0.35); drawSock(c,0.8,th.cloth[0],"#FFFFFF"); c.restore();
  c.save(); c.translate(14,-50); c.rotate(0.2); rrect(c,-14,-8,30,22,6); c.fillStyle=th.cloth[2]; c.fill(); outline(c,1.6); c.restore();
  c.beginPath(); c.moveTo(-36,-44); c.lineTo(36,-44); c.lineTo(30,0); c.quadraticCurveTo(29,4,24,4); c.lineTo(-24,4); c.quadraticCurveTo(-29,4,-30,0); c.closePath();
  c.fillStyle=th.basket; c.fill();
  c.save(); c.clip(); c.strokeStyle=th.weave; c.lineWidth=1.6; for(let yy=-36;yy<4;yy+=8){c.beginPath(); c.moveTo(-40,yy); c.lineTo(40,yy); c.stroke()} for(let xx=-36;xx<40;xx+=9){c.beginPath(); c.moveTo(xx,-44); c.lineTo(xx*0.85,4); c.stroke()} c.restore();
  c.beginPath(); c.moveTo(-36,-44); c.lineTo(36,-44); c.lineTo(30,0); c.quadraticCurveTo(29,4,24,4); c.lineTo(-24,4); c.quadraticCurveTo(-29,4,-30,0); c.closePath(); outline(c,2);
  rrect(c,-39,-49,78,9,4.5); c.fillStyle=th.basketRim; c.fill(); outline(c,1.8);
  rrect(c,-10,-38,20,7,3.5); c.fillStyle=th.weave; c.fill();
  c.restore();
}
function drawPlant(c,x,y,amb,th){
  c.save(); c.translate(x,y);
  const leaf=(a,l)=>{c.save(); c.rotate(a+Math.sin(amb*1.3+a*3)*0.04); c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(-l*0.35,-l*0.5,0,-l); c.quadraticCurveTo(l*0.35,-l*0.5,0,0); c.fillStyle=th.leaf; c.fill(); outline(c,1.6); c.beginPath(); c.moveTo(0,-2); c.lineTo(0,-l*0.8); c.lineWidth=1; c.stroke(); c.restore()};
  leaf(-0.6,30); leaf(0.55,32); leaf(-0.1,40); leaf(0.2,26);
  c.beginPath(); c.moveTo(-18,-2); c.lineTo(18,-2); c.lineTo(14,30); c.quadraticCurveTo(13,34,9,34); c.lineTo(-9,34); c.quadraticCurveTo(-13,34,-14,30); c.closePath(); c.fillStyle=th.pot; c.fill(); outline(c,2);
  rrect(c,-21,-6,42,9,4.5); c.fillStyle=th.potRim; c.fill(); outline(c,1.8);
  c.fillStyle="#FFFFFF"; heart(c,0,15,5); c.fill();
  c.restore();
}
function drawBlanket(c,x,y,w,h,col){ // x,y = bottom centre
  c.save(); c.translate(x,y);
  const path=()=>{c.beginPath(); c.moveTo(-w/2,-h+10); c.quadraticCurveTo(-w/2,-h,-w/2+10,-h); c.lineTo(w/2-10,-h); c.quadraticCurveTo(w/2,-h,w/2,-h+10); c.lineTo(w/2,0); const n=Math.max(3,Math.round(w/16)); for(let i=0;i<n;i++){const x1=w/2-(i+1)*w/n; c.quadraticCurveTo(x1+w/n/2,7,x1,0)} c.closePath()};
  path(); c.fillStyle=col; c.fill();
  c.save(); path(); c.clip();
  c.strokeStyle="rgba(255,255,255,.75)"; c.setLineDash([4,4]); c.lineWidth=1.6;
  for(let i=-w;i<w;i+=22){c.beginPath(); c.moveTo(i,-h); c.lineTo(i+h,0); c.stroke(); c.beginPath(); c.moveTo(i+h,-h); c.lineTo(i,0); c.stroke()}
  c.setLineDash([]);
  c.fillStyle="#FFFFFF"; for(let yy=-h+22;yy<0;yy+=22){for(let xx=-w/2+11;xx<w/2;xx+=22){heart(c,xx+((yy/22|0)%2?11:0),yy,3.2); c.fill()}}
  c.fillStyle="#FFFFFF"; c.fillRect(-w/2,-h,w,12); c.strokeStyle="rgba(78,95,115,.25)"; c.lineWidth=1; c.beginPath(); c.moveTo(-w/2,-h+12); c.lineTo(w/2,-h+12); c.stroke();
  c.restore();
  path(); outline(c,2.2);
  c.restore();
}
function drawPillow(c,x,y,w,h){
  c.save(); c.translate(x,y);
  const path=()=>{c.beginPath(); c.moveTo(-w/2,-h/2); c.quadraticCurveTo(0,-h/2-6,w/2,-h/2); c.quadraticCurveTo(w/2+6,0,w/2,h/2); c.quadraticCurveTo(0,h/2+6,-w/2,h/2); c.quadraticCurveTo(-w/2-6,0,-w/2,-h/2); c.closePath()};
  path(); c.fillStyle="#FFFFFF"; c.fill(); outline(c,2);
  c.setLineDash([3,3]); c.strokeStyle="rgba(78,95,115,.35)"; c.lineWidth=1.2; rrect(c,-w/2+6,-h/2+5,w-12,h-10,8); c.stroke(); c.setLineDash([]);
  c.restore();
}
function drawCat(c,x,y,s,t){ // x,y = bottom centre; a deadpan black cat sitting on the character's head
  const B="#2C2F36", L="#16181C";
  c.save(); c.translate(x,y); c.scale(s/60,s/60);
  const rim=(f)=>{c.save(); f(); c.lineWidth=7; c.strokeStyle="#FFFFFF"; c.stroke(); c.restore()};
  const tail=()=>{c.beginPath(); c.moveTo(24,-6); c.quadraticCurveTo(46+Math.sin(t*3)*6,-10,42+Math.sin(t*3)*10,-36)};
  c.save(); tail(); c.lineCap="round"; c.lineWidth=15; c.strokeStyle="#FFFFFF"; c.stroke(); c.lineWidth=11; c.strokeStyle=L; c.stroke(); c.lineWidth=7.4; c.strokeStyle=B; c.stroke(); c.restore();
  const body=()=>{c.beginPath(); c.ellipse(0,-14,31,17,0,0,7)};
  const ear=(sx)=>{c.beginPath(); c.moveTo(sx*24,-48); c.quadraticCurveTo(sx*25,-68,sx*18,-70); c.quadraticCurveTo(sx*10,-66,sx*4,-58); c.closePath()};
  const head=()=>{c.beginPath(); c.ellipse(0,-40,28,22,0,0,7)};
  rim(body); rim(()=>ear(-1)); rim(()=>ear(1)); rim(head);
  body(); c.fillStyle=B; c.fill(); outline(c,2.4);
  for(const sx of [-1,1]){ear(sx); c.fillStyle=B; c.fill(); outline(c,2.4); c.beginPath(); c.moveTo(sx*20,-52); c.quadraticCurveTo(sx*20,-63,sx*17,-64); c.quadraticCurveTo(sx*12,-61,sx*9,-57); c.closePath(); c.fillStyle="#8A8F99"; c.fill()}
  head(); c.fillStyle=B; c.fill(); outline(c,2.4);
  c.fillStyle="rgba(255,255,255,.08)"; c.beginPath(); c.ellipse(-9,-50,10,5,-0.4,0,7); c.fill();
  for(const sx of [-10,10]){c.save(); c.beginPath(); c.ellipse(sx,-41,5.5,5.5,0,0,7); c.clip(); c.fillStyle="#FFD45C"; c.fillRect(sx-7,-48,14,14); c.fillStyle="#1A1B20"; c.fillRect(sx-1.3,-45,2.6,9); c.fillStyle=B; c.fillRect(sx-7,-48,14,5); c.restore(); c.beginPath(); c.moveTo(sx-6,-43); c.lineTo(sx+6,-43); c.lineWidth=1.8; c.strokeStyle=L; c.stroke()}
  c.fillStyle="#F7A8BC"; c.beginPath(); c.moveTo(-2.6,-34); c.lineTo(2.6,-34); c.lineTo(0,-31); c.closePath(); c.fill();
  c.strokeStyle="#D6D9DE"; c.lineCap="round"; c.lineWidth=1.6; c.beginPath(); c.moveTo(-3.5,-28); c.lineTo(3.5,-28); c.stroke();
  c.lineWidth=1.2; c.beginPath(); c.moveTo(-18,-33); c.lineTo(-30,-35); c.moveTo(-18,-30); c.lineTo(-29,-28); c.moveTo(18,-33); c.lineTo(30,-35); c.moveTo(18,-30); c.lineTo(29,-28); c.stroke();
  for(const px of [-14,14]){c.beginPath(); c.ellipse(px,-2,8,6,0,0,7); c.fillStyle="#3F434C"; c.fill(); outline(c,2)}
  c.restore();
}
function newBadge(c,x,y,r,rot){c.save(); c.translate(x,y); c.rotate(rot); c.beginPath(); const n=12; for(let i=0;i<n*2;i++){const a=i*Math.PI/n, rr=i%2?r*0.86:r; c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)} c.closePath(); c.fillStyle="#FF6F91"; c.fill(); outline(c,2); c.fillStyle="#FFFFFF"; c.font=`${r*0.62}px Jua, sans-serif`; c.textAlign="center"; c.textBaseline="middle"; c.fillText("NEW",0,1); c.restore()}

/* collection laundry: one small piece per result, hung on the back clotheslines */
const DEX_ORDER=["fluffy","shrink","faded","pink","foam","dizzy","static","sock","catears","clone","fusion","flat","hung","wrinkle","fresh","cat","sleep","rainbow","gold"];
function drawDexPiece(c,key,th){
  const C=th.cloth;
  switch(key){
    case "fluffy": drawTowel(c,26,30,"#FFD1DC",(x,w,h)=>{x.fillStyle="#FFFFFF"; heart(x,0,12,5); x.fill()}); break;
    case "shrink": drawTee(c,0.62,C[1],(x,s)=>{x.fillStyle="#FFFFFF"; x.fillRect(-12*s,20*s,24*s,3*s)}); break;
    case "faded": drawTee(c,0.8,"#D6D6D6",(x,s)=>{x.fillStyle="#BDBDBD"; x.beginPath(); x.arc(0,20*s,5*s,0,7); x.fill()}); break;
    case "pink": drawSock(c,0.72,"#FF9EBB","#FFFFFF"); break;
    case "foam": drawTowel(c,28,30,"#BFE3FF",(x)=>{[[-6,10,4],[5,16,5],[-3,22,3],[7,6,3]].forEach(([a,b,r])=>{x.beginPath(); x.arc(a,b,r,0,7); x.fillStyle="#FFFFFF"; x.fill()})}); break;
    case "dizzy": drawTee(c,0.8,"#D8CCFF",(x,s)=>{x.strokeStyle="#8E7BE0"; x.lineWidth=1.6; x.beginPath(); for(let i=0;i<22;i++){const a=i*0.55, r=i*0.34*s; const px=Math.cos(a)*r, py=20*s+Math.sin(a)*r; i?x.lineTo(px,py):x.moveTo(px,py)} x.stroke()}); break;
    case "static": drawTee(c,0.8,"#FFE680",(x,s)=>{x.beginPath(); x.moveTo(-3*s,10*s); x.lineTo(4*s,18*s); x.lineTo(-1*s,20*s); x.lineTo(4*s,29*s); x.lineWidth=2.2; x.strokeStyle="#F2A600"; x.stroke()}); break;
    case "sock": drawSock(c,0.72,"#FFFFFF","#7CC6F2","#7CC6F2"); break;
    case "catears": c.save(); c.translate(0,4); c.beginPath(); c.moveTo(-14,22); c.quadraticCurveTo(-15,0,0,0); c.quadraticCurveTo(15,0,14,22); c.closePath(); c.fillStyle="#C9B8F5"; c.fill(); outline(c,1.6); c.beginPath(); c.moveTo(-12,6); c.lineTo(-12,-6); c.lineTo(-4,1); c.closePath(); c.fill(); outline(c,1.4); c.beginPath(); c.moveTo(12,6); c.lineTo(12,-6); c.lineTo(4,1); c.closePath(); c.fillStyle="#C9B8F5"; c.fill(); outline(c,1.4); rrect(c,-15,18,30,6,3); c.fillStyle="#FFFFFF"; c.fill(); outline(c,1.2); c.restore(); break;
    case "clone": c.save(); c.translate(-7,0); drawSock(c,0.5,"#A8E3CF","#FFFFFF"); c.restore(); c.save(); c.translate(7,3); drawSock(c,0.5,"#A8E3CF","#FFFFFF"); c.restore(); break;
    case "fusion": c.save(); drawTee(c,0.8,"#FFB8C9",(x,s)=>{x.fillStyle="#A6D8F7"; x.fillRect(0,-2,40*s,40*s); x.strokeStyle="#FFFFFF"; x.lineWidth=1.6; x.beginPath(); for(let yy=0;yy<=34;yy+=4){x.lineTo((yy/4%2?2:-2)*s,yy*s)} x.stroke()}); c.restore(); break;
    case "flat": c.save(); c.beginPath(); c.moveTo(-15,0); c.lineTo(15,0); c.lineTo(0,24); c.closePath(); c.fillStyle="#FF9E8A"; c.fill(); outline(c,1.6); c.fillStyle="#FFFFFF"; [[-6,5],[5,5],[0,13]].forEach(([a,b])=>{c.beginPath(); c.arc(a,b,1.8,0,7); c.fill()}); c.restore(); break;
    case "hung": c.save(); c.beginPath(); c.moveTo(-7,0); c.lineTo(7,0); c.lineTo(9,8); c.lineTo(16,32); c.quadraticCurveTo(0,36,-16,32); c.lineTo(-9,8); c.closePath(); c.fillStyle="#FFB8C9"; c.fill(); outline(c,1.6); c.fillStyle="#FFFFFF"; for(let i=-10;i<=10;i+=5){c.beginPath(); c.arc(i,26,1.6,0,7); c.fill()} c.restore(); break;
    case "wrinkle": c.save(); c.rotate(0.12); drawTee(c,0.8,"#FFFFFF",(x,s)=>{x.strokeStyle="rgba(78,95,115,.5)"; x.lineWidth=1.2; x.beginPath(); x.moveTo(-8*s,10*s); x.lineTo(-2*s,16*s); x.lineTo(-7*s,22*s); x.lineTo(1*s,30*s); x.moveTo(6*s,12*s); x.lineTo(3*s,20*s); x.lineTo(8*s,26*s); x.stroke()}); c.restore(); break;
    case "fresh": drawTee(c,0.8,"#A6E3F7",null); c.save(); c.translate(9,24); c.rotate(0.3); rrect(c,-5,-3,10,13,2); c.fillStyle="#FFFFFF"; c.fill(); outline(c,1.2); c.fillStyle="#FF6F91"; c.fillRect(-3,2,6,2); c.restore(); break;
    case "cat": drawTowel(c,28,30,"#E9EBEF",(x)=>{x.fillStyle="#2C2F36"; x.beginPath(); x.arc(0,14,6,0,7); x.fill(); x.beginPath(); x.moveTo(-6,11); x.lineTo(-5,5); x.lineTo(-1,9); x.fill(); x.beginPath(); x.moveTo(6,11); x.lineTo(5,5); x.lineTo(1,9); x.fill()}); break;
    case "sleep": c.save(); rrect(c,-15,2,30,22,8); c.fillStyle="#E4F1FB"; c.fill(); outline(c,1.6); c.fillStyle="#7684E0"; c.font='11px Jua, sans-serif'; c.textAlign="center"; c.fillText("z z",0,17); c.restore(); break;
    case "rainbow": {const cols=RAINBOW.map(r=>`rgb(${r})`); drawSock(c,0.72,cols[0],null); c.save(); sockPath(c,0.72); c.clip(); cols.forEach((col,i)=>{c.fillStyle=col; c.fillRect(-12,4+i*4.8,40,4.8)}); c.restore(); sockPath(c,0.72); outline(c,1.3); break;}
    case "satan": drawTee(c,0.86,"#2E2A33",(x,s)=>{x.fillStyle="#E3344B"; heart(x,0,20*s,6*s); x.fill()});
      c.fillStyle="#E3344B"; for(const sd of [-1,1]){c.beginPath(); c.moveTo(sd*6,2); c.quadraticCurveTo(sd*11,-8,sd*7,-13); c.quadraticCurveTo(sd*6,-6,sd*1.5,1); c.closePath(); c.fill(); outline(c,1.3)} break;
    case "gold": drawTee(c,0.8,"#FFD86B",(x,s)=>{star5(x,0,20*s,6*s); x.fillStyle="#FFFFFF"; x.fill()}); break;
  }
}
