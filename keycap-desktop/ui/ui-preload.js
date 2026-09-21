// The menu and home windows: read their state from the main process and send actions back.
const {contextBridge,ipcRenderer,webUtils}=require("electron");
contextBridge.exposeInMainWorld("ui",{
  state:()=>ipcRenderer.sendSync("ui-state"),
  act:(a,arg)=>ipcRenderer.send("ui-act",a,arg),
  size:(w,h)=>ipcRenderer.send("ui-size",w,h),
  onRefresh:fn=>ipcRenderer.on("ui-refresh",()=>fn()),
  pathOf:f=>webUtils.getPathForFile(f)
});
