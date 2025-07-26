const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    discoverLights: () => ipcRenderer.invoke('discover-lights'),
    sendCommand: (ip, command) => ipcRenderer.invoke('send-command', ip, command)
});
