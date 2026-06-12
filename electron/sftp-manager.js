const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function logDebug(msg) {
  try {
    const { app } = require('electron');
    const logPath = path.join(app.getPath('userData'), 'flux-error.log');
    const logLine = `[SFTP DEBUG] ${new Date().toISOString()} - ${msg}\n`;
    fs.appendFileSync(logPath, logLine);
  } catch (e) {
    // ignore logging errors
  }
}

class SftpManager {
  constructor() {
    this.sessions = new Map();
    const isPackaged = __dirname.includes('app.asar');
    this.psftpPath = isPackaged
      ? path.join(process.resourcesPath, 'bin', 'psftp.exe')
      : path.join(__dirname, '../bin/psftp.exe');
    this.pscpPath = isPackaged
      ? path.join(process.resourcesPath, 'bin', 'pscp.exe')
      : path.join(__dirname, '../bin/pscp.exe');
  }

  // psftp uses -batch to avoid prompts, -l user, -pw pass, and -b batchfile or stdin
  // We can drive it interactively by sending commands to stdin and parsing stdout.
  connect(sessionId, connectionDetails, webContents) {
    const sId = String(sessionId);
    if (this.isSessionAlive(sId)) {
      logDebug(`SFTP connection for session ${sId} is already alive. Reusing.`);
      const session = this.sessions.get(sId);
      return Promise.resolve({ homeDir: session.homeDir || '/' });
    }

    const existingSession = this.sessions.get(sId);
    if (existingSession && existingSession.connectingPromise) {
      logDebug(`SFTP connection for session ${sId} is already in progress. Reusing promise.`);
      return existingSession.connectingPromise;
    }

    const { 
      host, 
      port, 
      username, 
      password,
      connectionType,
      keyFile,
      compression,
      sshVersion
    } = connectionDetails;
    
    if (connectionType && connectionType !== 'ssh') {
      return Promise.reject(new Error(`SFTP is only supported over SSH connection type (current: ${connectionType})`));
    }
    
    const args = [];
    args.push('-P', port || 22);
    args.push(host);
    
    if (username) args.push('-l', username);
    if (password) args.push('-pw', password);
    if (keyFile) args.push('-i', keyFile);
    if (sshVersion === '1') args.push('-1');
    else if (sshVersion === '2') args.push('-2');
    if (compression) args.push('-C');
    
    args.push('-be'); // batch errors mode (do not stop on errors)

    logDebug(`Connecting SFTP to ${host}:${port} with user ${username}. Executable: ${this.psftpPath}`);

    const psftpProcess = spawn(this.psftpPath, args, { windowsHide: true });

    psftpProcess.on('error', (error) => {
      logDebug(`Process error: ${error.message}`);
      console.error('psftp process error:', error);
      const session = this.sessions.get(sId);
      if (session && session.process === psftpProcess) {
        if (session.currentCommand) session.currentCommand.reject(error);
        session.commandQueue.forEach(cmd => cmd.reject(error));
        this.sessions.delete(sId);
      }
    });

    psftpProcess.on('close', (code) => {
      logDebug(`Process closed with code ${code}`);
      const session = this.sessions.get(sId);
      if (session && session.process === psftpProcess) {
        if (session.currentCommand) session.currentCommand.reject(new Error(`SFTP closed with code ${code}`));
        session.commandQueue.forEach(cmd => cmd.reject(new Error(`SFTP closed with code ${code}`)));
        this.sessions.delete(sId);
      }
    });
    
    // Auto accept keys
    psftpProcess.stderr.on('data', (data) => {
      const strData = data.toString();
      logDebug(`STDERR: ${strData.trim()}`);
      if (strData.includes('Store key in cache')) {
        logDebug(`Sending 'y' to accept host key`);
        psftpProcess.stdin.write('y\n');
      }
    });

    const connectPromise = new Promise((resolve, reject) => {
      this.sessions.set(sId, {
        process: psftpProcess,
        ready: false,
        commandQueue: [],
        currentCommand: null,
        buffer: '',
        onReadyData: { resolve, reject },
        connectingPromise: null,
        webContents: webContents,
        connectionDetails: connectionDetails,
        activeTransfers: new Map()
      });

      psftpProcess.stdout.on('data', (data) => {
        const str = data.toString();
        logDebug(`STDOUT: ${str.trim()}`);
        this._handleOutput(sId, str);
      });
    });

    const session = this.sessions.get(sId);
    session.connectingPromise = connectPromise;

    connectPromise.then(
      (res) => {
        const s = this.sessions.get(sId);
        if (s) s.connectingPromise = null;
        return res;
      },
      (err) => {
        const s = this.sessions.get(sId);
        if (s) s.connectingPromise = null;
        throw err;
      }
    );

    return connectPromise;
  }

  _handleOutput(sessionId, dataStr) {
    const sId = String(sessionId);
    const session = this.sessions.get(sId);
    if (!session) return;

    session.buffer += dataStr;

    // psftp prompt ends with 'psftp> '
    if (session.buffer.includes('psftp> ')) {
      const output = session.buffer.replace('psftp> ', '').trim();
      
      if (!session.ready) {
        // Initial connection established
        session.ready = true;
        
        // Extract remote working directory from the startup output
        const homeDirMatch = session.buffer.match(/Remote working directory is\s+([^\r\n]+)/);
        const homeDir = homeDirMatch ? homeDirMatch[1].trim() : '/';
        session.homeDir = homeDir;
        logDebug(`Session ready. Home directory detected as: ${homeDir}`);
        
        session.buffer = ''; // reset buffer
        
        if (session.onReadyData) {
          session.onReadyData.resolve({ homeDir });
          session.onReadyData = null;
        }

        this._processNextCommand(sId);
      } else if (session.currentCommand) {
        session.buffer = ''; // reset buffer
        // Resolve the outstanding command promise
        session.currentCommand.resolve(output);
        session.currentCommand = null;
        this._processNextCommand(sId);
      }
    }
  }

  _processNextCommand(sessionId) {
    const sId = String(sessionId);
    const session = this.sessions.get(sId);
    if (!session || !session.ready || session.currentCommand || session.commandQueue.length === 0) return;

    session.currentCommand = session.commandQueue.shift();
    session.process.stdin.write(`${session.currentCommand.cmd}\n`);
  }

  executeCommand(sessionId, cmd) {
    return new Promise((resolve, reject) => {
      const sId = String(sessionId);
      const session = this.sessions.get(sId);
      if (!session) return reject(new Error('Session not found'));

      session.commandQueue.push({ cmd, resolve, reject });
      this._processNextCommand(sId);
    });
  }

  async listDirectory(sessionId, dirPath) {
    const output = await this.executeCommand(sessionId, `ls "${dirPath}"`);
    // Parse output which looks like Unix "ls -l" format into JSON
    const lines = output.split('\n');
    const files = [];
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    for (const line of lines) {
      // Remove carriage returns and leading/trailing whitespace
      const cleanLine = line.replace(/\r/g, '').trim();
      if (!cleanLine || cleanLine.startsWith('Listing directory')) continue;
      
      const parts = cleanLine.split(/\s+/);
      if (parts.length < 3) continue;

      const permissions = parts[0];
      // Set directory to true if permissions start with 'd' (directory) or 'l' (symlink)
      const isDir = permissions.startsWith('d') || permissions.startsWith('l');

      // Find the date index to isolate the filename
      let dateIdx = -1;
      let dateLen = 0;

      for (let i = 1; i < parts.length - 1; i++) {
        const token = parts[i].toLowerCase();
        // Check for alphabetical month abbreviations (e.g. "May")
        if (months.includes(token)) {
          if (i + 2 < parts.length) {
            dateIdx = i;
            dateLen = 3;
            break;
          }
        }
        // Check for ISO Date formats (e.g. YYYY-MM-DD or YYYY/MM/DD)
        if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(token)) {
          if (i + 1 < parts.length) {
            dateIdx = i;
            dateLen = 2;
            break;
          }
        }
      }

      let name = '';
      let size = '0';
      let dateStr = '';

      if (dateIdx !== -1) {
        dateStr = parts.slice(dateIdx, dateIdx + dateLen).join(' ');
        size = parts[dateIdx - 1] || '0';
        name = parts.slice(dateIdx + dateLen).join(' ');
      } else {
        // Fallback for listings that don't match standard Unix patterns
        name = parts[parts.length - 1];
        size = parts[parts.length - 2] || '0';
        dateStr = '';
      }

      // Ignore '.' and '..'
      if (!name || name === '.' || name === '..') continue;

      files.push({ name, isDir, size, date: dateStr });
    }
    return files;
  }

  async renameFile(sessionId, oldPath, newPath) {
    return await this.executeCommand(sessionId, `ren "${oldPath}" "${newPath}"`);
  }

  async deleteFile(sessionId, filePath) {
    return await this.executeCommand(sessionId, `del "${filePath}"`);
  }

  async deleteDir(sessionId, dirPath) {
    return await this.executeCommand(sessionId, `rmdir "${dirPath}"`);
  }

  async makeDir(sessionId, dirPath) {
    return await this.executeCommand(sessionId, `mkdir "${dirPath}"`);
  }

  async createFile(sessionId, remotePath) {
    // psftp doesn't have a direct "touch" command.
    // We create a temp empty file locally and upload it.
    const os = require('os');
    const tmpFile = path.join(os.tmpdir(), `flux_empty_${Date.now()}`);
    fs.writeFileSync(tmpFile, '');
    try {
      return await this.executeCommand(sessionId, `put "${tmpFile}" "${remotePath}"`);
    } finally {
      try { fs.unlinkSync(tmpFile); } catch (e) { /* ignore */ }
    }
  }

  async uploadFile(sessionId, localPath, remotePath, transferId) {
    return this.runTransfer(sessionId, 'upload', localPath, remotePath, transferId);
  }

  async downloadFile(sessionId, remotePath, localPath, transferId) {
    return this.runTransfer(sessionId, 'download', localPath, remotePath, transferId);
  }

  runTransfer(sessionId, direction, localPath, remotePath, transferId) {
    const sId = String(sessionId);
    return new Promise((resolve, reject) => {
      const session = this.sessions.get(sId);
      if (!session) return reject(new Error('Session not found'));
      if (!session.connectionDetails) return reject(new Error('Connection details not found for session'));

      const { 
        host, 
        port, 
        username, 
        password,
        keyFile,
        compression,
        sshVersion
      } = session.connectionDetails;

      const args = [];
      args.push('-P', port || 22);
      if (password) args.push('-pw', password);
      if (keyFile) args.push('-i', keyFile);
      if (sshVersion === '1') args.push('-1');
      else if (sshVersion === '2') args.push('-2');
      if (compression) args.push('-C');
      args.push('-batch');

      const userHost = username ? `${username}@${host}` : host;

      if (direction === 'upload') {
        args.push(localPath, `${userHost}:${remotePath}`);
      } else {
        args.push(`${userHost}:${remotePath}`, localPath);
      }

      logDebug(`Spawning PSCP: ${this.pscpPath} ${args.map(a => String(a).includes(' ') ? `"${a}"` : a).join(' ')}`);

      const pscpProcess = spawn(this.pscpPath, args, { windowsHide: true });
      if (!session.activeTransfers) {
        session.activeTransfers = new Map();
      }
      session.activeTransfers.set(transferId, pscpProcess);

      pscpProcess.stdout.on('data', (data) => {
        const str = data.toString();
        logDebug(`PSCP STDOUT: ${str.trim()}`);

        const progressRegex = /\|\s*([\d\s\w.]+)\s*\|\s*([\d\s\w.\/]+)\s*\|\s*ETA:\s*([\d:]+)\s*\|\s*(\d+)%/;
        const match = str.match(progressRegex);
        if (match && session.webContents && !session.webContents.isDestroyed()) {
          const transferred = match[1].trim();
          const speed = match[2].trim();
          const eta = match[3].trim();
          const percentage = parseInt(match[4]);
          
          session.webContents.send(`sftp-progress-${sId}`, {
            transferId,
            transferred,
            speed,
            eta,
            percentage
          });
        }
      });

      pscpProcess.stderr.on('data', (data) => {
        const str = data.toString();
        logDebug(`PSCP STDERR: ${str.trim()}`);
        if (str.includes('Store key in cache')) {
          try {
            pscpProcess.stdin.write('y\n');
          } catch (e) {
            logDebug(`Failed to write auto-accept to stdin: ${e.message}`);
          }
        }
      });

      pscpProcess.on('error', (error) => {
        logDebug(`PSCP process error: ${error.message}`);
        if (session.activeTransfers) {
          session.activeTransfers.delete(transferId);
        }
        reject(error);
      });

      pscpProcess.on('close', (code) => {
        logDebug(`PSCP process closed with code ${code}`);
        if (session.activeTransfers) {
          session.activeTransfers.delete(transferId);
        }
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Transfer failed or was cancelled (exit code ${code})`));
        }
      });
    });
  }

  isSessionAlive(sessionId) {
    const session = this.sessions.get(String(sessionId));
    return !!(session && session.ready);
  }

  async reconnect(sessionId, connectionDetails) {
    const sId = String(sessionId);
    // Clean up old session first
    this.disconnect(sId);
    // Wait a beat for cleanup
    await new Promise(r => setTimeout(r, 200));
    return await this.connect(sId, connectionDetails);
  }

  disconnect(sessionId) {
    const sId = String(sessionId);
    const session = this.sessions.get(sId);
    if (session) {
      if (session.activeTransfers) {
        for (const pscpProcess of session.activeTransfers.values()) {
          try { pscpProcess.kill(); } catch (e) {}
        }
        session.activeTransfers.clear();
      }
      try { session.process.stdin.write('quit\n'); } catch (e) { /* ignore */ }
      this.sessions.delete(sId);
    }
  }

  cancelTransfer(sessionId, transferId) {
    const sId = String(sessionId);
    const session = this.sessions.get(sId);
    if (session) {
      if (session.activeTransfers && session.activeTransfers.has(transferId)) {
        logDebug(`Cancelling SFTP transfer ${transferId} for session ${sId} by killing its process.`);
        const pscpProcess = session.activeTransfers.get(transferId);
        try {
          pscpProcess.kill();
        } catch (e) {
          logDebug(`Error killing transfer process ${transferId}: ${e.message}`);
        }
        session.activeTransfers.delete(transferId);
        return true;
      } else {
        logDebug(`No active transfer with ID ${transferId} to cancel for session ${sId}`);
      }
    }
    return false;
  }
}

module.exports = new SftpManager();
