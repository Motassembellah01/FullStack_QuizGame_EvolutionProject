const { BrowserWindow } = require('electron');
const authService = require('./auth-service');
const { createAppWindow } = require('./app-process');

let win = null;

function createAuthWindow() {
    destroyAuthWin();
    win = new BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            enableRemoteModule: false,
        },
    });

    win.loadURL(authService.getAuthenticationURL());

    const {
        session: { webRequest },
    } = win.webContents;

    const filter = {
        urls: ['http://localhost/callback*'],
    };

    webRequest.onBeforeRequest(filter, async ({ url }) => {
        try {
            await authService.loadTokens(url);
        } catch (e) {
            console.log(e);
        }
        createAppWindow();
        return destroyAuthWin();
    });

    win.on('authenticated', () => {
        destroyAuthWin();
    });

    win.on('closed', () => {
        win = null;
    });
}

function destroyAuthWin() {
    if (!win) return;
    win.close();
    win = null;
}

function createLogoutWindow() {
    const logoutWindow = new BrowserWindow({
        show: false,
    });

    logoutWindow.loadURL(authService.getLogOutUrl());

    logoutWindow.on('ready-to-show', async () => {
        await authService.logout();
        logoutWindow.close();
        createAuthWindow();
    });
}

module.exports = {
    createAuthWindow,
    createLogoutWindow,
};
