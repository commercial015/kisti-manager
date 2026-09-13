
const {app,BrowserWindow,Menu,ipcMain,dialog} = require("electron");
const path=require("path"), fs=require("fs");
const DATA_DIR=path.join(app.getPath("userData"),"data");
const DATA_FILE=path.join(DATA_DIR,"smart-kisti-data.json");
let mainWindow=null;
function ensureData(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
  if(!fs.existsSync(DATA_FILE)){
    fs.writeFileSync(DATA_FILE, JSON.stringify({customers:[],loans:[],payments:[],dps:[],dpsPayments:[],settings:{business:"Smart Kisti Manager",phone:"",address:"",footer:"ধন্যবাদ"}},null,2));
  }
}
function createWindow(){
  const win=new BrowserWindow({
    width:1440,height:920,minWidth:1100,minHeight:700,show:false,
    webPreferences:{preload:path.join(__dirname,"preload.js"),contextIsolation:true,nodeIntegration:false}
  });
  mainWindow=win;
  win.loadFile(path.join(__dirname,"index.html"));
  win.once("ready-to-show",()=>win.show());
  const menu=Menu.buildFromTemplate([
    {label:"File",submenu:[
      {label:"Reload",accelerator:"Ctrl+R",click:()=>win.reload()},
      {label:"Print",accelerator:"Ctrl+P",click:()=>win.webContents.print({silent:false})},
      {type:"separator"},{role:"quit"}]},
    {label:"View",submenu:[{role:"toggleDevTools"},{role:"resetZoom"},{role:"zoomIn"},{role:"zoomOut"}]},
    {label:"Help",submenu:[{label:"About",click:()=>dialog.showMessageBox(win,{type:"info",title:"Smart Kisti Manager",message:"Smart Kisti Manager v10.0\\nKisti + DPS Complete Desktop Application"})}]}
  ]);
  Menu.setApplicationMenu(menu);
}
app.whenReady().then(()=>{ensureData();createWindow()});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});
ipcMain.handle("data:load",()=>{ensureData();return JSON.parse(fs.readFileSync(DATA_FILE,"utf8"))});
ipcMain.handle("data:save",(e,data)=>{ensureData();fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2));return true});
ipcMain.handle("data:backup",async()=>{ensureData();const r=await dialog.showSaveDialog({title:"Backup Data",defaultPath:"smart-kisti-backup.json",filters:[{name:"JSON",extensions:["json"]}]});if(r.canceled)return false;fs.copyFileSync(DATA_FILE,r.filePath);return r.filePath});
ipcMain.handle("data:restore",async()=>{const r=await dialog.showOpenDialog({title:"Restore Backup",properties:["openFile"],filters:[{name:"JSON",extensions:["json"]}]});if(r.canceled||!r.filePaths[0])return false;const parsed=JSON.parse(fs.readFileSync(r.filePaths[0],"utf8"));fs.writeFileSync(DATA_FILE,JSON.stringify(parsed,null,2));return true});
ipcMain.handle("data:folder",()=>{require("electron").shell.openPath(DATA_DIR);return true});
ipcMain.handle("report:pdf",async(e,reportName="Smart-Kisti-Report")=>{
  const safe=String(reportName||"Smart-Kisti-Report").replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"")||"Smart-Kisti-Report";
  const r=await dialog.showSaveDialog({title:"Save Report as PDF",defaultPath:`${safe}-${new Date().toISOString().slice(0,10)}.pdf`,filters:[{name:"PDF",extensions:["pdf"]}]});
  if(r.canceled||!r.filePath)return false;
  try{
    const pdf=await mainWindow.webContents.printToPDF({printBackground:true,pageSize:"A4",landscape:false,margins:{marginType:"default"}});
    fs.writeFileSync(r.filePath,pdf);
    return r.filePath;
  }catch(err){
    dialog.showErrorBox("PDF Save Failed",String(err.message||err));
    return false;
  }
});
