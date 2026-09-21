// Hands the page its .keycap data and a few window actions (see ../keycap/src/40-desktop.js).
const {contextBridge,ipcRenderer}=require("electron");
contextBridge.exposeInMainWorld("KEYCAP_FILE",ipcRenderer.sendSync("kc-data"));
contextBridge.exposeInMainWorld("deskAPI",{
  move:(dx,dy)=>ipcRenderer.send("kc-move",dx,dy),
  zoom:dir=>ipcRenderer.send("kc-zoom",dir),
  hit:solid=>ipcRenderer.send("kc-hit",solid),
  menu:st=>ipcRenderer.send("kc-menu",st),
  on:fn=>ipcRenderer.on("kc-cmd",(e,c)=>fn(c))
});
