const { app, BrowserWindow, ipcMain } = require("electron");
const log = require("electron-log");
const path = require("path");

const appConfig = require("./config.js");

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    });

    ipcMain.on("synchronous-message", (event, arg) => {
        if (arg === "quit") {
            app.quit();
            return;
        }
        event.sender.send("synchronous-reply", {
            localPath: getAppDataPath(),
            app_config: appConfig,
        });
    });

    win.loadFile("index.html");

    if (appConfig.RUN_ENV === "DEV") {
        win.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function getAppDataPath() {
    const rootPath = require("electron-root-path").rootPath;
    switch (process.platform) {
        case "darwin": {
            if (appConfig.RUN_ENV === "PROD") {
                // return rootPath;
                return path.join(process.env.HOME, "SML");
            } else {
                return "./";
            }
        }
        case "win32": {
            //return rootPath;
            return path.join(process.env.APPDATA, "SML");
        }
        case "linux": {
            return path.join(rootPath, path.sep, ".SML");
        }
        default: {
            console.log("Unsupported platform!");
            process.exit(1);
        }
    }
}
