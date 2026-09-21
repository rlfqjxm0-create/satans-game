/* ---------- 바탕화면 키캡: the page inside the desktop program (keycap-desktop/) ----------
   Only with ?desktop=1. The program's preload gives us window.KEYCAP_FILE ({hash, image} from a .keycap file) and
   window.deskAPI (move / zoom / hit / menu / on). Here:
   - left click presses the key, left drag moves the window, right drag turns the keycap, right click opens the menu,
     the wheel resizes (these listeners run first, in the capture phase, so the page's own turn/pinch never sees them);
   - clicks on the empty (transparent) part of the window must reach whatever is behind it: after each frame the pixel
     under the cursor is read, and the program is told when it changes between "keycap" and "empty";
   - fewer frames while nothing moves (DRAW_GATE), so a keycap sitting on the desktop costs almost nothing. */
if(DESK){(function(){
  const D=window.deskAPI||{move(){},zoom(){},hit(){},menu(){},on(){}}, F=window.KEYCAP_FILE;
  if(F&&F.image){fetch(F.image).then(r=>r.blob()).then(b=>processFile(new File([b],"keycap.png",{type:"image/png"})))
    .then(({it})=>{S.items=[it]; rebuild()}).catch(e=>console.error("keycap picture",e))}

  // the RGB light must fit in the window (it was cut off at the edges): the camera steps back a little and the floor
  // glow is made smaller, so the whole soft light fades out before the window's edge (the empty part lets clicks through)
  // the window is nearly square (the chain swings out sideways as it turns and was cut by a tall window)
  // and the view is moved so the whole turn (chain included, measured over 36 angles) sits in the middle
  CAM.zoom=1.5; CAM.panY=-12; camApply(); rgbFloor.scale.set(0.36,0.36,1); shadow.scale.set(0.5,0.5,1);   // the floor light and shadow stay under the base
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
  D.on(c=>{if(c==="spin"){CAM.locked=!CAM.locked; velY=0} if(c==="sound") S.sound=!S.sound; if(c==="press"){ac(); pressKey()} idle=0});

  // is the pixel under the cursor part of the keycap? (read right after the frame is drawn, before it is shown)
  const gl=renderer.getContext(), px=new Uint8Array(4), render0=renderer.render.bind(renderer);
  renderer.render=(s,c)=>{render0(s,c);
    if(mouse&&need&&!down&&!PAUSE){need=false; const k=cv.width/Math.max(1,cv.clientWidth);
      gl.readPixels(Math.round(mouse[0]*k),Math.round(cv.height-mouse[1]*k),1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
      const on=px[3]>70; if(on!==solid){solid=on; D.hit(on)}}};
  window.__deskHit=()=>solid;   // for tests

  // frames: 60 while pressing / dragging, 30 while it turns by itself, 10 when everything has settled
  let lastDraw=0;
  DRAW_GATE=now=>{const busy=down||press>0.01||Math.abs(pressV)>0.02||idle<3, gap=busy?16:CAM.locked?100:33;
    if(now-lastDraw>=gap-1){lastDraw=now; return true} return false};
})()}
