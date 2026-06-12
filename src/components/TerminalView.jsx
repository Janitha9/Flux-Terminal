import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

export default function TerminalView({ session, theme, settings = {}, onStatusChange }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current || !session) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: settings.cursorBlinking !== undefined ? settings.cursorBlinking : true,
      cursorStyle: 'block',
      fontFamily: settings.fontFamily ? `'${settings.fontFamily}', monospace` : "'Fira Code', 'Courier New', monospace",
      fontSize: settings.fontSize || 14,
      scrollback: settings.scrollback || 5000,
      theme: theme?.colors || {
        background: '#0f111a',
        foreground: '#e2e8f0',
        cursor: '#3b82f6',
      },
      allowTransparency: true,
      copyOnSelect: true, // Enable automatic copying on text selection
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current);
    fitAddon.fit();

    // Custom copy/paste key handler
    term.attachCustomKeyEventHandler((arg) => {
      if (arg.ctrlKey && !arg.shiftKey && !arg.altKey && !arg.metaKey) {
        const key = arg.key.toLowerCase();
        if (key === 'c') {
          if (term.hasSelection()) {
            if (arg.type === 'keydown') {
              const selectedText = term.getSelection();
              navigator.clipboard.writeText(selectedText);
            }
            return false; // Prevent sending Ctrl+C (SIGINT) when copying text
          }
        } else if (key === 'v') {
          if (arg.type === 'keydown') {
            navigator.clipboard.readText().then(text => {
              window.electronAPI.ptyWrite(session.id, text);
            }).catch(err => {
              console.error('Failed to read clipboard:', err);
            });
          }
          return false; // Prevent sending Ctrl+V character
        }
      }
      return true;
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to backend via IPC
    window.electronAPI.ptyConnect(session.id, session)
      .then(() => {
        if (onStatusChange) onStatusChange(session.id, 'connected');
      })
      .catch((err) => {
        term.writeln(`\r\n\x1b[38;2;239;68;68m[Flux Terminal]\x1b[0m Connection failed: ${err.message || err}`);
        if (onStatusChange) onStatusChange(session.id, 'disconnected');
      });

    window.electronAPI.sftpConnect(session.id, session);

    // Initial greeting / connecting message
    term.writeln(`\x1b[38;2;59;130;246m[Flux Terminal]\x1b[0m Connecting to ${session.username ? session.username + '@' : ''}${session.host}:${session.port || 22}...`);

    // Handle user input
    const disposable = term.onData((data) => {
      window.electronAPI.ptyWrite(session.id, data);
    });

    // Handle incoming data
    window.electronAPI.onPtyData(session.id, (data) => {
      // The data is sent as an ArrayBuffer from IPC
      const text = new TextDecoder().decode(data);
      term.write(text);
    });

    // Handle session exit
    window.electronAPI.onPtyExit(session.id, (code) => {
      term.writeln(`\r\n\x1b[38;2;239;68;68m[Flux Terminal]\x1b[0m Session closed with code ${code}.`);
      if (onStatusChange) onStatusChange(session.id, 'disconnected');
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        window.electronAPI.ptyResize(session.id, term.cols, term.rows);
      } catch (e) {
        // fitAddon might throw if terminal is hidden
      }
    });
    
    resizeObserver.observe(terminalRef.current);

    return () => {
      disposable.dispose();
      resizeObserver.disconnect();
      window.electronAPI.removePtyListeners(session.id);
      window.electronAPI.ptyDisconnect(session.id);
      window.electronAPI.sftpDisconnect(session.id);
      term.dispose();
    };
  }, [session.id]); // Re-run when session ID changes

  // Update options dynamically
  useEffect(() => {
    if (xtermRef.current) {
      if (theme?.colors) xtermRef.current.options.theme = theme.colors;
      
      const targetFontFamily = settings.fontFamily ? `'${settings.fontFamily}', monospace` : "'Fira Code', 'Courier New', monospace";
      if (xtermRef.current.options.fontFamily !== targetFontFamily) {
        xtermRef.current.options.fontFamily = targetFontFamily;
      }
      
      const targetFontSize = settings.fontSize || 14;
      if (xtermRef.current.options.fontSize !== targetFontSize) {
        xtermRef.current.options.fontSize = targetFontSize;
      }

      const targetCursorBlink = settings.cursorBlinking !== undefined ? settings.cursorBlinking : true;
      if (xtermRef.current.options.cursorBlink !== targetCursorBlink) {
        xtermRef.current.options.cursorBlink = targetCursorBlink;
      }

      const targetScrollback = settings.scrollback || 5000;
      if (xtermRef.current.options.scrollback !== targetScrollback) {
        xtermRef.current.options.scrollback = targetScrollback;
      }
    }
  }, [theme, settings]);

  // We wrap the terminal in a flex container that grows to fill space
  return (
    <div className="w-full h-full flex flex-col pt-10" style={{ backgroundColor: theme?.colors?.background || '#0f111a' }}>
       {/* Small tab / header area for the active session context */}
      <div className="flex px-4 py-2 border-b border-white/5 bg-black/20 text-xs text-gray-400 font-mono justify-between items-center">
        <div className="flex items-center space-x-2">
           <span className={`w-2 h-2 rounded-full ${session.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
           <span>{session.username ? `${session.username}@` : ''}{session.host}</span>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 w-full h-full p-2 overflow-hidden" />
    </div>
  );
}
