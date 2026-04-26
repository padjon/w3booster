const fs = require('fs');
const path = require('path');
const shell = require('electron').shell;
const execSync = require('child_process').execSync;
const crypto = require('crypto');
const electron = require('electron');
const { dialog } = require('electron')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

let mainWindow;
let $workingDir = "";

if (!app.requestSingleInstanceLock()) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, $workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.{app}.
        if (launchWindow) {
            if (launchWindow.isMinimized()) launchWindow.restore()
            launchWindow.focus()
        }

        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
}
const electronVersion = Number(process.versions.electron.split('.')[0]);
if (electronVersion < 15) {
    throw new Error("<b>Major update requires reinstallation!</b> <br/><br/>Please download and install the latest version of W3Booster from W3Booster.com")
}


app.on('web-contents-created', (event, contents) => {
    require("@electron/remote/main").enable(contents);
})


app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (url.indexOf("localhost:") >= 0) {
        // On certificate error we disable default behaviour (stop loading the page)
        // and we then say "it is all fine - true" to the callback
        console.log(url)
        console.log("Certificate Error -     -----------------------------------------: " + error);
        event.preventDefault();
        callback(true);
    }
});

async function main() {
    try {
        $workingDir = execSync('chcp 65001 | echo %APPDATA%').toString().trim().replace(/\r?\n|\r/g, '');
        if (!fs.existsSync($workingDir)) {
            throw new Error("Was not able to determine the working directory. Please contact the support at support@w3booster.com");
        }

        $workingDir += "\\W3Booster";
        if (!fs.existsSync($workingDir)) {
            showProgress("Creating working directory");
            fs.mkdirSync($workingDir);
        }

        $workingDir += "\\app";
        if (!fs.existsSync($workingDir)) {
            showProgress("Creating app directory");
            fs.mkdirSync($workingDir);
        }

        launchWindow.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36")
        launchWindow.webContents.on('new-window', function (event, url) {
            event.preventDefault();
            shell.openExternal(url)
        });

        showProgress("Checking for updates");
        await patchingMain();

        showProgress("Preparations accomplished, starting app");
        createMainWindow();
    } catch (e) {
        showError(e.message);
        console.trace()
        return;
    }
}


let isHidden = true;
function createMainWindow() {
    // Create the browser window.
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1280,
        defaultHeight: 800
    });

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: 1280,//mainWindowState.width,
        height: 800,//mainWindowState.height,
        resizable: true,
        frame: false,
        title: "W3Booster | Next Level WC3 Streaming",
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })
    mainWindow.setMaximumSize(1280, 800);
    mainWindow.setMinimumSize(1280, 800);
    mainWindow.stateKeeper = mainWindowState;
    mainWindow.stateKeeperPrototype = windowStateKeeper;
    mainWindow.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36")

    mainWindowState.manage(mainWindow);

    require("@electron/remote/main").enable(mainWindow.webContents)

    //mainWindow.webContents.openDevTools()
    // and load the index.html of the app.
    mainWindow.loadURL((isDevMode || process.argv.indexOf('-proddevmode') >= 0) ? 'http://localhost:4200/' : 'https://app.w3booster.com/public/client/');

    mainWindow.webContents.on('new-window', function (event, url) {
        event.preventDefault();
        shell.openExternal(url)
    });

    // mainWindow.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
    //     // On certificate error we disable default behaviour (stop loading the page)
    //     // and we then say "it is all fine - true" to the callback
    //     console.log("Certificate Error: " + error);
    //     event.preventDefault();
    //     callback(true);
    // });

    mainWindow.webContents.on('did-finish-load', function () {
        if (isHidden) {
            isHidden = false;
            setTimeout(() => {
                mainWindow.show();
                launchWindow.hide();

                // Open the DevTools.
                if ((isDevMode || process.argv.indexOf('-proddevmode') >= 0 || process.argv.indexOf('-console') >= 0)) {
                    mainWindow.webContents.openDevTools({ mode: 'undocked' })
                }
            }, 0)
        }
    });

    mainWindow.on('page-title-updated', (evt) => {
        evt.preventDefault();
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
        app.quit();
    })
}



launchWindow.webContents.on('new-window', function (event, url) {
    event.preventDefault();
    shell.openExternal(url)
});

const { ipcMain } = require('electron')
ipcMain.on('get-working-dir', (event, arg) => {
    event.returnValue = $workingDir;
})

ipcMain.on('set-recorder-red', (event, arg) => {
    mainWindow.setOverlayIcon($workingDir + 'current/recorder-red.png', "Recorder not running")
})

ipcMain.on('set-recorder-green', (event, arg) => {
    mainWindow.setOverlayIcon($workingDir + 'current/recorder-green.png', "Recorder running")
})

ipcMain.on('request-admin-privileges', (event, arg) => {
    event.returnValue = true;

    const selection = dialog.showMessageBoxSync({
        type: 'info',
        title: 'Administrative privileges required',
        buttons: ['OK', 'Cancel'],
        message: 'Warcraft3 was started with administrative privileqes.\r\nW3Booster needs the same privileges to work as intended.\r\nRestart W3Booster with admin privileges now?'
    })
    if (selection <= 0) {
        let args = process.argv.join(' ');
        execSync('powershell.exe Start-Process \\"' + process.cwd() + '\\W3Booster.exe\\" -Verb RunAs -ArgumentList \\"' + args + '\\"');
    }
    app.quit();
})

ipcMain.on('is-patching-required', async (event, arg) => {
    event.returnValue = await patchingRequired();
})

ipcMain.on('show-dialog', async (event, type, title, buttons, message) => {
    event.returnValue = dialog.showMessageBoxSync({
        type: type,
        title: title,
        buttons: buttons,
        message: message
    })
})

ipcMain.on('quit-app', async (event, arg) => {
    event.returnValue = true;
    app.quit();
})

ipcMain.on('restart-app', async (event, arg) => {
    event.returnValue = true;
    let args = process.argv.join(' ');
    execSync('powershell.exe Start-Process \\"' + process.cwd() + '\\W3Booster.exe\\" -ArgumentList \\"' + args + '\\"');
    app.quit();
})



/**********************
 * Patching
***********************/
const apiBase = clientServer.replace("public/", "") + "patch/"
const dowloadBase = clientServer + "patch/"
let currentPatchHash = ""
let currentVersionInfo = "";
let patchSourcePath = ''
let currentPatchHashPath = ''
let currentVersionFile = ''

async function patchingMain() {
    try {
        patchSourcePath = $workingDir + path.sep;
        currentPatchHashPath = patchSourcePath + "patch.hash"

        if (!fs.existsSync(patchSourcePath)) {
            fs.mkdirSync(patchSourcePath);
        }

        if (fs.existsSync(currentPatchHashPath)) {
            currentPatchHash = fs.readFileSync(currentPatchHashPath).toString();
        }

        const isPatchingRequired = await patchingRequired();
        if (!isPatchingRequired) {
            showProgress("No patching required, latest patches loaded");
        }
        if (!isPatchingRequired || await doPatching()) {

            if (!isPatchingRequired && fs.existsSync(currentVersionFile)) {
                currentVersionInfo = fs.readFileSync(currentVersionFile).toString();
            }

            showProgress("Active balance patch type: " + currentVersionInfo);
            return true;
        } else {
            throw new Error("unable to patch");
        }
    } catch (e) {
        throw new Error("patching error: " + e);
    }
}

async function patchingRequired() {
    try {
        const hash = await getWebContent(apiBase + "hash");
        return hash != currentPatchHash || currentPatchHash == "" || currentPatchHash == null || currentPatchHash == undefined;
    } catch (e) {
        return false;
    }
}

async function doPatching() {
    if (fs.existsSync(currentPatchHashPath)) {
        fs.unlinkSync(currentPatchHashPath);
    }

    const newPatchHash = await getWebContent(apiBase + "hash")

    const hashes = JSON.parse(await getWebContent(apiBase + "hashes"));
    let currentFiles = {}
    for (const filePath of getFilesRecursive(patchSourcePath)) {
        const hash = await getFileHash(filePath);
        currentFiles[filePath.replace(patchSourcePath, "") + ":" + hash] = filePath;
    }

    let targetFiles = {}
    for (const hashObject of hashes) {
        const targetPath = hashObject.path.replace(/\//g, path.sep);
        targetFiles[targetPath + ":" + hashObject.hash] = { url: dowloadBase + hashObject.path, path: targetPath };
    }

    // delete all not required files
    const filesToRemove = [];
    for (const key of Object.keys(currentFiles)) {
        if (targetFiles[key] == undefined) {
            filesToRemove.push(currentFiles[key]);
        }
    }

    for (let i = 0; i < filesToRemove.length; i++) {
        showProgress("Cleaning up patch files (" + i + "/" + filesToRemove.length + ")");
        fs.unlinkSync(filesToRemove[i])
    }

    showProgress("Cleaning up patch folders");
    cleanEmptyFoldersRecursively(patchSourcePath);

    const filesToDownload = [];
    for (const key of Object.keys(targetFiles)) {
        if (currentFiles[key] == undefined) {
            filesToDownload.push(targetFiles[key]);
        }
    }

    for (let i = 0; i < filesToDownload.length; i++) {
        showProgress("Downloading balance patches (" + i + "/" + filesToDownload.length + ")");
        const url = filesToDownload[i].url;
        const relativetargetPath = filesToDownload[i].path;
        const absoluteTargetPath = patchSourcePath + relativetargetPath;
        const absoluteTargetDir = path.dirname(absoluteTargetPath);
        mkDirByPathSync(absoluteTargetDir);
        await getWebContent(url, fs.createWriteStream(absoluteTargetPath));
    }

    currentPatchHash = newPatchHash;
    fs.writeFileSync(currentPatchHashPath, currentPatchHash);
    return true;
}

/**********************
 * IO UTILITY FUNCTIONS
***********************/

function getFileHash(targetPath) {
    return new Promise((resolve) => {
        if (!fs.existsSync(targetPath)) {
            resolve("");
        }
        var fd = fs.createReadStream(targetPath);
        var hash = crypto.createHash('sha1');
        hash.setEncoding('base64');

        fd.on('end', function () {
            hash.end();
            resolve(hash.read()); // the desired sha1sum
        });

        // read all file and pipe it (write it) to the hash object
        fd.pipe(hash);
    })
}

function getFilesRecursive(dir) {
    return fs.readdirSync(dir)
        .reduce((files, file) =>
            fs.statSync(path.join(dir, file)).isDirectory() ?
                files.concat(getFilesRecursive(path.join(dir, file))) :
                files.concat(path.join(dir, file)),
            []);
}

function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
    const initDir = path.isAbsolute(targetDir) ? path.sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    return targetDir.split(path.sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);

        var exists = true;
        try {
            exists = fs.existsSync(curDir);
        } catch (err) {

        };

        if (!exists) {

            try {
                fs.mkdirSync(curDir);
            } catch (err) {
                if (err.code === 'EEXIST') { // curDir already exists!
                    return curDir;
                }

                // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
                if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
                    throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
                }

                const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
                if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
                    throw err; // Throw if it's just the last created dir.
                }
            }
        }
        return curDir;
    }, initDir);
}

function copyFileSync(source, target) {
    var targetFile = target;
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target, includeSourceFolder = true) {
    var files = [];
    var targetFolder = (includeSourceFolder) ? path.join(target, path.basename(source)) : target;
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }

    //copy
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            var curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}

function deleteRecursive(targetPath) {
    var files = [];
    if (fs.existsSync(targetPath)) {
        if (fs.lstatSync(targetPath).isDirectory()) {
            files = fs.readdirSync(targetPath);
            files.forEach(function (file, index) {
                var curPath = targetPath + path.sep + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(targetPath);
        } else {
            fs.unlinkSync(targetPath);
        }
    }
};

function cleanEmptyFoldersRecursively(folder) {
    var fs = require('fs');
    var path = require('path');

    var isDir = fs.statSync(folder).isDirectory();
    if (!isDir) {
        return;
    }
    var files = fs.readdirSync(folder);
    if (files.length > 0) {
        files.forEach(function (file) {
            var fullPath = path.join(folder, file);
            cleanEmptyFoldersRecursively(fullPath);
        });

        // re-evaluate files; after deleting subfolder
        // we may have parent folder empty now
        files = fs.readdirSync(folder);
    }

    if (files.length == 0) {
        fs.rmdirSync(folder);
        return;
    }
}

/**********************
 * WEB UTILITY FUNCTIONS
***********************/

function getWebContent(url, filestream = undefined) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            var body = '';

            if (res.statusCode != 200) {
                reject();
            } else if (filestream) {
                res.pipe(filestream);
            } else {
                res.on('data', function (chunk) {
                    body += chunk;
                });
            }

            res.on('end', function () {
                if (res.statusCode == 200) {
                    resolve(body);
                } else {
                    reject();
                }
            });
        }).on('error', (e) => {
            reject();
        });
    })
}

function getBinaryWebContent(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            var data = [];

            if (res.statusCode != 200) {
                reject();
            }

            res.on('data', function (chunk) {
                data.push(chunk);
            }).on('end', function () {
                if (res.statusCode == 200) {
                    var buffer = Buffer.concat(data);
                    resolve(buffer);
                } else {
                    reject();
                }
            });
        }).on('error', (e) => {
            reject();
        });;
    })
}

const windowStateKeeper = function (options) {
    const app = electron.app || electron.remote.app;
    const screen = electron.screen || electron.remote.screen;
    let state;
    let winRef;
    let stateChangeTimer;
    const eventHandlingDelay = 100;
    const config = Object.assign({
        file: 'window-state.json',
        path: app.getPath('userData'),
        maximize: true,
        fullScreen: true
    }, options);
    const fullStoreFileName = path.join(config.path, config.file);

    function isNormal(win) {
        return !win.isMaximized() && !win.isMinimized() && !win.isFullScreen();
    }

    function hasBounds() {
        return state &&
            Number.isInteger(state.x) &&
            Number.isInteger(state.y) &&
            Number.isInteger(state.width) && state.width > 0 &&
            Number.isInteger(state.height) && state.height > 0;
    }

    function resetStateToDefault() {
        const displayBounds = screen.getPrimaryDisplay().bounds;

        // Reset state to default values on the primary display
        state = {
            width: config.defaultWidth || 800,
            height: config.defaultHeight || 600,
            x: 0,
            y: 0,
            displayBounds
        };
    }

    function windowWithinBounds(bounds) {
        return (
            state.x >= bounds.x &&
            state.y >= bounds.y &&
            state.x + state.width <= bounds.x + bounds.width &&
            state.y + state.height <= bounds.y + bounds.height
        );
    }

    function ensureWindowVisibleOnSomeDisplay() {
        const visible = screen.getAllDisplays().some(display => {
            return windowWithinBounds(display.bounds);
        });

        if (!visible) {
            // Window is partially or fully not visible now.
            // Reset it to safe defaults.
            return resetStateToDefault();
        }
    }

    function validateState() {
        const isValid = state && (hasBounds() || state.isMaximized || state.isFullScreen);
        if (!isValid) {
            state = null;
            return;
        }

        if (hasBounds() && state.displayBounds) {
            ensureWindowVisibleOnSomeDisplay();
        }
    }

    function updateState(win) {
        win = win || winRef;
        if (!win) {
            return;
        }
        // Don't throw an error when window was closed
        try {
            const winBounds = win.getBounds();
            if (isNormal(win)) {
                state.x = winBounds.x;
                state.y = winBounds.y;
                state.width = winBounds.width;
                state.height = winBounds.height;
            }
            state.isMaximized = win.isMaximized();
            state.isFullScreen = win.isFullScreen();
            state.displayBounds = screen.getDisplayMatching(winBounds).bounds;
        } catch (err) { }
    }

    function saveState(win) {
        // Update window state only if it was provided
        if (win) {
            updateState(win);
        }

        // Save state
        try {
            mkDirByPathSync(path.dirname(fullStoreFileName));
            fs.writeFileSync(fullStoreFileName, JSON.stringify(state));
        } catch (err) {
            // Don't care
            while (true);
        }
    }

    function stateChangeHandler() {
        // Handles both 'resize' and 'move'
        clearTimeout(stateChangeTimer);
        stateChangeTimer = setTimeout(updateState, eventHandlingDelay);
    }

    function closeHandler() {
        updateState();
    }

    function closedHandler() {
        // Unregister listeners and save state
        unmanage();
        saveState();
    }

    function manage(win) {
        if (config.maximize && state.isMaximized) {
            win.maximize();
        }
        if (config.fullScreen && state.isFullScreen) {
            win.setFullScreen(true);
        }
        win.on('resize', stateChangeHandler);
        win.on('move', stateChangeHandler);
        win.on('close', closeHandler);
        win.on('closed', closedHandler);
        winRef = win;
    }

    function unmanage() {
        if (winRef) {
            winRef.removeListener('resize', stateChangeHandler);
            winRef.removeListener('move', stateChangeHandler);
            clearTimeout(stateChangeTimer);
            winRef.removeListener('close', closeHandler);
            winRef.removeListener('closed', closedHandler);
            winRef = null;
        }
    }

    // Load previous state
    try {
        state = JSON.parse(fs.readFileSync(fullStoreFileName));
    } catch (err) {
        // Don't care
    }

    // Check state validity
    validateState();

    // Set state fallback values
    state = Object.assign({
        width: config.defaultWidth || 800,
        height: config.defaultHeight || 600
    }, state);

    return {
        get x() { return state.x; },
        get y() { return state.y; },
        get width() { return state.width; },
        get height() { return state.height; },
        get displayBounds() { return state.displayBounds; },
        get isMaximized() { return state.isMaximized; },
        get isFullScreen() { return state.isFullScreen; },
        saveState,
        unmanage,
        manage,
        resetStateToDefault
    };
};

main();
