/* 사탄의 키캡 (desktop): opens .keycap files from the website as keycaps floating on the desktop.
   Each file is its own small window: transparent, frameless, always on top, not on the taskbar. The page inside is
   the website's own keycap page (page/index.html, copied by sync.js) with ?desktop=1. The right-click menu and the
   home window are small HTML pages of our own (ui/) in the site's look - not the plain Windows menu.
   Where windows were, which files were open and the options are remembered in userData/state.json. */
const {app,BrowserWindow,ipcMain,Tray,Menu,dialog,protocol,net,screen,shell,nativeImage}=require("electron");
const path=require("path"), fs=require("fs"), {pathToFileURL}=require("url");

app.commandLine.appendSwitch("autoplay-policy","no-user-gesture-required");   // the click sound, right away
if(process.env.KC_DATA) app.setPath("userData",process.env.KC_DATA);   // tests: their own state
protocol.registerSchemesAsPrivileged([{scheme:"kc",privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
if(!app.requestSingleInstanceLock()){app.quit(); return}
app.setAppUserModelId("com.satansgame.keycap");

const PAGE=path.join(__dirname,"page"), UI=path.join(__dirname,"ui"), ICON=path.join(__dirname,"build","icon.png");
const SITE="https://rlfqjxm0-create.github.io/satans-game/keycap/";
const SIZES=[["작게",200],["보통",270],["크게",370],["아주 크게",500]], MIN_W=150, MAX_W=760, ASPECT=1.05;   // nearly square: the chain swings out sideways
let state={wins:{},open:[],top:true}, tray=null, home=null, menuWin=null, menuFor=null, menuMode="keycap", menuAt=null, quitting=false;
const statePath=()=>path.join(app.getPath("userData"),"state.json");
function loadState(){try{state=Object.assign(state,JSON.parse(fs.readFileSync(statePath(),"utf8")))}catch(e){}}
let saveT=null;
function saveState(){clearTimeout(saveT); saveT=setTimeout(()=>{   // a temp file, then swapped in (never half a file)
  try{const p=statePath(), t=p+".tmp"; fs.writeFileSync(t,JSON.stringify(state)); fs.renameSync(t,p)}catch(e){}},300)}

const testPos=dx=>{if(!process.env.KC_POS) return null; const [x,y]=process.env.KC_POS.split(",").map(Number); return {x:x+dx,y}};   // tests: never on the main screen
const keycaps=()=>BrowserWindow.getAllWindows().filter(w=>w.kcKey);
const keyOf=f=>f?path.resolve(f).toLowerCase():"(기본)";
const nameOf=(f,c)=>(f?path.basename(f).replace(/\.keycap$/i,""):"기본 키캡")+(c?" ("+(c+1)+")":"");
// open keycaps are remembered as [file, copy] - the same file can be out several times (하나 더 띄우기)
const openList=()=>(state.open||[]).map(e=>Array.isArray(e)?e:[e,0]);
const fileArgs=argv=>argv.slice(1).filter(a=>/\.keycap$/i.test(a)&&fs.existsSync(a));
function refreshHome(){if(home&&!home.isDestroyed()) home.webContents.send("ui-refresh")}

function readKeycap(file){
  if(!file) return null;
  const d=JSON.parse(fs.readFileSync(file,"utf8"));
  if(!d||d.app!=="satan-keycap"||typeof d.hash!=="string") throw new Error("사탄의 키캡 파일이 아니에요");
  return {hash:d.hash,image:typeof d.image==="string"&&d.image.startsWith("data:image/")?d.image:null};
}

function openKeycap(file,copy){
  copy=copy||0; const key=keyOf(file)+(copy?"#"+copy:"");
  for(const w of keycaps()) if(w.kcKey===key){w.show(); return w}   // already open: just bring it up
  let data=null;
  try{data=readKeycap(file)}catch(e){dialog.showErrorBox("사탄의 키캡","이 파일을 열 수 없어요.\n"+(file||"")+"\n\n"+e.message); return null}
  const saved=state.wins[key]||{}, w=Math.min(MAX_W,Math.max(MIN_W,saved.w||270)), h=Math.round(w*ASPECT);
  const area=screen.getPrimaryDisplay().workArea, n=keycaps().length;
  let x=saved.x, y=saved.y;
  const onScreen=(x,y)=>screen.getAllDisplays().some(d=>x+w/2>=d.bounds.x&&x+w/2<d.bounds.x+d.bounds.width&&y+h/2>=d.bounds.y&&y+h/2<d.bounds.y+d.bounds.height);
  if(x==null||!onScreen(x,y)){x=area.x+area.width-w-30-n*50; y=area.y+area.height-h-20}                          // new: bottom right
  if(process.env.KC_POS){const [px,py]=process.env.KC_POS.split(",").map(Number); x=px+n*(w+10); y=py}              // tests
  const win=new BrowserWindow({x,y,width:w,height:h,transparent:true,frame:false,resizable:false,maximizable:false,fullscreenable:false,
    alwaysOnTop:state.top!==false,skipTaskbar:true,hasShadow:false,backgroundColor:"#00000000",show:false,title:"사탄의 키캡",icon:ICON,
    webPreferences:{preload:path.join(__dirname,"preload.js"),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,spellcheck:false}});
  win.kcKey=key; win.kcFile=file; win.kcCopy=copy; win.kcData=data; win.kcSolid=true; win.kcSt={spin:true,sound:true}; win.kcLock=!!saved.lock; win.kcChain=saved.chain!==false;
  win.setMenu(null);
  win.loadURL("kc://app/index.html?desktop=1");
  win.once("ready-to-show",()=>win.showInactive());
  const remember=()=>{if(win.isDestroyed()) return; const b=win.getBounds(); state.wins[key]={x:b.x,y:b.y,w:b.width,lock:win.kcLock,chain:win.kcChain}; saveState()};
  win.on("moved",remember); win.on("resized",remember);
  win.on("closed",()=>{if(!quitting){state.open=openList().filter(([f,c])=>!(f===(file||null)&&c===copy)); saveState(); refreshHome(); if(!keycaps().length&&!(home&&!home.isDestroyed()&&home.isVisible())) openHome()}});
  if(!openList().some(([f,c])=>f===(file||null)&&c===copy)){state.open=openList().concat([[file||null,copy]]); saveState()}
  remember(); refreshHome();
  return win;
}
// one more of the same keycap: the next free copy number, placed a little to the side of the original
function duplicate(w){let c=1; const used=new Set(keycaps().filter(k=>k.kcFile===w.kcFile).map(k=>k.kcCopy)); while(used.has(c)) c++;
  const had=!!state.wins[keyOf(w.kcFile)+"#"+c], k=openKeycap(w.kcFile,c);
  if(k&&!had){const b=w.getBounds(), a=screen.getDisplayMatching(b).workArea, step=Math.round(b.width*0.85);   // beside the original, on the side with room
    let x=b.x-step>=a.x?b.x-step:b.x+step; x=Math.max(a.x,Math.min(x,a.x+a.width-b.width)); k.setPosition(x,b.y)}}
/* 키캡 수정하기: the full website page (the local copy) in a normal window, with this keycap's options and picture
   already loaded. Its "바탕화면 키캡" button sends the .keycap JSON here (kc-save), which is written over the keycap's
   own file, and every window showing that file reloads. So: edit on the page, press the button, done. */
function openEditor(w){
  for(const e of BrowserWindow.getAllWindows()) if(e.kcEditor&&e.kcEditFile===w.kcFile){e.show(); e.focus(); return}
  const area=screen.getDisplayMatching(w.getBounds()).workArea, W=Math.min(1100,area.width-40), H=Math.min(860,area.height-40), tp=testPos(300);
  const ed=new BrowserWindow({width:W,height:H,x:tp?tp.x:Math.round(area.x+(area.width-W)/2),y:tp?tp.y:Math.round(area.y+(area.height-H)/2),title:"키캡 수정하기 · 사탄의 키캡",icon:ICON,
    backgroundColor:"#FFFFFF",autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,"preload.js"),contextIsolation:true,nodeIntegration:false,additionalArguments:["--kc-edit"]}});
  ed.kcEditor=true; ed.kcEditFile=w.kcFile; ed.kcData=w.kcData; ed.setMenu(null);
  ed.loadURL("kc://app/index.html");
}
// the editor page's "바탕화면 키캡" button hands the file's JSON over IPC (a blob download from the kc:// scheme ends
// "interrupted" in Chromium): written over the keycap's own file, then every window showing it reloads
ipcMain.on("kc-save",(e,json)=>{const ed=BrowserWindow.fromWebContents(e.sender); if(process.env.KC_DATA) console.log("kc-save",!!ed,ed&&ed.kcEditor,ed&&ed.kcEditFile,typeof json,json&&json.length); if(!ed||!ed.kcEditor) return;
  let target=ed.kcEditFile;
  if(!target){target=dialog.showSaveDialogSync(ed,{title:"키캡 파일로 저장",defaultPath:path.join(app.getPath("desktop"),"나의-키캡.keycap"),filters:[{name:"사탄의 키캡 파일",extensions:["keycap"]}]}); if(!target) return}
  try{fs.writeFileSync(target+".tmp",json); fs.renameSync(target+".tmp",target)}catch(err){dialog.showErrorBox("사탄의 키캡","파일을 저장하지 못했어요.\n"+err.message); return}
  if(!ed.kcEditFile){ed.kcEditFile=target; openKeycap(target); return}
  let data=null; try{data=readKeycap(target)}catch(err){return}
  for(const k of keycaps()) if(k.kcFile===target){k.kcData=data; k.reload()}   // the new look, right away
});
function openDialog(parent){
  const r=dialog.showOpenDialogSync(parent&&!parent.isDestroyed()?parent:undefined,{title:"키캡 파일 열기",filters:[{name:"사탄의 키캡 파일",extensions:["keycap"]}],properties:["openFile","multiSelections"]});
  (r||[]).forEach(f=>openKeycap(f));
}

/* ---- home: open files (drop or pick), the keycaps that are out, a couple of options ---- */
function openHome(){
  if(home&&!home.isDestroyed()){home.show(); home.focus(); return}
  const area=screen.getPrimaryDisplay().workArea, W=380, H=560;
  const tp=testPos(0);
  home=new BrowserWindow({width:W,height:H,x:tp?tp.x:Math.round(area.x+(area.width-W)/2),y:tp?tp.y:Math.round(area.y+(area.height-H)/2),transparent:true,frame:false,
    resizable:false,maximizable:false,backgroundColor:"#00000000",title:"사탄의 키캡",icon:ICON,show:false,
    webPreferences:{preload:path.join(UI,"ui-preload.js"),contextIsolation:true}});
  home.setMenu(null); home.loadURL("kc://app/ui/home.html"); home.once("ready-to-show",()=>home.show());
  home.on("closed",()=>{home=null; if(!quitting&&!keycaps().length) app.quit()});
}

/* ---- the cute right-click menu: its own little window next to the cursor ---- */
function openMenu(win,mode){
  if(menuWin&&!menuWin.isDestroyed()) menuWin.close();
  menuFor=win; menuMode=mode||"keycap";
  const p=menuAt=testPos(270)||screen.getCursorScreenPoint();   // where it was opened - it must not follow the cursor
  menuWin=new BrowserWindow({x:p.x,y:p.y,width:240,height:460,transparent:true,frame:false,resizable:false,skipTaskbar:true,alwaysOnTop:true,
    backgroundColor:"#00000000",show:false,hasShadow:false,webPreferences:{preload:path.join(UI,"ui-preload.js"),contextIsolation:true}});
  menuWin.setAlwaysOnTop(true,"pop-up-menu"); menuWin.setMenu(null);
  menuWin.loadURL("kc://app/ui/menu.html");
  menuWin.on("blur",()=>{if(menuWin&&!menuWin.isDestroyed()) menuWin.close()});
  menuWin.on("closed",()=>{menuWin=null});
}
ipcMain.on("ui-size",(e,w,h)=>{const m=BrowserWindow.fromWebContents(e.sender); if(!m||m!==menuWin) return;
  const p=menuAt||screen.getCursorScreenPoint(), a=screen.getDisplayNearestPoint(p).workArea;
  const x=Math.min(p.x,a.x+a.width-w), y=p.y+h>a.y+a.height?Math.max(a.y,p.y-h):p.y;   // stays on the screen
  m.setBounds({x:Math.round(x),y:Math.round(y),width:Math.round(w),height:Math.round(h)});
  if(!m.isVisible()){m.show(); m.focus()}});   // show/focus again on a visible menu blurs it on Windows, and blur closes it

ipcMain.on("ui-state",e=>{const from=BrowserWindow.fromWebContents(e.sender);
  if(from&&from===menuWin&&menuMode==="tray"){e.returnValue={mode:"tray",name:"",login:app.getLoginItemSettings().openAtLogin,top:state.top!==false}; return}
  if(from&&from===menuWin&&menuFor&&!menuFor.isDestroyed()){const w=menuFor;
    e.returnValue={mode:"keycap",name:nameOf(w.kcFile,w.kcCopy),lock:w.kcLock,chain:w.kcChain,spin:w.kcSt.spin,sound:w.kcSt.sound,top:w.isAlwaysOnTop(),width:w.getBounds().width,sizes:SIZES}; return}
  e.returnValue={open:keycaps().map(w=>({id:w.id,name:nameOf(w.kcFile,w.kcCopy)})),login:app.getLoginItemSettings().openAtLogin,top:state.top!==false};
});
ipcMain.on("ui-act",(e,a,arg)=>{
  const w=menuFor&&!menuFor.isDestroyed()?menuFor:null, from=BrowserWindow.fromWebContents(e.sender), fromMenu=from&&from===menuWin;
  const done=()=>{if(fromMenu&&menuWin&&!menuWin.isDestroyed()) menuWin.close()};
  const send=c=>{if(w){w.webContents.send("kc-cmd",c); if(c==="spin") w.kcSt.spin=!w.kcSt.spin; if(c==="sound") w.kcSt.sound=!w.kcSt.sound}};
  switch(a){
    case "press": case "spin": case "sound": send(a); done(); break;
    case "size": if(w) setWidth(w,arg); done(); break;
    case "top": state.top=!(state.top!==false); saveState(); keycaps().forEach(x=>x.setAlwaysOnTop(state.top)); done(); refreshHome(); break;
    case "open": done(); openDialog(fromMenu?null:from); break;
    case "openPaths": (arg||[]).forEach(f=>openKeycap(f)); break;
    case "site": done(); shell.openExternal(SITE); break;
    case "home": done(); openHome(); break;
    case "close": done(); if(w) w.close(); break;
    case "dup": done(); if(w) duplicate(w); break;
    case "edit": done(); if(w) openEditor(w); break;
    case "chain": done(); if(w){w.kcChain=!w.kcChain; w.webContents.send("kc-cmd",w.kcChain?"chain-on":"chain-off"); const b=w.getBounds(); state.wins[w.kcKey]={x:b.x,y:b.y,w:b.width,lock:w.kcLock,chain:w.kcChain}; saveState()} break;
    case "lock": done(); if(w){w.kcLock=!w.kcLock; const b=w.getBounds(); state.wins[w.kcKey]={x:b.x,y:b.y,w:b.width,lock:w.kcLock}; saveState()} break;
    case "dupOne": {const k=BrowserWindow.fromId(arg); if(k) duplicate(k); break}
    case "quit": app.quit(); break;
    case "dismiss": done(); break;
    case "show": {const k=BrowserWindow.fromId(arg); if(k){k.show(); k.moveTop()} break}
    case "closeOne": {const k=BrowserWindow.fromId(arg); if(k) k.close(); break}
    case "login": done(); app.setLoginItemSettings({openAtLogin:!app.getLoginItemSettings().openAtLogin}); refreshHome(); break;
    case "hideHome": if(home) home.close(); break;
  }
});

/* ---- the keycap windows ---- */
ipcMain.on("kc-data",e=>{const w=BrowserWindow.fromWebContents(e.sender); e.returnValue=w&&w.kcData?Object.assign({chain:w.kcChain!==false},w.kcData):(w&&w.kcKey?{hash:"",image:null,chain:w.kcChain!==false}:null)});
ipcMain.on("kc-move",(e,dx,dy)=>{const w=BrowserWindow.fromWebContents(e.sender); if(!w||w.kcLock) return; const [x,y]=w.getPosition(); w.setPosition(Math.round(x+dx),Math.round(y+dy))});
function setWidth(w,nw){const b=w.getBounds(); nw=Math.round(Math.min(MAX_W,Math.max(MIN_W,nw))); const nh=Math.round(nw*ASPECT);
  w.setBounds({x:Math.round(b.x+(b.width-nw)/2),y:Math.round(b.y+(b.height-nh)/2),width:nw,height:nh})}   // grows around its middle
ipcMain.on("kc-zoom",(e,dir)=>{const w=BrowserWindow.fromWebContents(e.sender); if(w&&!w.kcLock) setWidth(w,w.getBounds().width*(dir>0?1.08:1/1.08))});
// clicks on the empty part of the window go to whatever is behind it; mouse moves still reach the page (forward)
ipcMain.on("kc-hit",(e,solid)=>{const w=BrowserWindow.fromWebContents(e.sender); if(!w||w.kcSolid===solid) return; w.kcSolid=solid; w.setIgnoreMouseEvents(!solid,{forward:true})});
ipcMain.on("kc-menu",(e,st)=>{const w=BrowserWindow.fromWebContents(e.sender); if(!w) return; w.kcSt=Object.assign(w.kcSt,st); openMenu(w)});

function makeTray(){
  let img=nativeImage.createFromPath(ICON); if(!img.isEmpty()) img=img.resize({width:16,height:16});
  tray=new Tray(img); tray.setToolTip("사탄의 키캡");
  tray.on("click",openHome);
  tray.on("right-click",()=>openMenu(null,"tray"));   // the same little menu as the keycaps'
}

app.on("second-instance",(e,argv)=>{const f=fileArgs(argv); if(f.length) f.forEach(x=>openKeycap(x)); else openHome()});
app.on("before-quit",()=>{quitting=true});
app.on("window-all-closed",()=>{if(!quitting) app.quit()});
app.whenReady().then(()=>{
  protocol.handle("kc",req=>{const u=new URL(req.url), p=decodeURIComponent(u.pathname);
    const base=p.startsWith("/ui/")?__dirname:PAGE, f=path.normalize(path.join(base,p));
    if(!f.startsWith(base)) return new Response("not found",{status:404});
    return net.fetch(pathToFileURL(f).toString())});
  loadState(); makeTray();
  const files=fileArgs(process.argv);
  if(files.length) files.forEach(f=>openKeycap(f));
  else{const prev=openList().filter(([p])=>p===null||fs.existsSync(p)); state.open=[];
    if(prev.length) prev.forEach(([f,c])=>openKeycap(f,c)); else openHome()}   // no file: the keycaps from last time, or the home window
});
