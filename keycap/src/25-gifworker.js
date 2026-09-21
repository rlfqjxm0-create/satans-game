/* ---------- GIF encoding in a Web Worker ----------
   Colour-matching and compressing every frame used to run on the page itself, so the whole page froze
   while a GIF was being made. The worker gets the same gifenc code this page already carries (read from
   its own <script>), so nothing extra is downloaded. Returns null when workers aren't available; the
   caller then encodes on the page as before. The same helper lives in laundry/index.html. */
function gifWorkerMain(){ // runs inside the worker
  let gif=null,pal=null,TI=0,prev=null,W=0,H=0,delay=60,first=true;
  onmessage=e=>{const m=e.data;
    if(m.t==="start"){pal=gifenc.quantize(m.sample,255,{format:"rgb565"}); TI=pal.length; gif=gifenc.GIFEncoder(); prev=null; W=m.W; H=m.H; delay=m.delay; first=true; postMessage({t:"started"})}
    else if(m.t==="frame"){const idx=gifenc.applyPalette(m.px,pal,"rgb565"); let out=idx;
      if(prev){out=new Uint8Array(idx.length); for(let i=0;i<idx.length;i++) out[i]=idx[i]===prev[i]?TI:idx[i]}
      gif.writeFrame(out,W,H,first?{palette:pal.concat([[0,0,0]]),delay,dispose:1}:{delay,transparent:true,transparentIndex:TI,dispose:1}); first=false; prev=idx; postMessage({t:"frame"})}
    else if(m.t==="finish"){gif.finish(); const b=gif.bytes(); postMessage({t:"bytes",bytes:b},[b.buffer])}};
}
function gifWorker(onFrame){
  try{
    const src=[...document.scripts].map(s=>s.textContent).find(t=>t.trim().startsWith("/* gifenc"));
    if(!src||!window.Worker||!window.Blob) return null;
    const url=URL.createObjectURL(new Blob(["self.window=self;\n"+src+"\n("+gifWorkerMain.toString()+")();\n"],{type:"text/javascript"}));
    const w=new Worker(url); URL.revokeObjectURL(url);
    let fail=null, sent=0, done=0; const waits=[], drains=[];
    const kick=()=>{for(let i=drains.length-1;i>=0;i--) if(sent-done<=drains[i].k||fail){drains[i].r(); drains.splice(i,1)}};
    w.onmessage=e=>{const m=e.data; if(m.t==="frame"){done++; onFrame&&onFrame(done); kick()} else {const r=waits.shift(); r&&r.ok(m)}};
    w.onerror=e=>{e.preventDefault&&e.preventDefault(); fail=new Error(e.message||"gif worker failed"); while(waits.length) waits.shift().no(fail); kick()};
    const call=(msg,tr)=>new Promise((ok,no)=>{if(fail) return no(fail); waits.push({ok,no}); w.postMessage(msg,tr||[])});
    return {
      start:(sample,W,H,delay)=>call({t:"start",sample,W,H,delay},[sample.buffer]),
      frame:(px)=>{if(fail) throw fail; sent++; w.postMessage({t:"frame",px},[px.buffer])},
      // wait until at most k frames are still queued (keeps memory flat while frames are produced)
      drain:(k)=>new Promise(r=>{if(fail||sent-done<=k) return r(); drains.push({k,r})}).then(()=>{if(fail) throw fail}),
      finish:()=>call({t:"finish"}).then(m=>m.bytes),
      close:()=>w.terminate()};
  }catch(e){return null}
}
