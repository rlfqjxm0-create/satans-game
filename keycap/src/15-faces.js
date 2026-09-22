/* ---------- 얼굴 만들기: ears + a face drawn on the flat top ----------
   The face is drawn on a canvas and laid on the top like the top print; its "up" is the back of the key
   (-z), so the ears grow out of the BACK WALL there, pointing backwards and tilted up - not stuck into the
   top. Every part is a preset (OPT.ears/eyes/shine/nose/mouth/extra); ANIMALS fills them all in one tap. */
Object.assign(OPT,{
  ears:{none:"없음",cat:"고양이",bunny:"토끼",fox:"여우",wolf:"늑대",bear:"곰",dog:"강아지",pig:"돼지"},
  eyes:{none:"없음",round:"동글",sparkle:"초롱",half:"반달",lash:"속눈썹",up:"올라간",down:"내려간",smile:"웃는",sleepy:"졸린"},
  shine:{many:"반짝반짝",one:"하나",none:"없음"},
  nose:{none:"없음",tri:"분홍 세모",dot:"까만 동글",heart:"하트",bean:"콩",big:"큰 코",pig:"돼지 코"},
  mouth:{none:"없음",w:"ω",bunny:"ㅅ",caret:"^",line:"一",smile:"웃는",open:"활짝"},
  extra:{whisker:"수염",blush:"홍조",freckle:"주근깨",mole:"점",fox:"여우 무늬",muzzle:"동그란 주둥이",rglass:"동그란 안경",sglass:"네모난 안경"}
});
const FACE_KEYS=["ears","eyes","shine","nose","mouth"];
const ANIMALS={
  cat:{name:"고양이",color:"#FFD6E5",ears:"cat",eyes:"round",shine:"many",nose:"tri",mouth:"w",extra:["whisker","blush"]},
  bunny:{name:"토끼",color:"#FFFFFF",ears:"bunny",eyes:"sparkle",shine:"many",nose:"tri",mouth:"bunny",extra:["blush"]},
  fox:{name:"여우",color:"#FFA25C",ears:"fox",eyes:"up",shine:"one",nose:"dot",mouth:"caret",extra:["fox"]},
  dog:{name:"강아지",color:"#F2D2A9",ears:"dog",eyes:"sparkle",shine:"many",nose:"big",mouth:"open",extra:["muzzle","blush"]},
  wolf:{name:"늑대",color:"#B8C0CC",ears:"wolf",eyes:"half",shine:"one",nose:"dot",mouth:"line",extra:["fox"]},
  bear:{name:"곰",color:"#C8946A",ears:"bear",eyes:"round",shine:"many",nose:"dot",mouth:"w",extra:["muzzle","blush"]},
  pig:{name:"돼지",color:"#FFC9D6",ears:"pig",eyes:"round",shine:"many",nose:"pig",mouth:"w",extra:["blush"]}
};

/* ears: built flat in XY (base on y=0), then laid down flat so they reach straight back, level with the top */
const earPoint=(w,h,y0)=>{const s=new THREE.Shape(); y0=y0||0; s.moveTo(-w,y0); s.quadraticCurveTo(-w*0.8,y0+h*0.58,-0.26,y0+h*0.96); s.quadraticCurveTo(0,y0+h*1.05,0.26,y0+h*0.96); s.quadraticCurveTo(w*0.8,y0+h*0.58,w,y0); s.lineTo(-w,y0); return s};
const earLong=(w,h,y0)=>{const s=new THREE.Shape(); y0=y0||0; s.moveTo(-w*0.8,y0); s.bezierCurveTo(-w*1.3,y0+h*0.36,-w*1.2,y0+h,0,y0+h); s.bezierCurveTo(w*1.2,y0+h,w*1.3,y0+h*0.36,w*0.8,y0); s.lineTo(-w*0.8,y0); return s};
const earRound=(r,y0)=>{const s=new THREE.Shape(); y0=y0||0; s.moveTo(-r,y0); s.bezierCurveTo(-r*1.25,y0+r*1.55,r*1.25,y0+r*1.55,r,y0); s.lineTo(-r,y0); return s};
const earPig=(w,h,y0)=>{const s=new THREE.Shape(); y0=y0||0; s.moveTo(-w,y0); s.quadraticCurveTo(-w*0.95,y0+h*0.55,-w*0.3,y0+h*0.92); s.quadraticCurveTo(0,y0+h*1.08,w*0.3,y0+h*0.92); s.quadraticCurveTo(w*0.95,y0+h*0.55,w,y0); s.lineTo(-w,y0); return s};
const EARS={
  cat:{x:0.52,yaw:0.12,outer:()=>earPoint(2.4,5.2),inner:()=>earPoint(1.25,3.7,0.8),innerCol:"#FFB8C9"},
  fox:{x:0.52,yaw:0.14,outer:()=>earPoint(2.8,6),inner:()=>earPoint(1.2,3.8,1.1),innerCol:"#FFE2CC"},
  wolf:{x:0.5,yaw:0.1,outer:()=>earPoint(2.2,6.2),inner:()=>earPoint(0.95,4,1.1),innerCol:"#EDE7F2"},
  bunny:{x:0.36,yaw:0,outer:()=>earLong(1.7,8.4),inner:()=>earLong(0.9,6.4,1),innerCol:"#FFB8C9"},
  pig:{x:0.52,yaw:0.2,outer:()=>earPig(2.8,4.4),inner:()=>earPig(1.6,3,0.7),innerCol:"#FF9DB6"},
  bear:{x:0.56,yaw:0.05,outer:()=>earRound(2.1),inner:()=>earRound(1.2,0.35),innerCol:"#FFB8C9"}
};
// where the back wall is (unit section coords) at a given x - the ears are seated there
function backZ(F,xu){let lo=-Math.PI/2, hi=xu>=0?0:-Math.PI; for(let i=0;i<30;i++){const mid=(lo+hi)/2, x=fenceAt(F.R,mid)*Math.cos(mid); if(Math.abs(x)<Math.abs(xu)) lo=mid; else hi=mid} return fenceAt(F.R,lo)*Math.sin(lo)}
function buildEars(p,g,mat){
  const grp=new THREE.Group(), kind=S.ears; if(kind==="none"||!kind) return grp;
  const F=fenceTable(p), top=g.userData.topY;
  if(kind==="dog"){ // soft ears hanging down both sides from the back corners
    const geo=GEO("ear.dog",()=>{const s=new THREE.Shape(); s.moveTo(0,0); s.bezierCurveTo(1.9,-0.4,2.5,-4.2,1.5,-6.2); s.bezierCurveTo(0.8,-7.2,-0.9,-7.1,-1.4,-5.9); s.bezierCurveTo(-2.1,-4.1,-1.6,-0.4,0,0);
      const g2=new THREE.ExtrudeGeometry(s,{depth:0.9,bevelEnabled:true,bevelThickness:0.45,bevelSize:0.4,bevelSegments:6,curveSegments:28}); g2.translate(0,0,-0.45); return g2});
    const earMat=mat.clone(); earMat.color=earMat.color.clone().lerp(lin("#6B4A3A"),0.35);
    for(const sd of [-1,1]){const W=wallW(p,top-1), pivot=new THREE.Group(); pivot.position.set(sd*(W-0.7)*S.earGap,top-0.3,backZ(F,sd*0.62)*W*0.7+S.earBack); pivot.rotation.set(0,0,sd*0.55); pivot.scale.setScalar(S.earSize);
      const o=new THREE.Mesh(geo,earMat); o.scale.x=sd; o.renderOrder=2; pivot.add(o); grp.add(pivot)}
    return grp;
  }
  const E=EARS[kind], D=1.8;
  const outer=GEO("ear."+kind,()=>{const g2=new THREE.ExtrudeGeometry(E.outer(),{depth:D,bevelEnabled:true,bevelThickness:0.55,bevelSize:0.42,bevelSegments:6,curveSegments:28}); g2.translate(0,0,-D/2); return flatBase(g2)});
  const inner=GEO("ear.in."+kind,()=>{const g2=new THREE.ExtrudeGeometry(E.inner(),{depth:0.3,bevelEnabled:true,bevelThickness:0.14,bevelSize:0.12,bevelSegments:4,curveSegments:24}); g2.translate(0,0,D/2+0.45); return flatBase(g2)});
  const pink=surfMat(S.mat==="matte"?"matte":"gloss",E.innerCol);
  const y=top-(D/2+0.55), W=wallW(p,top-p.bev);               // the ear's upper face is level with the top
  for(const sd of [-1,1]){const xu=sd*E.x, pivot=new THREE.Group();
    pivot.position.set(xu*W*S.earGap,y,backZ(F,Math.max(-0.95,Math.min(0.95,xu*S.earGap)))*W+p.bev+0.4+S.earBack); pivot.scale.setScalar(S.earSize);   // 간격·앞뒤·크기 sliders           // starts inside the rounded edge, so no dip shows
    pivot.rotation.order="YXZ"; pivot.rotation.set(-Math.PI/2,sd*E.yaw,0);   // lying flat, pointing back, turned out a touch
    const o=new THREE.Mesh(outer,mat); o.renderOrder=2; pivot.add(o);
    pivot.add(new THREE.Mesh(inner,pink)); grp.add(pivot)}
  return grp;
}

/* the face, drawn in a 1024 square that maps onto the top (canvas top edge = back of the key).
   Everything is kept within 0.42 of the centre so nothing is clipped by the top's outline. */
function faceTex(f,dark){ // dark keycap: the parts themselves are white (no rim - requested); the mask / muzzle become a faint light patch
  const ink=dark?"#FFF6F9":"#3B2F37", hi=dark?"#3B2F37":"#FFFFFF"; return canvasTex(1024,1024,(b,u)=>{const fc=document.createElement("canvas"); fc.width=fc.height=u; const x=fc.getContext("2d");   // b: base layer (mask, blush), x: the parts
    for(const c of [b,x]){c.lineCap="round"; c.lineJoin="round"; c.translate(u/2,u*0.63); c.scale(1.3,1.3); c.translate(-u/2,-u*0.56)}
    const cx=u/2, ey=u*0.5, ex=u*0.18, r=u*0.052, ny=u*0.585, ex2=f.extra||[];
    const cream=dark?"rgba(255,255,255,.2)":"rgba(255,248,238,.96)";
    if(ex2.includes("fox")){b.fillStyle=cream; b.beginPath(); b.moveTo(cx-u*0.31,u*0.49); b.quadraticCurveTo(cx-u*0.17,u*0.55,cx,u*0.56); b.quadraticCurveTo(cx+u*0.17,u*0.55,cx+u*0.31,u*0.49); b.quadraticCurveTo(cx+u*0.26,u*0.74,cx,u*0.76); b.quadraticCurveTo(cx-u*0.26,u*0.74,cx-u*0.31,u*0.49); b.fill()}
    if(ex2.includes("muzzle")){b.fillStyle=cream; b.beginPath(); b.ellipse(cx,u*0.62,u*0.15,u*0.105,0,0,7); b.fill()}
    if(ex2.includes("blush")){b.fillStyle="rgba(255,120,150,.5)"; for(const s of [-1,1]){b.beginPath(); b.ellipse(cx+s*u*0.25,u*0.585,u*0.055,u*0.03,0,0,7); b.fill()}}
    if(ex2.includes("freckle")){b.fillStyle="rgba(150,90,70,.75)"; for(const s of [-1,1]) for(const [dx,dy] of [[0.22,0.57],[0.26,0.59],[0.24,0.61]]){b.beginPath(); b.arc(cx+s*u*dx,u*dy,u*0.008,0,7); b.fill()}}
    if(ex2.includes("whisker")){x.strokeStyle=ink; x.lineWidth=u*0.011;   // two short, slightly curved whiskers a side
      for(const s of [-1,1]) for(const dy of [-0.012,0.018]){x.beginPath(); x.moveTo(cx+s*u*0.21,u*(0.6+dy)); x.quadraticCurveTo(cx+s*u*0.25,u*(0.593+dy*1.3),cx+s*u*0.29,u*(0.598+dy*1.8)); x.stroke()}}
    // eyes
    const n=f.shine==="none"?0:f.shine==="one"?1:3;
    const shine=(px,py,rr)=>{x.fillStyle="#FFFFFF"; if(n>=1){x.beginPath(); x.arc(px-rr*0.3,py-rr*0.32,rr*0.3,0,7); x.fill()}
      if(n>=3){x.beginPath(); x.arc(px+rr*0.32,py+rr*0.26,rr*0.14,0,7); x.fill(); x.beginPath(); x.arc(px-rr*0.02,py+rr*0.5,rr*0.08,0,7); x.fill()} x.fillStyle=ink};
    // eye colour: a chosen colour is drawn like an anime iris - darker at the top, the colour below
    let ec=f.eyeColor; const eye=(py,R)=>{if(!ec) return dark?"#15131A":ink; const g=x.createLinearGradient(0,py-R,0,py+R); g.addColorStop(0,mixHex(ec,"#1E1A24",0.55)); g.addColorStop(0.55,ec); g.addColorStop(1,mixHex(ec,"#FFFFFF",0.25)); return g};
    const ring=()=>{if(ec||dark){x.lineWidth=u*0.006; x.strokeStyle=ink; x.stroke()}};   // a thin pale ring keeps black eyes readable on a dark keycap
    x.strokeStyle=ink;
    for(const s of [-1,1]){ec=(f.odd&&s>0)?f.eyeColor2:f.eyeColor;   // 오드아이: the eye on the right has its own colour
      const px=cx+s*ex, py=ey; x.fillStyle=eye(py,r*1.3);
      if(f.eyes==="round"){x.beginPath(); x.arc(px,py,r,0,7); x.fill(); ring(); shine(px,py,r)}
      if(f.eyes==="sparkle"){const R=r*1.42; x.fillStyle=eye(py,R); x.beginPath(); x.ellipse(px,py,R*0.92,R,0,0,7); x.fill(); ring(); shine(px,py,R)}
      if(f.eyes==="half"){ // cool half-moon: flat top, round bottom
        x.beginPath(); x.moveTo(px-r*1.2,py-r*0.4); x.lineTo(px+r*1.2,py-r*0.4); x.bezierCurveTo(px+r*1.25,py+r*1.45,px-r*1.25,py+r*1.45,px-r*1.2,py-r*0.4); x.fill(); ring(); shine(px,py+r*0.2,r*0.85)}
      if(f.eyes==="lash"){const R=r*1.35; x.fillStyle=eye(py,R); x.beginPath(); x.arc(px,py,R,0,7); x.fill(); ring(); shine(px,py,R);
        // one straight lash growing out of the outline (a flat end on the outline, so nothing pokes into the eye)
        const a=0.62, dx=s*Math.cos(a), dy=-Math.sin(a), lw=u*0.014, L=R*0.55;
        x.strokeStyle=ink; x.lineWidth=lw; x.lineCap="butt"; x.beginPath(); x.moveTo(px+dx*R*0.97,py+dy*R*0.97); x.lineTo(px+dx*(R+L),py+dy*(R+L)); x.stroke(); x.lineCap="round";
        x.fillStyle=ink; x.beginPath(); x.arc(px+dx*(R+L),py+dy*(R+L),lw/2,0,7); x.fill()}
      if(f.eyes==="up"){x.save(); x.translate(px,py); x.rotate(-s*0.38); x.beginPath(); x.ellipse(0,0,r*1.3,r*0.78,0,0,7); x.fill(); ring(); x.restore(); shine(px,py,r*0.85)}
      if(f.eyes==="down"){x.save(); x.translate(px,py); x.rotate(s*0.32); x.beginPath(); x.ellipse(0,0,r*1.18,r*0.9,0,0,7); x.fill(); ring(); x.restore(); shine(px,py,r*0.9)}
      if(f.eyes==="smile"){x.strokeStyle=ec||ink; x.lineWidth=u*0.022; x.beginPath(); x.arc(px,py+r*0.55,r*1.02,Math.PI*1.15,Math.PI*1.85); x.stroke()}
      if(f.eyes==="sleepy"){x.strokeStyle=ec||ink; x.lineWidth=u*0.02; x.beginPath(); x.arc(px,py-r*0.5,r*1.02,Math.PI*0.15,Math.PI*0.85); x.stroke()}
    }
    x.fillStyle=ink; x.strokeStyle=ink;
    // glasses: big lenses over the eyes, black frames (a dark keycap gives them the same pale rim as the other parts)
    const gk=ex2.includes("rglass")?"r":ex2.includes("sglass")?"s":"";
    if(gk){const R=u*0.107, hw=gk==="r"?R:R*1.12; x.lineWidth=u*0.016; x.strokeStyle=ink;
      for(const s of [-1,1]){const px=cx+s*ex; x.beginPath();
        if(gk==="r") x.arc(px,ey,R,0,7); else {const w=R*2.24, h=R*1.7, q=R*0.34, L=px-w/2, T=ey-h/2; x.moveTo(L+q,T); x.arcTo(L+w,T,L+w,T+h,q); x.arcTo(L+w,T+h,L,T+h,q); x.arcTo(L,T+h,L,T,q); x.arcTo(L,T,L+w,T,q); x.closePath()}
        x.stroke()}   // no temples (arms) - just the two lenses and the bridge
      x.beginPath(); x.moveTo(cx-ex+hw,ey-R*0.12); x.quadraticCurveTo(cx,ey-R*0.5,cx+ex-hw,ey-R*0.12); x.stroke()}
    if(ex2.includes("mole")){x.fillStyle=ink; x.beginPath(); x.arc(cx+ex+r*1.5,ey+r*1.35,u*0.009,0,7); x.fill()}
    // nose
    const nz=f.nose;
    if(nz==="tri"){x.fillStyle="#FF8FA8"; x.beginPath(); x.moveTo(cx-u*0.03,ny-u*0.012); x.quadraticCurveTo(cx,ny-u*0.022,cx+u*0.03,ny-u*0.012); x.quadraticCurveTo(cx+u*0.004,ny+u*0.024,cx,ny+u*0.026); x.quadraticCurveTo(cx-u*0.004,ny+u*0.024,cx-u*0.03,ny-u*0.012); x.fill()}
    if(nz==="dot"||nz==="big"){const k=nz==="big"?1.45:1; x.fillStyle=ink; x.beginPath(); x.ellipse(cx,ny,u*0.034*k,u*0.024*k,0,0,7); x.fill(); x.fillStyle=dark?"rgba(59,47,55,.8)":"rgba(255,255,255,.8)"; x.beginPath(); x.ellipse(cx-u*0.01*k,ny-u*0.009*k,u*0.01*k,u*0.006*k,0,0,7); x.fill()}
    if(nz==="heart"){x.fillStyle="#FF8FA8"; heart(x,cx,ny+u*0.004,u*0.026); x.fill()}
    if(nz==="pig"){const W=u*0.09, Hh=u*0.064, py=ny+u*0.014; x.fillStyle="#FF9FB6"; x.strokeStyle="#E0708F"; x.lineWidth=u*0.008;
      x.beginPath(); x.ellipse(cx,py,W,Hh,0,0,7); x.fill(); x.stroke(); x.fillStyle="#C24E72";
      for(const s2 of [-1,1]){x.beginPath(); x.ellipse(cx+s2*W*0.38,py,W*0.16,Hh*0.36,0,0,7); x.fill()} x.strokeStyle=ink}
    if(nz==="bean"){x.fillStyle=ink; x.beginPath(); x.ellipse(cx,ny,u*0.013,u*0.01,0,0,7); x.fill()}
    // mouth: its top joins the nose
    x.lineWidth=u*0.014; x.strokeStyle=ink; x.fillStyle=ink;
    const m=f.mouth, top=ny+(nz==="pig"?u*0.084:nz==="big"?u*0.04:u*0.028);   // the mouth sits under the snout
    const omega=()=>{x.beginPath(); x.arc(cx-u*0.028,top+u*0.004,u*0.028,Math.PI*0.05,Math.PI*0.95); x.stroke(); x.beginPath(); x.arc(cx+u*0.028,top+u*0.004,u*0.028,Math.PI*0.05,Math.PI*0.95); x.stroke()};
    if(m==="w") omega();
    if(m==="bunny"){x.beginPath(); x.moveTo(cx,top-u*0.004); x.lineTo(cx,top+u*0.02); x.moveTo(cx,top+u*0.02); x.quadraticCurveTo(cx-u*0.02,top+u*0.045,cx-u*0.045,top+u*0.035); x.moveTo(cx,top+u*0.02); x.quadraticCurveTo(cx+u*0.02,top+u*0.045,cx+u*0.045,top+u*0.035); x.stroke()}
    if(m==="caret"){x.beginPath(); x.moveTo(cx-u*0.03,top+u*0.03); x.lineTo(cx,top+u*0.005); x.lineTo(cx+u*0.03,top+u*0.03); x.stroke()}
    if(m==="line"){x.beginPath(); x.moveTo(cx-u*0.035,top+u*0.022); x.lineTo(cx+u*0.035,top+u*0.022); x.stroke()}
    if(m==="smile"){x.beginPath(); x.arc(cx,top-u*0.01,u*0.05,Math.PI*0.2,Math.PI*0.8); x.stroke()}
    if(m==="open"){ // an open mouth whose top edge is the ω
      const L=cx-u*0.056, R=cx+u*0.056, yT=top+u*0.02;
      x.beginPath(); x.moveTo(L,yT); x.quadraticCurveTo(cx-u*0.042,top+u*0.034,cx-u*0.028,top+u*0.032); x.quadraticCurveTo(cx-u*0.006,top+u*0.028,cx,top+u*0.004);
      x.quadraticCurveTo(cx+u*0.006,top+u*0.028,cx+u*0.028,top+u*0.032); x.quadraticCurveTo(cx+u*0.042,top+u*0.034,R,yT);
      x.quadraticCurveTo(R-u*0.004,top+u*0.098,cx,top+u*0.1); x.quadraticCurveTo(L+u*0.004,top+u*0.098,L,yT); x.fill();
      x.fillStyle="#FF8FA3"; x.beginPath(); x.ellipse(cx,top+u*0.078,u*0.028,u*0.018,0,0,7); x.fill(); x.fillStyle=ink;
      omega()}
    b.setTransform(1,0,0,1,0,0);
    b.drawImage(fc,0,0);
  },true);
}
const hasFace=()=>S.eyes!=="none"||S.nose!=="none"||S.mouth!=="none"||(S.extra&&S.extra.length);
function faceDark(){const c=new THREE.Color(S.color); return (0.299*c.r+0.587*c.g+0.114*c.b)<0.4}   // dark keycap: parts get a pale rim
function buildFace(p,g){
  const sec=g.userData.sec, w=g.userData.topW*0.96, shape=new THREE.Shape(); sec.forEach(([ux,uz],i)=>{const X=ux*w, Y=-uz*w; i?shape.lineTo(X,Y):shape.moveTo(X,Y)});
  const sg=new THREE.ShapeGeometry(shape,1), pos=sg.attributes.position, uv=[]; for(let i=0;i<pos.count;i++) uv.push(pos.getX(i)/(2*w)+0.5,pos.getY(i)/(2*w)+0.5); sg.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2)); sg.rotateX(-Math.PI/2);
  const t=faceTexCached();
  // no depth write, drawn after the cap: otherwise the resin stops at a hard, stair-stepped line around every part
  const m=new THREE.Mesh(sg,new THREE.MeshPhysicalMaterial({map:t,transparent:true,depthWrite:false,roughness:0.3,clearcoat:0.6,polygonOffset:true,polygonOffsetFactor:-6}));
  m.renderOrder=3; m.position.y=g.userData.topY+0.06; return m;
}
/* Soft edges: the empty pixels of a canvas are transparent BLACK, and texture filtering mixes that black into the
   edge of every part (a dark, jagged rim). Here each empty pixel takes the colour of the nearest drawn one (alpha
   stays 0), spread out 31 px with a few jump-flood passes, so filtering and mipmaps only ever blend in the right colour. */
const FACE_TEX=new Map();   // every rebuild (any option) remakes the face mesh; the picture is only redrawn when the face changes
function faceTexCached(){
  const dark=faceDark(), key=[dark,S.eyes,S.shine,S.nose,S.mouth,S.extra.slice().sort().join("."),S.eyeColor,S.odd?S.eyeColor2:"-"].join("|");
  let t=FACE_TEX.get(key); if(t){FACE_TEX.delete(key); FACE_TEX.set(key,t); return t}
  t=keep(bleedTex(faceTex(S,dark))); FACE_TEX.set(key,t);
  if(FACE_TEX.size>6){const [k0,old]=FACE_TEX.entries().next().value; FACE_TEX.delete(k0); KEEP.delete(old); old.dispose()}
  return t;
}
function bleedTex(ct){
  const c=ct.image, W=c.width, H=c.height, src=c.getContext("2d").getImageData(0,0,W,H).data; ct.dispose();
  const out=new Uint8Array(W*H*4), near=new Int32Array(W*H).fill(-1);
  for(let i=0;i<W*H;i++) if(src[i*4+3]>0) near[i]=i;
  for(const st of [16,8,4,2,1]) for(let y=0;y<H;y++) for(let x=0;x<W;x++){const i=y*W+x; if(near[i]>=0) continue;
    for(let dy=-st;dy<=st;dy+=st) for(let dx=-st;dx<=st;dx+=st){const X=x+dx, Y=y+dy; if(X<0||Y<0||X>=W||Y>=H) continue; const n=near[Y*W+X]; if(n>=0){near[i]=n; dy=dx=st+1}}}
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){const i=y*W+x, o=((H-1-y)*W+x)*4, n=near[i]>=0?near[i]:i;   // rows flipped: a DataTexture isn't
    out[o]=src[n*4]; out[o+1]=src[n*4+1]; out[o+2]=src[n*4+2]; out[o+3]=src[i*4+3]}
  const t=new THREE.DataTexture(out,W,H,THREE.RGBAFormat); t.encoding=THREE.sRGBEncoding;
  t.magFilter=THREE.LinearFilter; t.minFilter=THREE.LinearMipmapLinearFilter; t.generateMipmaps=true; t.anisotropy=8; t.needsUpdate=true; return t;
}

/* the face tab */
function renderFaceUI(){
  const box=$("animalChips"); box.innerHTML="";
  for(const [k,a] of Object.entries(ANIMALS)){const b=document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=a.name;
    b.addEventListener("click",()=>{Object.assign(S,{ears:a.ears,eyes:a.eyes,shine:a.shine,nose:a.nose,mouth:a.mouth,extra:a.extra.slice(),color:a.color,eyeColor:"",odd:false}); renderUI(); renderFaceUI(); rebuild()}); box.appendChild(b)}
  for(const k of FACE_KEYS) chipGroup(k+"Chips",k,OPT[k]);
  let earJob=0; for(const [id,key,div] of [["earGap","earGap",100],["earBack","earBack",10],["earSize","earSize",100]]){const el=$(id); el.value=Math.round(S[key]*div);
    el.oninput=()=>{S[key]=(+el.value)/div; if(!earJob) earJob=requestAnimationFrame(()=>{earJob=0; rebuild()})}}
  const EYE_COLS=["","#5A3A2E","#3E6FD8","#3FA36B","#9A5BE0","#E0457B","#E0A03A","#D8323C","#8FD3FF"];
  swatches("eyeSw","eyeColor",EYE_COLS); swatches("eyeSw2","eyeColor2",EYE_COLS); oddUI();
  const el=$("extraChips"); el.innerHTML="";
  for(const k of Object.keys(OPT.extra)){const b=document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=OPT.extra[k]; b.setAttribute("aria-pressed",String(S.extra.includes(k)));
    b.addEventListener("click",()=>{const i=S.extra.indexOf(k); if(i>=0) S.extra.splice(i,1); else {S.extra.push(k); const other={rglass:"sglass",sglass:"rglass"}[k]; if(other&&S.extra.includes(other)){S.extra.splice(S.extra.indexOf(other),1); renderFaceUI()}} b.setAttribute("aria-pressed",String(i<0)); rebuild()}); el.appendChild(b)}
  $("faceClear").onclick=()=>{Object.assign(S,{ears:"none",eyes:"none",nose:"none",mouth:"none",extra:[],eyeColor:"",odd:false,earGap:1,earBack:0,earSize:1}); renderFaceUI(); rebuild()};
  $("oddBtn").onclick=()=>{S.odd=!S.odd; if(S.odd&&S.eyeColor2===S.eyeColor) S.eyeColor2=S.eyeColor==="#3E6FD8"?"#E0A03A":"#3E6FD8"; renderFaceUI(); rebuild()};
}
function oddUI(){const b=$("oddBtn"); b.setAttribute("aria-pressed",String(S.odd)); b.textContent=S.odd?"👀 오드아이 켜짐":"👀 오드아이"; $("oddBox").hidden=!S.odd;
  $("eyeLab").textContent=S.odd?"왼쪽 눈 색":"눈 색"}
function showTab(face){$("paneMain").hidden=face; $("paneFace").hidden=!face; $("tabMain").setAttribute("aria-selected",String(!face)); $("tabFace").setAttribute("aria-selected",String(face))}
$("tabMain").addEventListener("click",()=>showTab(false)); $("tabFace").addEventListener("click",()=>showTab(true));
readHash(); if(S.glow&&!S.bgImg) S.bg="glow"; loadPack(S.sw); setBg(); renderUI(); renderFaceUI(); glowLabel(); rebuild();   // sounds start downloading right away (tiny files)
if(!DESK) setTimeout(warmUp,300);   // the desktop keycap never changes its look - no warm-up (memory, start-up CPU)
