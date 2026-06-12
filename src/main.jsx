import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

if (typeof window !== 'undefined' && !window.electronAPI) {
  const ptyCallbacks = {};
  const localStore = {};
  
  window.electronAPI = {
    minimize: () => console.log('Minimize window'),
    maximize: () => console.log('Maximize window'),
    close: () => console.log('Close window'),
    
    storeGet: async (key) => {
      try {
        const val = localStorage.getItem(`flux_store_${key}`);
        return val ? JSON.parse(val) : null;
      } catch (e) {
        return localStore[key] || null;
      }
    },
    
    storeSet: async (key, value) => {
      try {
        localStorage.setItem(`flux_store_${key}`, JSON.stringify(value));
      } catch (e) {
        localStore[key] = value;
      }
    },
    
    ptyConnect: async (sessionId, details) => {
      console.log('PTY Connect mock', sessionId, details);
      setTimeout(() => {
        const callback = ptyCallbacks[sessionId];
        if (callback) {
          // Welcome message in cyan/green
          const welcome = `\r\n\x1b[36mWelcome to Flux Mock Terminal Session!\x1b[0m\r\n` +
            `Connected to \x1b[32m${details.username || 'user'}@${details.host}\x1b[0m\r\n\r\n` +
            `mock-server:~$ `;
          const encoder = new TextEncoder();
          callback(encoder.encode(welcome).buffer);
        }
      }, 500);
      return true;
    },
    
    ptyWrite: (sessionId, data) => {
      console.log('PTY Write mock', sessionId, data);
      const callback = ptyCallbacks[sessionId];
      if (callback) {
        const encoder = new TextEncoder();
        // Simple echo for typing feedback
        if (data === '\r') {
          callback(encoder.encode('\r\nmock-server:~$ ').buffer);
        } else {
          callback(encoder.encode(data).buffer);
        }
      }
    },
    
    ptyResize: (sessionId, cols, rows) => console.log('PTY Resize mock', sessionId, cols, rows),
    ptyDisconnect: async (sessionId) => {
      console.log('PTY Disconnect mock', sessionId);
      delete ptyCallbacks[sessionId];
      return true;
    },
    
    onPtyData: (sessionId, callback) => {
      ptyCallbacks[sessionId] = callback;
    },
    
    onPtyExit: (sessionId, callback) => {
      // no-op
    },
    
    sftpConnect: async (sessionId, details) => {
      console.log('SFTP Connect mock', sessionId, details);
      return { homeDir: '/root' };
    },
    
    sftpList: async (sessionId, path) => {
      console.log('SFTP List mock', sessionId, path);
      return [
        { name: 'projects', isDir: true, size: '4096', date: 'Jun 11 14:00' },
        { name: 'documents', isDir: true, size: '4096', date: 'Jun 11 14:00' },
        { name: 'config.json', isDir: false, size: '1024', date: 'Jun 11 14:05' },
        { name: 'README.md', isDir: false, size: '2048', date: 'Jun 11 14:10' },
      ];
    },
    
    sftpExecute: async (sessionId, cmd) => {
      console.log('SFTP Execute mock', sessionId, cmd);
      return '';
    },
    
    sftpRename: async (sessionId, oldPath, newPath) => {
      console.log('SFTP Rename mock', sessionId, oldPath, newPath);
      return true;
    },
    
    sftpDelete: async (sessionId, filePath, isDir) => {
      console.log('SFTP Delete mock', sessionId, filePath, isDir);
      return true;
    },
    
    sftpMkdir: async (sessionId, dirPath) => {
      console.log('SFTP Mkdir mock', sessionId, dirPath);
      return true;
    },
    
    sftpNewFile: async (sessionId, remotePath) => {
      console.log('SFTP NewFile mock', sessionId, remotePath);
      return true;
    },
    
    sftpReconnect: async (sessionId, details) => {
      console.log('SFTP Reconnect mock', sessionId, details);
      return true;
    },
    
    sftpUpload: async (sessionId, localPath, remotePath) => {
      console.log('SFTP Upload mock', sessionId, localPath, remotePath);
      return true;
    },
    
    sftpDownload: async (sessionId, remotePath, localPath) => {
      console.log('SFTP Download mock', sessionId, remotePath, localPath);
      return true;
    },
    
    sftpDisconnect: async (sessionId) => {
      console.log('SFTP Disconnect mock', sessionId);
      return true;
    },
    
    selectFile: async () => 'mock_private_key.ppk',
    selectUploadFile: async () => 'mock_upload_file.txt',
    selectDownloadPath: async (defaultName) => `mock_download_path/${defaultName}`,
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
