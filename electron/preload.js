const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window Controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  
  // Storage
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store:set', key, value),

  // PTY
  ptyConnect: (sessionId, details) => ipcRenderer.invoke('pty:connect', sessionId, details),
  ptyWrite: (sessionId, data) => ipcRenderer.send('pty:write', sessionId, data),
  ptyResize: (sessionId, cols, rows) => ipcRenderer.send('pty:resize', sessionId, cols, rows),
  ptyDisconnect: (sessionId) => ipcRenderer.invoke('pty:disconnect', sessionId),
  onPtyData: (sessionId, callback) => ipcRenderer.on(`pty-data-${sessionId}`, (evt, data) => callback(data)),
  onPtyExit: (sessionId, callback) => ipcRenderer.on(`pty-exit-${sessionId}`, (evt, code) => callback(code)),
  removePtyListeners: (sessionId) => {
    ipcRenderer.removeAllListeners(`pty-data-${sessionId}`);
    ipcRenderer.removeAllListeners(`pty-exit-${sessionId}`);
  },
  
  // SFTP
  sftpConnect: (sessionId, details) => ipcRenderer.invoke('sftp:connect', sessionId, details),
  sftpList: (sessionId, path) => ipcRenderer.invoke('sftp:list', sessionId, path),
  sftpExecute: (sessionId, cmd) => ipcRenderer.invoke('sftp:execute', sessionId, cmd),
  sftpRename: (sessionId, oldPath, newPath) => ipcRenderer.invoke('sftp:rename', sessionId, oldPath, newPath),
  sftpDelete: (sessionId, filePath, isDir) => ipcRenderer.invoke('sftp:delete', sessionId, filePath, isDir),
  sftpMkdir: (sessionId, dirPath) => ipcRenderer.invoke('sftp:mkdir', sessionId, dirPath),
  sftpNewFile: (sessionId, remotePath) => ipcRenderer.invoke('sftp:newfile', sessionId, remotePath),
  sftpReconnect: (sessionId, details) => ipcRenderer.invoke('sftp:reconnect', sessionId, details),
  sftpUpload: (sessionId, localPath, remotePath, transferId) => ipcRenderer.invoke('sftp:upload', sessionId, localPath, remotePath, transferId),
  sftpDownload: (sessionId, remotePath, localPath, transferId) => ipcRenderer.invoke('sftp:download', sessionId, remotePath, localPath, transferId),
  sftpDisconnect: (sessionId) => ipcRenderer.invoke('sftp:disconnect', sessionId),
  sftpCancel: (sessionId, transferId) => ipcRenderer.invoke('sftp:cancel', sessionId, transferId),
  onSftpProgress: (sessionId, callback) => ipcRenderer.on(`sftp-progress-${sessionId}`, (evt, data) => callback(data)),
  removeSftpListeners: (sessionId) => {
    ipcRenderer.removeAllListeners(`sftp-progress-${sessionId}`);
  },
  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  selectUploadFile: () => ipcRenderer.invoke('dialog:selectUploadFile'),
  selectDownloadPath: (defaultName) => ipcRenderer.invoke('dialog:selectDownloadPath', defaultName),
  exportBackup: (data, password) => ipcRenderer.invoke('dialog:exportBackup', data, password),
  importBackup: () => ipcRenderer.invoke('dialog:importBackup'),
  decryptBackup: (filePath, password) => ipcRenderer.invoke('backup:decrypt', filePath, password),
});
