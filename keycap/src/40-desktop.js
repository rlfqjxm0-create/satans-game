/* ---------- 바탕화면 키캡: the page inside the desktop program (keycap-desktop/) ----------
   Only with ?desktop=1. The program's preload gives us window.KEYCAP_FILE ({hash, image} from a .keycap file) and
   window.deskAPI (move / zoom / hit / menu / on). Here:
   - left click presses the key, left drag moves the window, right drag turns the keycap, right click opens the menu,
     the wheel resizes (these listeners run first, in the capture phase, so the page's own turn/pinch never sees them);
   - clicks on the empty (transparent) part of the window must reach whatever is behind it: after each frame the pixel
     under the cursor is read, and the program is told when it changes between "keycap" and "empty";
   - fewer frames while nothing moves (DRAW_GATE), so a keycap sitting on the desktop costs almost nothing. */
// a .keycap file's picture (the desktop keycap, or the program's "키캡 수정하기" editor window)
if(window.KEYCAP_FILE&&window.KEYCAP_FILE.image){fetch(window.KEYCAP_FILE.image).then(r=>r.blob()).then(b=>processFile(new File([b],"keycap.png",{type:"image/png"})))
  .then(({it})=>{S.items=[it]; if(!DESK) renderSlots(); rebuild()}).catch(e=>console.error("keycap picture",e))}
if(DESK){(function(){
  const D=window.deskAPI||{move(){},zoom(){},hit(){},menu(){},on(){}};

  // framing: everything on the tester (base, chain, a tall stand, floating decorations, shadow) must fit the window at
  // every turn angle. The unrotated bounding box is swept around y (a cylinder), its corners projected, and the zoom /
  // vertical pan searched so they stay inside with a margin. Runs after every rebuild (the picture arrives later).
  rgbFloor.scale.set(0.36,0.36,1); shadow.scale.set(0.5,0.5,1);   // the floor light and shadow stay under the base
  const FIT_V=new THREE.Vector3(), FIT_T=new THREE.Vector3();
  function fitView(){
    const rx=root.rotation.x, ry=root.rotation.y; root.rotation.set(0,0,0); root.updateMatrixWorld(true);
    const box=new THREE.Box3(); const vis=o=>{for(let p=o;p;p=p.parent) if(!p.visible) return false; return true}; root.traverse(o=>{if(o.isMesh&&!o.isSprite&&vis(o)&&o!==rgbGlow) box.expandByObject(o)}); root.rotation.set(rx,ry,0);
    if(box.isEmpty()) return;
    const r=Math.max(Math.hypot(box.min.x,box.min.z),Math.hypot(box.max.x,box.min.z),Math.hypot(box.min.x,box.max.z),Math.hypot(box.max.x,box.max.z))+0.8;
    const y0=Math.min(box.min.y,shadow.position.y)-0.5, y1=box.max.y+1.6;   // +1.6: floating decorations bob up and down
    const pts=[]; for(const x of [-r,r]) for(const z of [-r,r]) for(const y of [y0,y1]) pts.push(new THREE.Vector3(x,y,z));
    const extent=()=>{camApply(); camera.updateMatrixWorld(); let ex=0, ya=1, yb=-1; for(const p of pts){FIT_V.copy(p).project(camera); ex=Math.max(ex,Math.abs(FIT_V.x)); ya=Math.min(ya,FIT_V.y); yb=Math.max(yb,FIT_V.y)} return {ex,ya,yb}};
    const centre=()=>{for(let k=0;k<3;k++){const e=extent(), dist=camera.position.distanceTo(FIT_T.set(CAM.panX,6+CAM.panY,0)); CAM.panY+=(e.ya+e.yb)/2*dist*Math.tan(camera.fov*Math.PI/360)}};
    let lo=0.5, hi=6;
    for(let i=0;i<16;i++){CAM.zoom=(lo+hi)/2; centre(); const e=extent(); if(Math.max(e.ex,-e.ya,e.yb)<=0.9) hi=CAM.zoom; else lo=CAM.zoom}
    CAM.zoom=hi; centre(); camApply();
  }
  const rebuild0=rebuild; rebuild=function(){rebuild0(); fitView()}; fitView();
  window.__fitView=fitView;
  let down=null, mouse=null, need=false, solid=true;
  const stop=e=>{e.stopImmediatePropagation(); e.preventDefault()};
  addEventListener("pointerdown",e=>{stop(e); down={b:e.button,x:e.screenX,y:e.screenY,lx:e.screenX,ly:e.screenY,moved:false}; idle=0;
    try{cv.setPointerCapture(e.pointerId)}catch(err){}},true);
  addEventListener("pointermove",e=>{mouse=[e.clientX,e.clientY]; need=true; if(!down) return; stop(e);
    if(Math.hypot(e.screenX-down.x,e.screenY-down.y)>4) down.moved=true; if(!down.moved) return;
    const dx=e.screenX-down.lx, dy=e.screenY-down.ly; down.lx=e.screenX; down.ly=e.screenY; idle=0;
    if(down.b===0) D.move(dx,dy); else if(down.b===2){rotY+=dx*0.012; rotX=clamp(rotX+dy*0.006,-0.3,0.45)}},true);
  addEventListener("pointerup",e=>{if(!down) return; stop(e); const d=down; down=null; idle=0;
    if(!d.moved){if(d.b===0){ac(); pressKey()} else if(d.b===2) D.menu({spin:!CAM.locked,sound:S.sound})}},true);
  addEventListener("pointerleave",()=>{mouse=null},true);
  addEventListener("contextmenu",stop,true);
  addEventListener("dblclick",stop,true);
  addEventListener("wheel",e=>{stop(e); D.zoom(e.deltaY<0?1:-1)},{capture:true,passive:false});
  // 연결고리: the chain can be taken off (menu); the framing is redone since the chain widens the turn
  const chainOn=on=>{chain.visible=!!on; fitView()}; if(window.KEYCAP_FILE&&window.KEYCAP_FILE.chain===false) chain.visible=false;
  D.on(c=>{if(c==="spin"){CAM.locked=!CAM.locked; velY=0} if(c==="sound") S.sound=!S.sound; if(c==="press"){ac(); pressKey()} if(c==="chain-on") chainOn(true); if(c==="chain-off") chainOn(false); idle=0});

  // is the pixel under the cursor part of the keycap? (read right after the frame is drawn, before it is shown)
  const gl=renderer.getContext(), px=new Uint8Array(4), render0=renderer.render.bind(renderer);
  renderer.render=(s,c)=>{render0(s,c);
    if(mouse&&need&&!down&&!PAUSE){need=false; const k=cv.width/Math.max(1,cv.clientWidth);
      gl.readPixels(Math.round(mouse[0]*k),Math.round(cv.height-mouse[1]*k),1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
      const on=px[3]>70; if(on!==solid){solid=on; D.hit(on)}}};
  window.__deskHit=()=>solid;   // for tests

  let lastDraw=0;
  // frames: 60 while pressing / dragging, 25 while it turns by itself, 30 while the cursor is over it (the click-through
  // test needs fresh pixels), otherwise 10 if something still animates (rainbow / breathing light, glow mode, floating
  // decorations, glitter glow) and 2 when nothing at all moves - a keycap left on the desktop costs almost nothing
  DRAW_GATE=now=>{const busy=down||press>0.01||Math.abs(pressV)>0.02||idle<3;
    const anim=S.rgb==="rainbow"||S.rgb==="breath"||S.glow||!!(decoGroup&&(decoGroup.userData.halo||decoGroup.userData.spin))||!!(partSys&&partSys.glow);
    const gap=busy?16:!CAM.locked?40:mouse?33:anim?100:500;
    if(now-lastDraw>=gap-1){lastDraw=now; return true} return false};
})()}
