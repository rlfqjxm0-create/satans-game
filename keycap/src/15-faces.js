/* ---------- 얼굴 만들기: ears + a face drawn on the flat top ----------
   The face is drawn on a canvas and laid on the top like the top print; its "up" is the back of the key
   (-z), so the ears grow out of the BACK WALL there, pointing backwards and tilted up - not stuck into the
   top. Every part is a preset (OPT.ears/eyes/shine/nose/mouth/extra); ANIMALS fills them all in one tap. */
Object.assign(OPT,{
  ears:{none:"없음",cat:"고양이",bunny:"토끼",fox:"여우",wolf:"늑대",bear:"곰",dog:"강아지"},
  eyes:{none:"없음",round:"동글",sparkle:"초롱",half:"반달",lash:"속눈썹",up:"올라간",down:"내려간",smile:"웃는",sleepy:"졸린"},
  shine:{many:"반짝반짝",one:"하나",none:"없음"},
  nose:{none:"없음",tri:"분홍 세모",dot:"까만 동글",heart:"하트",bean:"콩",big:"큰 코"},
  mouth:{none:"없음",w:"ω",bunny:"ㅅ",caret:"^",line:"一",smile:"웃는",open:"활짝"},
  extra:{whisker:"수염",blush:"홍조",freckle:"주근깨",mole:"점",fox:"여우 무늬",muzzle:"동그란 주둥이"}
});
const FACE_KEYS=["ears","eyes","shine","nose","mouth"];
const ANIMALS={
  cat:{name:"고양이",color:"#FFD6E5",ears:"cat",eyes:"round",shine:"many",nose:"tri",mouth:"w",extra:["whisker","blush"]},
  bunny:{name:"토끼",color:"#FFFFFF",ears:"bunny",eyes:"sparkle",shine:"many",nose:"tri",mouth:"bunny",extra:["blush"]},
  fox:{name:"여우",color:"#FFA25C",ears:"fox",eyes:"up",shine:"one",nose:"dot",mouth:"caret",extra:["fox"]},
  dog:{name:"강아지",color:"#F2D2A9",ears:"dog",eyes:"sparkle",shine:"many",nose:"big",mouth:"open",extra:["muzzle","blush"]},
  wolf:{name:"늑대",color:"#B8C0CC",ears:"wolf",eyes:"half",shine:"one",nose:"dot",mouth:"line",extra:["fox"]},
  bear:{name:"곰",color:"#C8946A",ears:"bear",eyes:"round",shine:"many",nose:"dot",mouth:"w",extra:["muzzle","blush"]}
};

/* ears: built flat in XY (base on y=0), then turned so they point backwards and tilt up by `tilt` */
const earPoint=(w,h,y0)=>{const s=new THREE.Shape(); y0=y0||0; s.moveTo(-w,y0); s.quadraticCurveTo(-w*0.8,y0+h*0.58,-0.26,y0+h*0.96); s.quadraticCurveTo(0,y0+h*1.05,0.26,y0+h*0.96); s.quadraticCurveTo(w*0.8,y0+h*0.58,w,y0); s.lineTo(-w,y0); return s};
const earLong=(w,h,y0)=>{const s=new THREE.Shape(); y0=y0||0; s.moveTo(-w*0.8,y0); s.bezierCurveTo(-w*1.3,y0+h*0.36,-w*1.2,y0+h,0,y0+h); s.bezierCurveTo(w*1.2,y0+h,w*1.3,y0+h*0.36,w*0.8,y0); s.lineTo(-w*0.8,y0); return s};
const earRound=(r,y0)=>{const s=new THREE.Shape(); y0=y0||0; s.moveTo(-r,y0); s.bezierCurveTo(-r*1.25,y0+r*1.55,r*1.25,y0+r*1.55,r,y0); s.lineTo(-r,y0); return s};
const EARS={
  cat:{x:0.52,tilt:0.95,yaw:0.12,outer:()=>earPoint(2.4,5.2),inner:()=>earPoint(1.25,3.7,0.8),innerCol:"#FFB8C9"},
  fox:{x:0.52,tilt:0.95,yaw:0.14,outer:()=>earPoint(2.8,6),inner:()=>earPoint(1.2,3.8,1.1),innerCol:"#FFE2CC"},
  wolf:{x:0.5,tilt:1.0,yaw:0.1,outer:()=>earPoint(2.2,6.2),inner:()=>earPoint(0.95,4,1.1),innerCol:"#EDE7F2"},
  bunny:{x:0.36,tilt:1.15,yaw:0,outer:()=>earLong(1.7,8.4),inner:()=>earLong(0.9,6.4,1),innerCol:"#FFB8C9"},
  bear:{x:0.56,tilt:0.9,yaw:0.05,outer:()=>earRound(2.1),inner:()=>earRound(1.2,0.35),innerCol:"#FFB8C9"}
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
    for(const sd of [-1,1]){const W=wallW(p,top-1), pivot=new THREE.Group(); pivot.position.set(sd*(W-0.7),top-0.3,backZ(F,sd*0.62)*W*0.7); pivot.rotation.set(0,0,sd*0.55);
      const o=new THREE.Mesh(geo,earMat); o.scale.x=sd; o.renderOrder=2; pivot.add(o); grp.add(pivot)}
    return grp;
  }
  const E=EARS[kind], D=1.8;
  const outer=GEO("ear."+kind,()=>{const g2=new THREE.ExtrudeGeometry(E.outer(),{depth:D,bevelEnabled:true,bevelThickness:0.55,bevelSize:0.42,bevelSegments:6,curveSegments:28}); g2.translate(0,0,-D/2); return flatBase(g2)});
  const inner=GEO("ear.in."+kind,()=>{const g2=new THREE.ExtrudeGeometry(E.inner(),{depth:0.3,bevelEnabled:true,bevelThickness:0.14,bevelSize:0.12,bevelSegments:4,curveSegments:24}); g2.translate(0,0,D/2+0.45); return flatBase(g2)});
  const pink=surfMat(S.mat==="matte"?"matte":"gloss",E.innerCol);
  const y=top-Math.min(p.bev*0.7,1.1), W=wallW(p,y);            // just under the rounded top edge, on the wall
  for(const sd of [-1,1]){const xu=sd*E.x, pivot=new THREE.Group();
    pivot.position.set(xu*W,y,backZ(F,xu)*W+0.35);              // a little into the wall, so it's attached everywhere
    pivot.rotation.order="YXZ"; pivot.rotation.set(-(Math.PI/2-E.tilt),sd*E.yaw,0);   // point backwards, tilt up, turn out a touch
    const o=new THREE.Mesh(outer,mat); o.renderOrder=2; pivot.add(o);
    pivot.add(new THREE.Mesh(inner,pink)); grp.add(pivot)}
  return grp;
}

/* the face, drawn in a 1024 square that maps onto the top (canvas top edge = back of the key).
   Everything is kept within 0.42 of the centre so nothing is clipped by the top's outline. */
function faceTex(f,ink){
  return canvasTex(1024,1024,(x,u)=>{x.lineCap="round"; x.lineJoin="round";
    x.translate(u/2,u*0.63); x.scale(1.3,1.3); x.translate(-u/2,-u*0.56);
    const cx=u/2, ey=u*0.5, ex=u*0.18, r=u*0.052, ny=u*0.585, ex2=f.extra||[];
    const cream="rgba(255,248,238,.96)";
    if(ex2.includes("fox")){x.fillStyle=cream; x.beginPath(); x.moveTo(cx-u*0.31,u*0.49); x.quadraticCurveTo(cx-u*0.17,u*0.55,cx,u*0.56); x.quadraticCurveTo(cx+u*0.17,u*0.55,cx+u*0.31,u*0.49); x.quadraticCurveTo(cx+u*0.26,u*0.74,cx,u*0.76); x.quadraticCurveTo(cx-u*0.26,u*0.74,cx-u*0.31,u*0.49); x.fill()}
    if(ex2.includes("muzzle")){x.fillStyle=cream; x.beginPath(); x.ellipse(cx,u*0.62,u*0.15,u*0.105,0,0,7); x.fill()}
    if(ex2.includes("blush")){x.fillStyle="rgba(255,120,150,.5)"; for(const s of [-1,1]){x.beginPath(); x.ellipse(cx+s*u*0.25,u*0.585,u*0.055,u*0.03,0,0,7); x.fill()}}
    if(ex2.includes("freckle")){x.fillStyle="rgba(150,90,70,.75)"; for(const s of [-1,1]) for(const [dx,dy] of [[0.22,0.57],[0.26,0.59],[0.24,0.61]]){x.beginPath(); x.arc(cx+s*u*dx,u*dy,u*0.008,0,7); x.fill()}}
    if(ex2.includes("whisker")){x.strokeStyle=ink; x.lineWidth=u*0.011;   // two short, slightly curved whiskers a side
      for(const s of [-1,1]) for(const dy of [-0.012,0.018]){x.beginPath(); x.moveTo(cx+s*u*0.21,u*(0.6+dy)); x.quadraticCurveTo(cx+s*u*0.25,u*(0.593+dy*1.3),cx+s*u*0.29,u*(0.598+dy*1.8)); x.stroke()}}
    // eyes
    const n=f.shine==="none"?0:f.shine==="one"?1:3;
    const shine=(px,py,rr)=>{x.fillStyle="#FFFFFF"; if(n>=1){x.beginPath(); x.arc(px-rr*0.3,py-rr*0.32,rr*0.3,0,7); x.fill()}
      if(n>=3){x.beginPath(); x.arc(px+rr*0.32,py+rr*0.26,rr*0.14,0,7); x.fill(); x.beginPath(); x.arc(px-rr*0.02,py+rr*0.5,rr*0.08,0,7); x.fill()} x.fillStyle=ink};
    // eye colour: a chosen colour is drawn like an anime iris - darker at the top, the colour below
    const ec=f.eyeColor, eye=(py,R)=>{if(!ec) return ink; const g=x.createLinearGradient(0,py-R,0,py+R); g.addColorStop(0,mixHex(ec,"#1E1A24",0.55)); g.addColorStop(0.55,ec); g.addColorStop(1,mixHex(ec,"#FFFFFF",0.25)); return g};
    const ring=()=>{if(ec){x.lineWidth=u*0.006; x.strokeStyle=ink; x.stroke()}};
    x.strokeStyle=ink;
    for(const s of [-1,1]){const px=cx+s*ex, py=ey; x.fillStyle=eye(py,r*1.3);
      if(f.eyes==="round"){x.beginPath(); x.arc(px,py,r,0,7); x.fill(); ring(); shine(px,py,r)}
      if(f.eyes==="sparkle"){const R=r*1.42; x.fillStyle=eye(py,R); x.beginPath(); x.ellipse(px,py,R*0.92,R,0,0,7); x.fill(); ring(); shine(px,py,R)}
      if(f.eyes==="half"){ // cool half-moon: flat top, round bottom
        x.beginPath(); x.moveTo(px-r*1.2,py-r*0.4); x.lineTo(px+r*1.2,py-r*0.4); x.bezierCurveTo(px+r*1.25,py+r*1.45,px-r*1.25,py+r*1.45,px-r*1.2,py-r*0.4); x.fill(); ring(); shine(px,py+r*0.2,r*0.85)}
      if(f.eyes==="lash"){x.beginPath(); x.arc(px,py,r,0,7); x.fill(); ring(); shine(px,py,r);
        x.strokeStyle=ink; x.lineWidth=u*0.013; x.beginPath(); x.moveTo(px+s*r*0.62,py-r*0.72); x.quadraticCurveTo(px+s*r*1.25,py-r*1.2,px+s*r*1.55,py-r*1.08); x.stroke()}
      if(f.eyes==="up"){x.save(); x.translate(px,py); x.rotate(-s*0.38); x.beginPath(); x.ellipse(0,0,r*1.3,r*0.78,0,0,7); x.fill(); ring(); x.restore(); shine(px,py,r*0.85)}
      if(f.eyes==="down"){x.save(); x.translate(px,py); x.rotate(s*0.32); x.beginPath(); x.ellipse(0,0,r*1.18,r*0.9,0,0,7); x.fill(); ring(); x.restore(); shine(px,py,r*0.9)}
      if(f.eyes==="smile"){x.strokeStyle=ec||ink; x.lineWidth=u*0.022; x.beginPath(); x.arc(px,py+r*0.55,r*1.02,Math.PI*1.15,Math.PI*1.85); x.stroke()}
      if(f.eyes==="sleepy"){x.strokeStyle=ec||ink; x.lineWidth=u*0.02; x.beginPath(); x.arc(px,py-r*0.5,r*1.02,Math.PI*0.15,Math.PI*0.85); x.stroke()}
    }
    x.fillStyle=ink; x.strokeStyle=ink;
    if(ex2.includes("mole")){x.fillStyle=ink; x.beginPath(); x.arc(cx+ex+r*1.5,ey+r*1.35,u*0.009,0,7); x.fill()}
    // nose
    const nz=f.nose;
    if(nz==="tri"){x.fillStyle="#FF8FA8"; x.beginPath(); x.moveTo(cx-u*0.03,ny-u*0.012); x.quadraticCurveTo(cx,ny-u*0.022,cx+u*0.03,ny-u*0.012); x.quadraticCurveTo(cx+u*0.004,ny+u*0.024,cx,ny+u*0.026); x.quadraticCurveTo(cx-u*0.004,ny+u*0.024,cx-u*0.03,ny-u*0.012); x.fill()}
    if(nz==="dot"||nz==="big"){const k=nz==="big"?1.45:1; x.fillStyle=ink; x.beginPath(); x.ellipse(cx,ny,u*0.034*k,u*0.024*k,0,0,7); x.fill(); x.fillStyle="rgba(255,255,255,.8)"; x.beginPath(); x.ellipse(cx-u*0.01*k,ny-u*0.009*k,u*0.01*k,u*0.006*k,0,0,7); x.fill()}
    if(nz==="heart"){x.fillStyle="#FF8FA8"; heart(x,cx,ny+u*0.004,u*0.026); x.fill()}
    if(nz==="bean"){x.fillStyle=ink; x.beginPath(); x.ellipse(cx,ny,u*0.013,u*0.01,0,0,7); x.fill()}
    // mouth: its top joins the nose
    x.lineWidth=u*0.014; x.strokeStyle=ink; x.fillStyle=ink;
    const m=f.mouth, top=ny+(nz==="big"?u*0.04:u*0.028);
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
  },true);
}
const hasFace=()=>S.eyes!=="none"||S.nose!=="none"||S.mouth!=="none"||(S.extra&&S.extra.length);
function faceInk(){const c=new THREE.Color(S.color); return (0.299*c.r+0.587*c.g+0.114*c.b)<0.4?"#FFF4F8":"#3B2F37"}   // pale lines on dark keycaps
function buildFace(p,g){
  const sec=g.userData.sec, w=g.userData.topW*0.96, shape=new THREE.Shape(); sec.forEach(([ux,uz],i)=>{const X=ux*w, Y=-uz*w; i?shape.lineTo(X,Y):shape.moveTo(X,Y)});
  const sg=new THREE.ShapeGeometry(shape,1), pos=sg.attributes.position, uv=[]; for(let i=0;i<pos.count;i++) uv.push(pos.getX(i)/(2*w)+0.5,pos.getY(i)/(2*w)+0.5); sg.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2)); sg.rotateX(-Math.PI/2);
  const t=faceTex(S,faceInk()); t.anisotropy=8;
  const m=new THREE.Mesh(sg,new THREE.MeshPhysicalMaterial({map:t,transparent:true,alphaTest:0.02,roughness:0.3,clearcoat:0.6,polygonOffset:true,polygonOffsetFactor:-6}));
  m.position.y=g.userData.topY+0.06; return m;
}

/* the face tab */
function renderFaceUI(){
  const box=$("animalChips"); box.innerHTML="";
  for(const [k,a] of Object.entries(ANIMALS)){const b=document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=a.name;
    b.addEventListener("click",()=>{Object.assign(S,{ears:a.ears,eyes:a.eyes,shine:a.shine,nose:a.nose,mouth:a.mouth,extra:a.extra.slice(),color:a.color}); renderUI(); renderFaceUI(); rebuild()}); box.appendChild(b)}
  for(const k of FACE_KEYS) chipGroup(k+"Chips",k,OPT[k]);
  swatches("eyeSw","eyeColor",["","#5A3A2E","#3E6FD8","#3FA36B","#9A5BE0","#E0457B","#E0A03A","#D8323C","#8FD3FF"]);
  const el=$("extraChips"); el.innerHTML="";
  for(const k of Object.keys(OPT.extra)){const b=document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=OPT.extra[k]; b.setAttribute("aria-pressed",String(S.extra.includes(k)));
    b.addEventListener("click",()=>{const i=S.extra.indexOf(k); if(i>=0) S.extra.splice(i,1); else S.extra.push(k); b.setAttribute("aria-pressed",String(i<0)); rebuild()}); el.appendChild(b)}
  $("faceClear").onclick=()=>{Object.assign(S,{ears:"none",eyes:"none",nose:"none",mouth:"none",extra:[],eyeColor:""}); renderFaceUI(); rebuild()};
}
function showTab(face){$("paneMain").hidden=face; $("paneFace").hidden=!face; $("tabMain").setAttribute("aria-selected",String(!face)); $("tabFace").setAttribute("aria-selected",String(face))}
$("tabMain").addEventListener("click",()=>showTab(false)); $("tabFace").addEventListener("click",()=>showTab(true));
readHash(); loadPack(S.sw); setBg(); renderUI(); renderFaceUI(); glowLabel(); rebuild();   // sounds start downloading right away (tiny files)
setTimeout(warmUp,300);
