// headless proof that glitter never leaves the cap: node sim_check.js  (run from keycap/)
const fs=require('fs'); const html=fs.readFileSync('index.html','utf8');
const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const grab=re=>{const m=js.match(re); if(!m) throw new Error('missing '+re); return m[0]};
const src=[/function section\(kind,n,M\)\{[\s\S]*?\n\}/,/const PROFILES=\{[\s\S]*?\n\};/,/const GLITTERS=\{[\s\S]*?\n\};/,/const GLIT_R=\{[^\n]*/,
  /const FENCE_N=180[\s\S]*?(?=\nfunction makeParticles)/,/function makeParticles\(p,g\)\{[\s\S]*?\n\}/,
  /function stirParticles\(\)\{[^\n]*/,/function stepParticles\(dt,t\)\{[\s\S]*?\n\}/].map(grab).join('\n');
const pre=`const lerp=(a,b,t)=>a+(b-a)*t; const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hash=i=>mulberry32(i*9973+17)(); const lin=h=>h; const keep=o=>o;
function Col(){this.setScalar=()=>this; this.copy=()=>this} const THREE={Color:Col,
  InstancedMesh:function(){this.setMatrixAt=()=>{}; this.setColorAt=()=>{this.instanceColor=this.instanceColor||{}}; this.instanceMatrix={}},
  Object3D:function(){const v={set(){}};this.position=v;this.rotation=v;this.scale={setScalar(){}};this.updateMatrix=()=>{}}};
const glitterGeo=()=>0, glitterMat=()=>0, glowMat=()=>0, GLOW_PLANE=0;
const S={glitter:"star",mat:"resin",charPos:"inside",glitColor:"",glow:false}; let partSys=null;`;
eval(pre+src+`
function distToPoly(px,pz,sec,w){let d=Infinity; for(let i=0;i<sec.length;i++){const x1=sec[i][0]*w,z1=sec[i][1]*w,x2=sec[(i+1)%sec.length][0]*w,z2=sec[(i+1)%sec.length][1]*w; const ex=x2-x1,ez=z2-z1; let t=((px-x1)*ex+(pz-z1)*ez)/(ex*ex+ez*ez); t=Math.max(0,Math.min(1,t)); d=Math.min(d,Math.hypot(px-(x1+t*ex),pz-(z1+t*ez)))} return d}
function inside(px,pz,sec,w){let c=false; for(let i=0,j=sec.length-1;i<sec.length;j=i++){const xi=sec[i][0]*w,zi=sec[i][1]*w,xj=sec[j][0]*w,zj=sec[j][1]*w; if(((zi>pz)!==(zj>pz))&&(px<(xj-xi)*(pz-zi)/(zj-zi)+xi)) c=!c} return c}
let bad=0;
for(const charPos of ["inside","top"]) for(const glit of Object.keys(GLITTERS)) for(const [name,p] of Object.entries(PROFILES)){S.glitter=glit; S.charPos=charPos;
  partSys=makeParticles(p,null); const G=GLITTERS[glit], flat=charPos!=="inside", fr=GLIT_R[G.shape]*G.scale*1.15;
  const secs=p.sec==="heart"?[section("heart",0,96)]:[section("se",p.n0,96),section("se",p.n1,96)], F=fenceTable(p);
  let side=0, topHit=0, bottom=0, minGap=Infinity, minTop=Infinity;
  for(let f=0;f<3000;f++){ if(f%20===0) stirParticles(); stepParticles(1/60,f/60);
    const {pos,rot,N,rad}=partSys; for(let i=0;i<N;i++){const x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2], w=wallW(p,y);
      const ny=-Math.sin(rot[i*3])*Math.cos(rot[i*3+1]), hv=G.shape==="pearl"?rad:rad*Math.sqrt(Math.max(0,1-ny*ny))+0.1*G.scale*0.9;
      for(const sec of secs){ if(!inside(x,z,sec,w)){side++; continue} const d=distToPoly(x,z,sec,w); if(d<fr) side++; minGap=Math.min(minGap,d-fr) }
      const R=fenceAt(F.R,Math.atan2(z,x))*p.tw/2, surf=capTopY(p,flat,Math.hypot(x,z)/R); if(y+hv>surf) topHit++; minTop=Math.min(minTop,surf-(y+hv));
      if(y-hv<0) bottom++}}
  const ok=!side&&!topHit&&!bottom; if(!ok) bad++;
  console.log((ok?"OK  ":"FAIL")+" "+charPos.padEnd(6)+glit.padEnd(9)+name.padEnd(7)+" side:"+side+" top:"+topHit+" bottom:"+bottom+"  closest wall "+minGap.toFixed(2)+"  closest top "+minTop.toFixed(2))}
console.log(bad?bad+" combinations FAILED":"all combinations stayed inside");
`);
