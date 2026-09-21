/* ---------- math ---------- */
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x;
const lerp=(a,b,k)=>a+(b-a)*k;
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const easeOut=x=>{x=clamp(x);return 1-(1-x)*(1-x)*(1-x)};
const easeBack=x=>{x=clamp(x);const c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const HC=new Map(); function hash(i){if(HC.has(i)) return HC.get(i); const v=mulberry32(i*9973+17)(); HC.set(i,v); return v}

/* ---------- drum ---------- */
function omega(t){
  if(t<1.0) return 0;
  if(t<1.25) return 3.4*ease((t-1)/.25);
  if(t<2.05) return 3.4;
  if(t<2.35) return 3.4*Math.cos(Math.PI*(t-2.05)/.3);
  if(t<3.3) return -3.4;
  if(t<3.6) return lerp(-3.4,14,ease((t-3.3)/.3));
  if(t<4.3) return 14;
  if(t<4.9) return 14*(1-ease((t-4.3)/.6));
  return 0;
}
const ANG=(()=>{const dt=1/240, n=Math.ceil(12/dt); const a=new Float64Array(n+1); for(let i=1;i<=n;i++){a[i]=a[i-1]+(omega((i-1)*dt)+omega(i*dt))/2*dt} return a})();
function drumAngle(t){if(t<=0) return 0; const f=t*240, i=Math.floor(f); if(i>=ANG.length-1) return ANG[ANG.length-1]; return lerp(ANG[i],ANG[i+1],f-i)}
function waterLevel(t){if(t<0.4) return 0; if(t<1.0) return 0.42*ease((t-.4)/.6); if(t<3.3) return 0.42; if(t<3.9) return 0.42*(1-ease((t-3.3)/.6)); return 0}
