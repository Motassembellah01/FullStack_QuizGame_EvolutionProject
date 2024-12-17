const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let chatWindow;

function createChatWin() {
    chatWindow = new BrowserWindow({
        width: 600,
        height: 1000,
        webPreferences: {
            preload: path.join(__dirname, 'preload-chat.js'),
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: true,
            webSecurity: false,
            additionalArguments: ['chatProcess=true'],
        },
    });

    const indexPath = `file://${path.join(__dirname, '../dist/client/browser/index.html')}`;
    chatWindow.loadURL(indexPath);

    chatWindow.on('closed', () => {
        ipcMain.emit('chat-closed');
        chatWindow = null;
    });
}

function destroyChatWin() {
    if (!chatWindow) return;
    chatWindow.close();
    chatWindow = null;
}

module.exports = {
    createChatWin,
    destroyChatWin,
};
