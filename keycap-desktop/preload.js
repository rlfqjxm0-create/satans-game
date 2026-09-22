// Hands the page its .keycap data and a few window actions (see ../keycap/src/40-desktop.js).
const {contextBridge,ipcRenderer}=require("electron");
contextBridge.exposeInMainWorld("KEYCAP_FILE",ipcRenderer.sendSync("kc-data"));
contextBridge.exposeInMainWorld("KEYCAP_EDIT",process.argv.includes("--kc-edit"));   // the "키캡 수정하기" editor window
contextBridge.exposeInMainWorld("deskAPI",{
  move:(dx,dy)=>ipcRenderer.send("kc-move",dx,dy),
  drag:on=>ipcRenderer.send("kc-drag",!!on),   // main follows the cursor itself while a left drag is on
  zoom:dir=>ipcRenderer.send("kc-zoom",dir),
  hit:solid=>ipcRenderer.send("kc-hit",solid),
  menu:st=>ipcRenderer.send("kc-menu",st),
  on:fn=>ipcRenderer.on("kc-cmd",(e,c)=>fn(c)),
  save:json=>ipcRenderer.send("kc-save",json)   // the editor window: write the .keycap over the keycap's own file
});
