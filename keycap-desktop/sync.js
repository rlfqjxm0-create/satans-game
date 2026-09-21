// Copies the keycap page (built by ../keycap/build.py) into page/ for the desktop program:
// three.js is bundled locally (the program must work offline), the switch sounds are copied along.
const fs=require("fs"), path=require("path"), https=require("https");
const SRC=path.join(__dirname,"..","keycap"), OUT=path.join(__dirname,"page");
const CDN="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
fs.mkdirSync(OUT,{recursive:true});
let html=fs.readFileSync(path.join(SRC,"index.html"),"utf8");
if(!html.includes(CDN)) throw new Error("three.js script tag not found in keycap/index.html");
html=html.replace(CDN,"three.min.js");
fs.writeFileSync(path.join(OUT,"index.html"),html);
fs.cpSync(path.join(SRC,"sounds"),path.join(OUT,"sounds"),{recursive:true});
// the Jua font for the menu/home windows (OFL), bundled so they look right offline too
const FONT="https://raw.githubusercontent.com/google/fonts/main/ofl/jua/Jua-Regular.ttf", fontOut=path.join(OUT,"fonts","Jua.ttf");
fs.mkdirSync(path.dirname(fontOut),{recursive:true});
if(!fs.existsSync(fontOut)) https.get(FONT,r=>{if(r.statusCode!==200){console.warn("Jua download",r.statusCode); return} r.pipe(fs.createWriteStream(fontOut)).on("finish",()=>console.log("Jua font downloaded"))});
const three=path.join(OUT,"three.min.js");
if(fs.existsSync(three)&&fs.statSync(three).size>100000){console.log("page synced");}
else https.get(CDN,r=>{if(r.statusCode!==200) throw new Error("three.js download "+r.statusCode); const f=fs.createWriteStream(three); r.pipe(f); f.on("finish",()=>{f.close(); console.log("page synced (three.js downloaded)")})});
