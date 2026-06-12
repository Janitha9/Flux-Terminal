const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Configure electron store for sessions later
let store;

// Backend managers
const puttyManager = require('./putty-manager');
const sftpManager = require('./sftp-manager');

function createWindow() {
  const isDev = !app.isPackaged;
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Custom Title bar
    icon: path.join(__dirname, '../icons/Flux.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows <script type="module"> over file://
    },
  });

  // Capture all renderer console logs to the main process terminal AND a log file!
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const logMessage = `[RENDERER] ${message} (Line ${line} in ${sourceId})\n`;
    fs.appendFileSync(path.join(app.getPath('userData'), 'flux-error.log'), logMessage);
    fs.appendFileSync(path.join(app.getAppPath(), 'error.log'), logMessage);
  });

  if (isDev) {
    const devUrl = 'http://localhost:5173';
    
    const tryLoad = () => {
      mainWindow.loadURL(devUrl).catch(() => {
        setTimeout(tryLoad, 1000);
      });
    };

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (validatedURL.startsWith(devUrl)) {
        setTimeout(tryLoad, 1000);
      }
    });

    tryLoad();
  } else {
    // Load production build
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Basic Window Controls IPC
  ipcMain.on('window:minimize', () => mainWindow.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow.close());
}

app.whenReady().then(async () => {
  // Initialize electron-store (ESM package)
  const Store = (await import('electron-store')).default;
  store = new Store();

  // Apply saved keepalive settings on startup
  try {
    const savedSettings = store.get('settings') || {};
    const keepaliveEnabled = savedSettings.sshKeepalive !== false;
    const interval = keepaliveEnabled ? (savedSettings.sshKeepaliveInterval || 30) : 0;
    const { exec } = require('child_process');
    exec(`reg add "HKCU\\Software\\SimonTatham\\PuTTY\\Sessions\\Default%20Settings" /v PingIntervalSecs /t REG_DWORD /d ${interval} /f`);
  } catch (e) {
    console.error('Failed to apply keepalive on startup:', e);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Example for Store
ipcMain.handle('store:get', (event, key) => {
  return store.get(key);
});
ipcMain.handle('store:set', (event, key, value) => {
  store.set(key, value);
  if (key === 'settings' && value) {
    const { exec } = require('child_process');
    const keepaliveEnabled = value.sshKeepalive !== false;
    const interval = keepaliveEnabled ? (value.sshKeepaliveInterval || 30) : 0;
    exec(`reg add "HKCU\\Software\\SimonTatham\\PuTTY\\Sessions\\Default%20Settings" /v PingIntervalSecs /t REG_DWORD /d ${interval} /f`, (err) => {
      if (err) {
        console.error('Failed to update PuTTY Keepalive in Registry:', err);
      } else {
        console.log(`Successfully updated SSH Keepalive to ${interval} seconds in Registry.`);
      }
    });
  }
});

// PTY IPC Handlers
ipcMain.handle('pty:connect', (event, sessionId, connectionDetails) => {
  return puttyManager.connect(sessionId, connectionDetails, event.sender);
});
ipcMain.on('pty:write', (event, sessionId, data) => {
  puttyManager.write(sessionId, data);
});
ipcMain.on('pty:resize', (event, sessionId, cols, rows) => {
  puttyManager.resize(sessionId, cols, rows);
});
ipcMain.handle('pty:disconnect', (event, sessionId) => {
  return puttyManager.disconnect(sessionId);
});

// SFTP IPC Handlers
ipcMain.handle('sftp:connect', async (event, sessionId, connectionDetails) => {
  return await sftpManager.connect(sessionId, connectionDetails, event.sender);
});
ipcMain.handle('sftp:cancel', (event, sessionId, transferId) => {
  return sftpManager.cancelTransfer(sessionId, transferId);
});
ipcMain.handle('sftp:list', async (event, sessionId, dirPath) => {
  return await sftpManager.listDirectory(sessionId, dirPath);
});
ipcMain.handle('sftp:execute', async (event, sessionId, cmd) => {
  return await sftpManager.executeCommand(sessionId, cmd);
});
ipcMain.handle('sftp:rename', async (event, sessionId, oldPath, newPath) => {
  return await sftpManager.renameFile(sessionId, oldPath, newPath);
});
ipcMain.handle('sftp:delete', async (event, sessionId, filePath, isDir) => {
  return isDir 
    ? await sftpManager.deleteDir(sessionId, filePath)
    : await sftpManager.deleteFile(sessionId, filePath);
});
ipcMain.handle('sftp:mkdir', async (event, sessionId, dirPath) => {
  return await sftpManager.makeDir(sessionId, dirPath);
});
ipcMain.handle('sftp:newfile', async (event, sessionId, remotePath) => {
  return await sftpManager.createFile(sessionId, remotePath);
});
ipcMain.handle('sftp:reconnect', async (event, sessionId, connectionDetails) => {
  return await sftpManager.reconnect(sessionId, connectionDetails);
});
ipcMain.handle('sftp:upload', async (event, sessionId, localPath, remotePath, transferId) => {
  return await sftpManager.uploadFile(sessionId, localPath, remotePath, transferId);
});
ipcMain.handle('sftp:download', async (event, sessionId, remotePath, localPath, transferId) => {
  return await sftpManager.downloadFile(sessionId, remotePath, localPath, transferId);
});
ipcMain.handle('sftp:disconnect', (event, sessionId) => {
  return sftpManager.disconnect(sessionId);
});

ipcMain.handle('dialog:selectUploadFile', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select File to Upload',
    properties: ['openFile'],
    filters: [
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('dialog:selectDownloadPath', async (event, defaultName) => {
  const result = await dialog.showSaveDialog({
    title: 'Save Downloaded File',
    defaultPath: defaultName,
    filters: [
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });
  if (result.canceled || !result.filePath) {
    return null;
  }
  return result.filePath;
});

ipcMain.handle('dialog:selectFile', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select PuTTY Private Key (.ppk)',
    properties: ['openFile'],
    filters: [
      { name: 'PuTTY Private Key (*.ppk)', extensions: ['ppk'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

const crypto = require('crypto');

function encryptText(text, password) {
  const key = crypto.createHash('sha256').update(password).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptText(encryptedText, password) {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted backup format');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const key = crypto.createHash('sha256').update(password).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

ipcMain.handle('dialog:exportBackup', async (event, dataString, password) => {
  const isEncrypted = typeof password === 'string' && password.length > 0;
  const result = await dialog.showSaveDialog({
    title: 'Export Backup',
    defaultPath: isEncrypted ? 'flux_backup.flx' : 'flux_backup.json',
    filters: isEncrypted
      ? [{ name: 'Flux Encrypted Backup (*.flx)', extensions: ['flx'] }]
      : [{ name: 'JSON Files (*.json)', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) {
    return false;
  }
  
  let content = dataString;
  if (isEncrypted) {
    try {
      content = encryptText(dataString, password);
    } catch (e) {
      throw new Error('Encryption failed: ' + e.message);
    }
  }

  fs.writeFileSync(result.filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('dialog:importBackup', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Import Backup',
    properties: ['openFile'],
    filters: [
      { name: 'Flux Backup Files (*.json, *.flx)', extensions: ['json', 'flx'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const filePath = result.filePaths[0];
  const isEncrypted = filePath.endsWith('.flx');
  
  if (isEncrypted) {
    return { isEncrypted: true, filePath };
  } else {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      return { isEncrypted: false, data };
    } catch (err) {
      throw new Error('Invalid backup file: ' + err.message);
    }
  }
});

ipcMain.handle('backup:decrypt', async (event, filePath, password) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const decrypted = decryptText(fileContent, password);
    return JSON.parse(decrypted);
  } catch (err) {
    throw new Error('Incorrect password.');
  }
});
