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
const SIZES=[["작게",180],["보통",240],["크게",340],["아주 크게",460]], MIN_W=140, MAX_W=720;
let state={wins:{},open:[],top:true}, tray=null, home=null, menuWin=null, menuFor=null, quitting=false;
const statePath=()=>path.join(app.getPath("userData"),"state.json");
function loadState(){try{state=Object.assign(state,JSON.parse(fs.readFileSync(statePath(),"utf8")))}catch(e){}}
let saveT=null;
function saveState(){clearTimeout(saveT); saveT=setTimeout(()=>{   // a temp file, then swapped in (never half a file)
  try{const p=statePath(), t=p+".tmp"; fs.writeFileSync(t,JSON.stringify(state)); fs.renameSync(t,p)}catch(e){}},300)}

const testPos=dx=>{if(!process.env.KC_POS) return null; const [x,y]=process.env.KC_POS.split(",").map(Number); return {x:x+dx,y}};   // tests: never on the main screen
const keycaps=()=>BrowserWindow.getAllWindows().filter(w=>w.kcKey);
const keyOf=f=>f?path.resolve(f).toLowerCase():"(기본)";
const nameOf=f=>f?path.basename(f).replace(/\.keycap$/i,""):"기본 키캡";
const fileArgs=argv=>argv.slice(1).filter(a=>/\.keycap$/i.test(a)&&fs.existsSync(a));
function refreshHome(){if(home&&!home.isDestroyed()) home.webContents.send("ui-refresh")}

function readKeycap(file){
  if(!file) return null;
  const d=JSON.parse(fs.readFileSync(file,"utf8"));
  if(!d||d.app!=="satan-keycap"||typeof d.hash!=="string") throw new Error("사탄의 키캡 파일이 아니에요");
  return {hash:d.hash,image:typeof d.image==="string"&&d.image.startsWith("data:image/")?d.image:null};
}

function openKeycap(file){
  const key=keyOf(file);
  for(const w of keycaps()) if(w.kcKey===key){w.show(); return w}   // already open: just bring it up
  let data=null;
  try{data=readKeycap(file)}catch(e){dialog.showErrorBox("사탄의 키캡","이 파일을 열 수 없어요.\n"+(file||"")+"\n\n"+e.message); return null}
  const saved=state.wins[key]||{}, w=Math.min(MAX_W,Math.max(MIN_W,saved.w||240)), h=Math.round(w*1.25);
  const area=screen.getPrimaryDisplay().workArea, n=keycaps().length;
  let x=saved.x, y=saved.y;
  const onScreen=(x,y)=>screen.getAllDisplays().some(d=>x+w/2>=d.bounds.x&&x+w/2<d.bounds.x+d.bounds.width&&y+h/2>=d.bounds.y&&y+h/2<d.bounds.y+d.bounds.height);
  if(x==null||!onScreen(x,y)){x=area.x+area.width-w-30-n*50; y=area.y+area.height-h-20}                          // new: bottom right
  if(process.env.KC_POS){const [px,py]=process.env.KC_POS.split(",").map(Number); x=px+n*(w+10); y=py}              // tests
  const win=new BrowserWindow({x,y,width:w,height:h,transparent:true,frame:false,resizable:false,maximizable:false,fullscreenable:false,
    alwaysOnTop:state.top!==false,skipTaskbar:true,hasShadow:false,backgroundColor:"#00000000",show:false,title:"사탄의 키캡",icon:ICON,
    webPreferences:{preload:path.join(__dirname,"preload.js"),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,spellcheck:false}});
  win.kcKey=key; win.kcFile=file; win.kcData=data; win.kcSolid=true; win.kcSt={spin:true,sound:true};
  win.setMenu(null);
  win.loadURL("kc://app/index.html?desktop=1");
  win.once("ready-to-show",()=>win.showInactive());
  const remember=()=>{if(win.isDestroyed()) return; const b=win.getBounds(); state.wins[key]={x:b.x,y:b.y,w:b.width}; saveState()};
  win.on("moved",remember); win.on("resized",remember);
  win.on("closed",()=>{if(!quitting){state.open=state.open.filter(k=>k!==(file||null)); saveState(); refreshHome(); if(!keycaps().length&&!(home&&!home.isDestroyed()&&home.isVisible())) openHome()}});
  if(!state.open.includes(file||null)){state.open.push(file||null); saveState()}
  remember(); refreshHome();
  return win;
}
function openDialog(parent){
  const r=dialog.showOpenDialogSync(parent&&!parent.isDestroyed()?parent:undefined,{title:"키캡 파일 열기",filters:[{name:"사탄의 키캡 파일",extensions:["keycap"]}],properties:["openFile","multiSelections"]});
  (r||[]).forEach(openKeycap);
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
function openMenu(win){
  if(menuWin&&!menuWin.isDestroyed()) menuWin.close();
  menuFor=win;
  const p=testPos(270)||screen.getCursorScreenPoint();
  menuWin=new BrowserWindow({x:p.x,y:p.y,width:256,height:470,transparent:true,frame:false,resizable:false,skipTaskbar:true,alwaysOnTop:true,
    backgroundColor:"#00000000",show:false,hasShadow:false,webPreferences:{preload:path.join(UI,"ui-preload.js"),contextIsolation:true}});
  menuWin.setAlwaysOnTop(true,"pop-up-menu"); menuWin.setMenu(null);
  menuWin.loadURL("kc://app/ui/menu.html");
  menuWin.on("blur",()=>{if(menuWin&&!menuWin.isDestroyed()) menuWin.close()});
  menuWin.on("closed",()=>{menuWin=null});
}
ipcMain.on("ui-size",(e,w,h)=>{const m=BrowserWindow.fromWebContents(e.sender); if(!m||m!==menuWin) return;
  const p=testPos(270)||screen.getCursorScreenPoint(), a=screen.getDisplayNearestPoint(p).workArea;
  const x=Math.min(p.x,a.x+a.width-w), y=p.y+h>a.y+a.height?Math.max(a.y,p.y-h):p.y;   // stays on the screen
  m.setBounds({x:Math.round(x),y:Math.round(y),width:Math.round(w),height:Math.round(h)}); m.show(); m.focus()});

ipcMain.on("ui-state",e=>{const from=BrowserWindow.fromWebContents(e.sender);
  if(from&&from===menuWin&&menuFor&&!menuFor.isDestroyed()){const w=menuFor;
    e.returnValue={name:nameOf(w.kcFile),spin:w.kcSt.spin,sound:w.kcSt.sound,top:w.isAlwaysOnTop(),width:w.getBounds().width,sizes:SIZES}; return}
  e.returnValue={open:keycaps().map(w=>({id:w.id,name:nameOf(w.kcFile)})),login:app.getLoginItemSettings().openAtLogin,top:state.top!==false};
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
    case "openPaths": (arg||[]).forEach(openKeycap); break;
    case "site": done(); shell.openExternal(SITE); break;
    case "home": done(); openHome(); break;
    case "close": done(); if(w) w.close(); break;
    case "quit": app.quit(); break;
    case "dismiss": done(); break;
    case "show": {const k=BrowserWindow.fromId(arg); if(k){k.show(); k.moveTop()} break}
    case "closeOne": {const k=BrowserWindow.fromId(arg); if(k) k.close(); break}
    case "login": app.setLoginItemSettings({openAtLogin:!app.getLoginItemSettings().openAtLogin}); refreshHome(); break;
    case "hideHome": if(home) home.close(); break;
  }
});

/* ---- the keycap windows ---- */
ipcMain.on("kc-data",e=>{const w=BrowserWindow.fromWebContents(e.sender); e.returnValue=w?w.kcData:null});
ipcMain.on("kc-move",(e,dx,dy)=>{const w=BrowserWindow.fromWebContents(e.sender); if(!w) return; const [x,y]=w.getPosition(); w.setPosition(Math.round(x+dx),Math.round(y+dy))});
function setWidth(w,nw){const b=w.getBounds(); nw=Math.round(Math.min(MAX_W,Math.max(MIN_W,nw))); const nh=Math.round(nw*1.25);
  w.setBounds({x:Math.round(b.x+(b.width-nw)/2),y:Math.round(b.y+(b.height-nh)/2),width:nw,height:nh})}   // grows around its middle
ipcMain.on("kc-zoom",(e,dir)=>{const w=BrowserWindow.fromWebContents(e.sender); if(w) setWidth(w,w.getBounds().width*(dir>0?1.08:1/1.08))});
// clicks on the empty part of the window go to whatever is behind it; mouse moves still reach the page (forward)
ipcMain.on("kc-hit",(e,solid)=>{const w=BrowserWindow.fromWebContents(e.sender); if(!w||w.kcSolid===solid) return; w.kcSolid=solid; w.setIgnoreMouseEvents(!solid,{forward:true})});
ipcMain.on("kc-menu",(e,st)=>{const w=BrowserWindow.fromWebContents(e.sender); if(!w) return; w.kcSt=Object.assign(w.kcSt,st); openMenu(w)});

function makeTray(){
  let img=nativeImage.createFromPath(ICON); if(!img.isEmpty()) img=img.resize({width:16,height:16});
  tray=new Tray(img); tray.setToolTip("사탄의 키캡");
  tray.on("click",openHome);
  tray.on("right-click",()=>tray.popUpContextMenu(Menu.buildFromTemplate([
    {label:"🏠 홈 열기",click:openHome},{label:"📂 키캡 파일 열기…",click:()=>openDialog()},{type:"separator"},{label:"👋 끝내기",click:()=>app.quit()}])));
}

app.on("second-instance",(e,argv)=>{const f=fileArgs(argv); if(f.length) f.forEach(openKeycap); else openHome()});
app.on("before-quit",()=>{quitting=true});
app.on("window-all-closed",()=>{if(!quitting) app.quit()});
app.whenReady().then(()=>{
  protocol.handle("kc",req=>{const u=new URL(req.url), p=decodeURIComponent(u.pathname);
    const base=p.startsWith("/ui/")?__dirname:PAGE, f=path.normalize(path.join(base,p));
    if(!f.startsWith(base)) return new Response("not found",{status:404});
    return net.fetch(pathToFileURL(f).toString())});
  loadState(); makeTray();
  const files=fileArgs(process.argv);
  if(files.length) files.forEach(openKeycap);
  else{const prev=(state.open||[]).filter(p=>p===null||fs.existsSync(p)); state.open=[];
    if(prev.length) prev.forEach(openKeycap); else openHome()}   // no file: the keycaps from last time, or the home window
});
