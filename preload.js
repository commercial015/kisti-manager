
const {contextBridge,ipcRenderer}=require("electron");
contextBridge.exposeInMainWorld("desktopAPI",{
  load:()=>ipcRenderer.invoke("data:load"),
  save:data=>ipcRenderer.invoke("data:save",data),
  backup:()=>ipcRenderer.invoke("data:backup"),
  restore:()=>ipcRenderer.invoke("data:restore"),
  folder:()=>ipcRenderer.invoke("data:folder"),
  savePDF:name=>ipcRenderer.invoke("report:pdf",name)
});
