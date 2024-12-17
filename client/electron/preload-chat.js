const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
    getProfile: () => ipcRenderer.invoke('auth:get-profile'),
    logOut: () => ipcRenderer.send('auth:log-out'),
    logIn: () => ipcRenderer.send('auth:log-in'),
    getPrivateData: () => ipcRenderer.invoke('api:get-private-data'),
    getAccessToken: () => ipcRenderer.invoke('auth:get-access-token'),
};

process.once('loaded', () => {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);
    contextBridge.exposeInMainWorld('chatAPI', {
        isChatProcess: () => process.argv.includes('chatProcess=true'),
    });
});
