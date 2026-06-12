const { spawn } = require('child_process');
const path = require('path');

class PuttyManager {
  constructor() {
    this.sessions = new Map();
    const isPackaged = __dirname.includes('app.asar');
    this.plinkPath = isPackaged
      ? path.join(process.resourcesPath, 'bin', 'plink.exe')
      : path.join(__dirname, '../bin/plink.exe');
  }

  connect(sessionId, connectionDetails, webContents) {
    if (this.sessions.has(sessionId)) {
      console.log(`SSH connection for session ${sessionId} is already alive. Reusing.`);
      return true;
    }
    const { 
      host, 
      port, 
      username, 
      password,
      connectionType, // 'ssh' | 'telnet' | 'rlogin' | 'raw' | 'serial'
      keyFile, // path to private key
      x11Forwarding, // boolean
      agentForwarding, // boolean
      compression, // boolean
      sshVersion, // 'default' | '2' | '1'
      extraArgs, // string
    } = connectionDetails;

    const args = [];

    // Connection Type
    if (connectionType === 'telnet') args.push('-telnet');
    else if (connectionType === 'rlogin') args.push('-rlogin');
    else if (connectionType === 'raw') args.push('-raw');
    else if (connectionType === 'serial') args.push('-serial');
    else args.push('-ssh'); // Default is SSH

    // Port
    if (connectionType !== 'serial') {
      args.push('-P', port || (connectionType === 'telnet' ? 23 : 22));
    }

    // Host
    args.push(host);

    // Username & Password
    if (username) args.push('-l', username);
    if (password) args.push('-pw', password);

    // Private key
    if (keyFile) args.push('-i', keyFile);

    // SSH protocol version
    if (sshVersion === '1') args.push('-1');
    else if (sshVersion === '2') args.push('-2');

    // X11 Forwarding
    if (x11Forwarding) args.push('-X');
    else if (connectionType === 'ssh' || !connectionType) args.push('-x');

    // Agent Forwarding
    if (agentForwarding) args.push('-A');
    else if (connectionType === 'ssh' || !connectionType) args.push('-a');

    // Compression
    if (compression) args.push('-C');

    // Custom Extra Arguments
    if (extraArgs && extraArgs.trim()) {
      const parsedExtra = extraArgs.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      args.push(...parsedExtra.map(arg => arg.replace(/^"|"$/g, '')));
    }

    // Add extra flags to avoid prompts for new host keys in automated tools
    // We can auto-accept or handle the prompt via stdin
    args.push('-batch'); // Disable all interactive prompts

    const puttyProcess = spawn(this.plinkPath, args, {
      windowsHide: true, // Hide the console window
    });

    this.sessions.set(sessionId, puttyProcess);

    // Handle incoming data
    puttyProcess.stdout.on('data', (data) => {
      // Send raw ansi escape sequence data to the frontend xterm terminal
      if (!webContents.isDestroyed()) {
        webContents.send(`pty-data-${sessionId}`, data.buffer);
      }
    });

    puttyProcess.stderr.on('data', (data) => {
      // Often contains login warnings or key prompts
      const strData = data.toString();
      if (strData.includes('Store key in cache')) {
        // Automatically accept the host key
        puttyProcess.stdin.write('y\n');
      }
      if (!webContents.isDestroyed()) {
        webContents.send(`pty-data-${sessionId}`, data.buffer);
      }
    });

    puttyProcess.on('close', (code) => {
      if (this.sessions.get(sessionId) === puttyProcess) {
        this.sessions.delete(sessionId);
      }
      if (!webContents.isDestroyed()) {
        webContents.send(`pty-exit-${sessionId}`, code);
      }
    });

    return true;
  }

  write(sessionId, data) {
    const puttyProcess = this.sessions.get(sessionId);
    if (puttyProcess) {
      puttyProcess.stdin.write(data);
    }
  }

  resize(sessionId, cols, rows) {
    // plink doesn't have an easy way to trigger window size changes like node-pty
    // usually requires sending SSH shell window size messages manually, 
    // or just relying on xterm.js fit addon and clearing.
    // For now we'll send a resize escape sequence or let the remote know 
  }

  disconnect(sessionId) {
    const puttyProcess = this.sessions.get(sessionId);
    if (puttyProcess) {
      puttyProcess.kill();
      this.sessions.delete(sessionId);
    }
  }
}

module.exports = new PuttyManager();
