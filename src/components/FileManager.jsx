import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  File, Folder, HardDrive, Download, Upload, Trash2, ArrowLeft, RefreshCw, 
  AlertCircle, FolderPlus, FilePlus, MoreVertical, Pencil, Copy, Move, 
  Info, X, WifiOff, RotateCcw
} from 'lucide-react';

function hexToRgba(hex, alpha) {
  if (!hex) return '';
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isLightTheme(theme) {
  if (!theme?.colors?.background) return false;
  const hex = theme.colors.background.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

// ─── Context Menu ─────────────────────────────────────────────
function ContextMenu({ x, y, file, onAction, onClose, theme }) {
  const menuRef = useRef(null);
  const light = isLightTheme(theme);
  const fg = theme?.colors?.foreground || '#e2e8f0';
  const bg = theme?.colors?.background || '#1a1d27';
  const menuBg = light ? hexToRgba(bg, 0.97) : 'rgba(22,25,42,0.98)';
  const borderColor = light ? hexToRgba(fg, 0.12) : 'rgba(255,255,255,0.08)';
  const hoverBg = light ? hexToRgba(fg, 0.07) : 'rgba(255,255,255,0.06)';
  const mutedFg = light ? hexToRgba(fg, 0.6) : 'rgba(180,190,210,0.7)';

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = file ? [
    { label: 'Rename', icon: Pencil, action: 'rename' },
    { label: 'Delete', icon: Trash2, action: 'delete', danger: true },
    { divider: true },
    ...(file.isDir ? [] : [{ label: 'Download', icon: Download, action: 'download' }]),
    { divider: true },
    { label: 'Properties', icon: Info, action: 'properties' },
  ] : [
    { label: 'New Folder', icon: FolderPlus, action: 'newFolder' },
    { label: 'New File', icon: FilePlus, action: 'newFile' },
    { divider: true },
    { label: 'Refresh', icon: RefreshCw, action: 'refresh' },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[999] min-w-[180px] rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: y, left: x,
        backgroundColor: menuBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
      }}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="my-1" style={{ borderTop: `1px solid ${borderColor}` }} />
        ) : (
          <button
            key={i}
            onClick={() => { onAction(item.action, file); onClose(); }}
            className="w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors"
            style={{ color: item.danger ? (theme?.colors?.red || '#ef4444') : fg }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = item.danger ? 'rgba(239,68,68,0.1)' : hoverBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        )
      )}
    </div>
  );
}

// ─── Modal Dialog ─────────────────────────────────────────────
function ModalDialog({ title, value, onChange, onConfirm, onCancel, confirmLabel = 'Create', confirmDanger = false, theme }) {
  const inputRef = useRef(null);
  const light = isLightTheme(theme);
  const fg = theme?.colors?.foreground || '#e2e8f0';
  const bg = theme?.colors?.background || '#1a1d27';
  const accent = theme?.colors?.blue || '#3b82f6';
  const modalBg = light ? hexToRgba(bg, 0.97) : 'rgba(22,25,42,0.97)';
  const borderColor = light ? hexToRgba(fg, 0.12) : 'rgba(255,255,255,0.08)';
  const inputBg = light ? hexToRgba(fg, 0.07) : 'rgba(0,0,0,0.35)';

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: modalBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${borderColor}`,
        }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: fg }}>{title}</h3>
        {onChange !== undefined && (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none mb-4 font-mono"
            style={{
              backgroundColor: inputBg,
              color: fg,
              border: `1px solid ${borderColor}`,
            }}
          />
        )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{ color: hexToRgba(fg, 0.6) }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = hexToRgba(fg, 0.07); e.currentTarget.style.color = fg; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = hexToRgba(fg, 0.6); }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: confirmDanger ? 'rgba(239,68,68,0.15)' : hexToRgba(accent, 0.15),
              color: confirmDanger ? (theme?.colors?.red || '#ef4444') : accent,
              border: `1px solid ${confirmDanger ? 'rgba(239,68,68,0.3)' : hexToRgba(accent, 0.3)}`,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Properties Dialog ────────────────────────────────────────
function PropertiesDialog({ file, currentPath, onClose, theme }) {
  const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
  const light = isLightTheme(theme);
  const fg = theme?.colors?.foreground || '#e2e8f0';
  const bg = theme?.colors?.background || '#1a1d27';
  const accent = theme?.colors?.blue || '#3b82f6';
  const modalBg = light ? hexToRgba(bg, 0.97) : 'rgba(22,25,42,0.97)';
  const borderColor = light ? hexToRgba(fg, 0.12) : 'rgba(255,255,255,0.08)';
  const mutedText = light ? hexToRgba(fg, 0.55) : 'rgba(150,160,180,0.7)';
  const cardBg = light ? hexToRgba(fg, 0.05) : 'rgba(0,0,0,0.2)';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: modalBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${borderColor}`,
        }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold" style={{ color: fg }}>Properties</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: mutedText }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = hexToRgba(fg, 0.07); e.currentTarget.style.color = fg; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = mutedText; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center space-x-3 mb-5 p-3 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
          {file.isDir
            ? <Folder className="w-8 h-8 flex-shrink-0" style={{ color: theme?.colors?.yellow || '#f59e0b' }} />
            : <File className="w-8 h-8 flex-shrink-0" style={{ color: accent }} />
          }
          <div>
            <div className="text-sm font-medium truncate max-w-[200px]" style={{ color: fg }}>{file.name}</div>
            <div className="text-xs" style={{ color: mutedText }}>{file.isDir ? 'Directory' : 'File'}</div>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span style={{ color: mutedText }}>Path</span>
            <span className="font-mono text-xs truncate max-w-[180px]" style={{ color: fg }} title={fullPath}>{fullPath}</span>
          </div>
          {!file.isDir && (
            <div className="flex justify-between">
              <span style={{ color: mutedText }}>Size</span>
              <span className="font-mono text-xs" style={{ color: fg }}>{formatSize(file.size)}</span>
            </div>
          )}
          {file.date && (
            <div className="flex justify-between">
              <span style={{ color: mutedText }}>Modified</span>
              <span className="font-mono text-xs" style={{ color: fg }}>{file.date}</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-5 px-4 py-2 text-sm rounded-lg transition-colors"
          style={{ color: fg, backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function formatSize(bytes) {
  const n = Number(bytes);
  if (isNaN(n) || n === 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
  return `${(n / 1073741824).toFixed(1)} GB`;
}

// ─── Main FileManager ────────────────────────────────────────
export default function FileManager({ session, isActive, onClose, defaultDirectory = '/', autoReconnect = true, onStatusChange, theme }) {
  const [currentPath, setCurrentPath] = useState(defaultDirectory);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [disconnected, setDisconnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [sftpReady, setSftpReady] = useState(false);
  const [transfers, setTransfers] = useState([]);

  const addTransfer = (type, name) => {
    const id = Date.now().toString() + Math.random().toString();
    setTransfers(prev => [...prev, { id, type, name, status: 'progress' }]);
    return id;
  };

  const updateTransferStatus = (id, status) => {
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    if (status === 'completed') {
      setTimeout(() => {
        setTransfers(prev => prev.filter(t => t.id !== id));
      }, 3000);
    }
  };

  const removeTransferItem = (id) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
  };

  const light = isLightTheme(theme);
  const fg = theme?.colors?.foreground || '#e2e8f0';
  const bg = theme?.colors?.background || '#1a1d27';
  const accent = theme?.colors?.blue || '#3b82f6';
  const accentYellow = theme?.colors?.yellow || '#f59e0b';

  const panelBg    = light ? bg                          : hexToRgba(theme?.colors?.black || '#0f111a', 0.82);
  const borderColor= light ? hexToRgba(fg, 0.1)          : 'rgba(255,255,255,0.06)';
  const toolbarBg  = light ? hexToRgba(fg, 0.04)         : 'rgba(0,0,0,0.2)';
  const btnBg      = light ? hexToRgba(fg, 0.08)         : 'rgba(255,255,255,0.06)';
  const btnHover   = light ? hexToRgba(fg, 0.14)         : 'rgba(255,255,255,0.1)';
  const addrBg     = light ? hexToRgba(fg, 0.06)         : 'rgba(0,0,0,0.3)';
  const tableBg    = light ? hexToRgba(fg, 0.03)         : 'rgba(0,0,0,0.2)';
  const tableHead  = light ? hexToRgba(fg, 0.06)         : 'rgba(255,255,255,0.03)';
  const dividerColor= light ? hexToRgba(fg, 0.08)        : 'rgba(255,255,255,0.05)';
  const mutedText  = light ? hexToRgba(fg, 0.5)          : 'rgba(150,160,180,0.65)';
  const rowHover   = light ? hexToRgba(accent, 0.07)     : hexToRgba(accent, 0.06);
  const statusBg   = light ? hexToRgba(fg, 0.04)         : 'rgba(0,0,0,0.2)';

  const loadDirectory = useCallback(async (path) => {
    setLoading(true);
    setError(null);
    setDisconnected(false);
    try {
      const result = await window.electronAPI.sftpList(session.id, path);
      setFiles(result);
      setCurrentPath(path);
      if (onStatusChange) onStatusChange(session.id, 'connected');
    } catch (err) {
      if (err.message?.includes('Session not found') || err.message?.includes('SFTP closed')) {
        setDisconnected(true);
        if (onStatusChange) onStatusChange(session.id, 'disconnected');
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session, onStatusChange]);

  // Connect SFTP on mount, then list directory
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSftpReady(false);
    window.electronAPI.sftpConnect(session.id, session)
      .then((connResult) => {
        if (cancelled) return;
        setSftpReady(true);
        if (onStatusChange) onStatusChange(session.id, 'connected');
        const initialDir = (defaultDirectory && defaultDirectory !== '/')
          ? defaultDirectory
          : (connResult && connResult.homeDir ? connResult.homeDir : '/');
        
        setCurrentPath(initialDir);
        return window.electronAPI.sftpList(session.id, initialDir);
      })
      .then((result) => {
        if (cancelled || !result) return;
        setFiles(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError('SFTP connect failed: ' + (err?.message || err));
        if (onStatusChange) onStatusChange(session.id, 'disconnected');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [session.id, onStatusChange]);

  // Subscribe to SFTP transfer progress updates
  useEffect(() => {
    if (!session || !sftpReady) return;
    
    window.electronAPI.onSftpProgress(session.id, (data) => {
      setTransfers(prev => prev.map(t => t.id === data.transferId ? {
        ...t,
        speed: data.speed,
        percentage: data.percentage,
        transferred: data.transferred
      } : t));
    });

    return () => {
      window.electronAPI.removeSftpListeners(session.id);
    };
  }, [session.id, sftpReady]);

  // Load directory when tab becomes active
  useEffect(() => {
    if (isActive && sftpReady) {
      loadDirectory(currentPath);
    }
  }, [isActive, sftpReady, loadDirectory, currentPath]);

  const handleNavigate = (file) => {
    if (file.isDir) {
      const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      loadDirectory(newPath);
    }
  };

  const handleGoUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    loadDirectory('/' + parts.join('/'));
  };

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      await window.electronAPI.sftpReconnect(session.id, session);
      setDisconnected(false);
      setError(null);
      if (onStatusChange) onStatusChange(session.id, 'connected');
      await loadDirectory(currentPath);
    } catch (err) {
      setError('Reconnect failed: ' + err.message);
    } finally {
      setReconnecting(false);
    }
  };

  useEffect(() => {
    if (disconnected && autoReconnect && !reconnecting) {
      handleReconnect();
    }
  }, [disconnected, autoReconnect]);

  const handleAction = async (action, file) => {
    switch (action) {
      case 'newFolder': setModal({ type: 'newFolder', value: '' }); break;
      case 'newFile':   setModal({ type: 'newFile', value: '' }); break;
      case 'rename':    setModal({ type: 'rename', file, value: file.name }); break;
      case 'delete':    setModal({ type: 'delete', file }); break;
      case 'properties':setModal({ type: 'properties', file }); break;
      case 'refresh':   loadDirectory(currentPath); break;
      case 'download':
        if (file) {
          try {
            const localPath = await window.electronAPI.selectDownloadPath(file.name);
            if (!localPath) return;
            const remotePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
            
            const transferId = addTransfer('download', file.name);
            setError(null);
            
            window.electronAPI.sftpDownload(session.id, remotePath, localPath, transferId)
              .then(() => {
                updateTransferStatus(transferId, 'completed');
              })
              .catch((err) => {
                updateTransferStatus(transferId, 'error');
                if (!err.message?.includes('cancelled') && !err.message?.includes('exit code null')) {
                  setError('Download failed: ' + err.message);
                }
              });
          } catch (err) {
            setError('Download failed: ' + err.message);
          }
        }
        break;
      default: break;
    }
  };

  const handleModalConfirm = async () => {
    if (!modal) return;
    const fullPath = (p) => currentPath === '/' ? `/${p}` : `${currentPath}/${p}`;
    try {
      switch (modal.type) {
        case 'newFolder':
          if (modal.value.trim()) await window.electronAPI.sftpMkdir(session.id, fullPath(modal.value.trim()));
          break;
        case 'newFile':
          if (modal.value.trim()) await window.electronAPI.sftpNewFile(session.id, fullPath(modal.value.trim()));
          break;
        case 'rename':
          if (modal.value.trim() && modal.value.trim() !== modal.file.name)
            await window.electronAPI.sftpRename(session.id, fullPath(modal.file.name), fullPath(modal.value.trim()));
          break;
        case 'delete':
          await window.electronAPI.sftpDelete(session.id,
            currentPath === '/' ? `/${modal.file.name}` : `${currentPath}/${modal.file.name}`,
            modal.file.isDir
          );
          break;
      }
    } catch (err) { setError(err.message); }
    setModal(null);
    loadDirectory(currentPath);
  };

  const handleContextMenu = (e, file = null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const BtnStyle = { backgroundColor: btnBg, border: `1px solid ${borderColor}`, color: fg };

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ backgroundColor: panelBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', color: fg }}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0 flex-wrap"
        style={{ borderBottom: `1px solid ${borderColor}`, backgroundColor: toolbarBg }}
      >
        {/* Nav buttons */}
        <button
          onClick={handleGoUp}
          disabled={currentPath === '/'}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-30 flex-shrink-0"
          style={BtnStyle}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = btnHover; }}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = btnBg}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => loadDirectory(currentPath)}
          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
          style={BtnStyle}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = btnHover}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = btnBg}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: loading ? accent : fg }} />
        </button>

        {/* Address Bar */}
        <div
          className="flex-1 min-w-0 flex items-center px-3 py-1.5 rounded-lg shadow-inner"
          style={{ backgroundColor: addrBg, border: `1px solid ${borderColor}` }}
        >
          <HardDrive className="w-3.5 h-3.5 mr-2 flex-shrink-0" style={{ color: theme?.colors?.magenta || '#8b5cf6' }} />
          <span className="text-xs font-mono truncate" style={{ color: fg }}>
            {session.host}:{currentPath}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleAction('newFolder')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={BtnStyle}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = btnHover}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = btnBg}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Folder</span>
          </button>
          <button
            onClick={() => handleAction('newFile')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={BtnStyle}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = btnHover}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = btnBg}
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New File</span>
          </button>
          <button
            onClick={async () => {
              try {
                const localPath = await window.electronAPI.selectUploadFile();
                if (!localPath) return;
                
                const parts = localPath.split(/[\\/]/);
                const filename = parts[parts.length - 1];
                const remotePath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
                
                const transferId = addTransfer('upload', filename);
                setError(null);
                
                window.electronAPI.sftpUpload(session.id, localPath, remotePath, transferId)
                  .then(async () => {
                    updateTransferStatus(transferId, 'completed');
                    await loadDirectory(currentPath);
                  })
                  .catch((err) => {
                    updateTransferStatus(transferId, 'error');
                    if (!err.message?.includes('cancelled') && !err.message?.includes('exit code null')) {
                      setError('Upload failed: ' + err.message);
                    }
                  });
              } catch (err) {
                setError('Upload failed: ' + err.message);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: hexToRgba(accent, 0.12),
              border: `1px solid ${hexToRgba(accent, 0.3)}`,
              color: accent,
            }}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      {/* ── Reconnect Banner ── */}
      {disconnected && (
        <div
          className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderBottom: `1px solid rgba(245,158,11,0.25)` }}
        >
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4" style={{ color: accentYellow }} />
            <span className="text-sm" style={{ color: accentYellow }}>Session disconnected.</span>
          </div>
          <button
            onClick={handleReconnect}
            disabled={reconnecting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: accentYellow }}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${reconnecting ? 'animate-spin' : ''}`} />
            <span>{reconnecting ? 'Reconnecting...' : 'Reconnect'}</span>
          </button>
        </div>
      )}

      {/* ── Transfers Progress Bar ── */}
      {transfers.length > 0 && (
        <div
          className="flex flex-col gap-1.5 px-4 py-2 flex-shrink-0 animate-in slide-in-from-top duration-200"
          style={{
            backgroundColor: hexToRgba(accent, 0.08),
            borderBottom: `1px solid ${hexToRgba(accent, 0.2)}`,
          }}
        >
          {transfers.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-xs animate-in fade-in duration-200 py-1">
              <div className="flex items-center space-x-2 min-w-0">
                {t.type === 'upload' ? (
                  <Upload className={`w-3.5 h-3.5 flex-shrink-0 ${t.status === 'progress' ? 'animate-bounce text-blue-400' : t.status === 'completed' ? 'text-green-400' : 'text-red-400'}`} />
                ) : (
                  <Download className={`w-3.5 h-3.5 flex-shrink-0 ${t.status === 'progress' ? 'animate-bounce text-blue-400' : t.status === 'completed' ? 'text-green-400' : 'text-red-400'}`} />
                )}
                <span className="truncate" style={{ color: fg }}>
                  {t.type === 'upload' ? 'Uploading' : 'Downloading'}{' '}
                  <strong className="font-semibold">{t.name}</strong>
                  {t.status === 'completed' ? (
                    <span className="text-green-400 ml-2 font-medium">✓ Completed</span>
                  ) : t.status === 'error' ? (
                    <span className="text-red-400 ml-2 font-medium">✗ Failed/Cancelled</span>
                  ) : (
                    <span className="opacity-60 ml-2">in progress...</span>
                  )}
                </span>
              </div>
              
              {t.status === 'progress' && (
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className="text-[10px] opacity-80 font-mono">
                    {t.transferred && `${t.transferred}`}
                    {t.speed && ` (${t.speed})`}
                  </span>
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: hexToRgba(fg, 0.1) }}>
                    <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${t.percentage || 0}%` }} />
                  </div>
                  <span className="text-[10px] font-mono w-8 text-right">{t.percentage || 0}%</span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await window.electronAPI.sftpCancel(session.id, t.id);
                      updateTransferStatus(t.id, 'error');
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Cancel transfer"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {t.status !== 'progress' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTransferItem(t.id);
                  }}
                  className="p-1 rounded text-xs opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 ml-3"
                  style={{ color: fg }}
                  title="Clear notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── File List ── */}
      <div
        className="flex-1 overflow-y-auto p-4 custom-scrollbar"
        onContextMenu={(e) => handleContextMenu(e, null)}
      >
        {/* Error */}
        {error && !disconnected && (
          <div className="mb-4 rounded-lg p-3 flex items-start space-x-3"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: theme?.colors?.red || '#ef4444' }} />
            <div className="text-sm flex-1" style={{ color: theme?.colors?.red || '#ef4444' }}>{error}</div>
            <button onClick={() => setError(null)} style={{ color: theme?.colors?.red || '#ef4444' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: hexToRgba(fg, 0.06) }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {files.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-full">
            <Folder className="w-16 h-16 mb-4 opacity-20" style={{ color: fg }} />
            <p className="text-sm" style={{ color: mutedText }}>This folder is empty.</p>
            <p className="text-xs mt-1" style={{ color: hexToRgba(fg, 0.3) }}>Right-click to create a new file or folder</p>
          </div>
        )}

        {/* File Table */}
        {files.length > 0 && !loading && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: tableBg, border: `1px solid ${borderColor}` }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ backgroundColor: tableHead, borderBottom: `1px solid ${dividerColor}` }}>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: mutedText }}>Name</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider w-24" style={{ color: mutedText }}>Size</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider w-36 hidden md:table-cell" style={{ color: mutedText }}>Modified</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider w-36 text-right" style={{ color: mutedText }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, idx) => (
                  <tr
                    key={idx}
                    onDoubleClick={() => handleNavigate(file)}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="group transition-colors cursor-pointer"
                    style={{ borderBottom: idx < files.length - 1 ? `1px solid ${dividerColor}` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = rowHover}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {file.isDir ? (
                          <Folder className="w-4 h-4 flex-shrink-0" style={{ color: theme?.colors?.yellow || '#f59e0b' }} />
                        ) : (
                          <File className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
                        )}
                        <span className="text-sm font-medium truncate max-w-[280px]" style={{ color: fg }} title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="text-xs font-mono" style={{ color: mutedText }}>
                        {file.isDir ? '—' : formatSize(file.size)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap hidden md:table-cell">
                      <span className="text-xs font-mono" style={{ color: mutedText }}>{file.date || '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!file.isDir && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAction('download', file); }}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: mutedText }}
                            title="Download"
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = hexToRgba(fg, 0.08); e.currentTarget.style.color = fg; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = mutedText; }}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction('rename', file); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: mutedText }}
                          title="Rename"
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = hexToRgba(fg, 0.08); e.currentTarget.style.color = fg; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = mutedText; }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction('delete', file); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: mutedText }}
                          title="Delete"
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = theme?.colors?.red || '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = mutedText; }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction('properties', file); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: mutedText }}
                          title="Properties"
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = hexToRgba(fg, 0.08); e.currentTarget.style.color = fg; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = mutedText; }}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Status Bar ── */}
      <div
        className="px-4 py-1.5 flex items-center justify-between text-xs flex-shrink-0"
        style={{ borderTop: `1px solid ${borderColor}`, backgroundColor: statusBg, color: mutedText }}
      >
        <span>{files.length} items</span>
        <span className="font-mono truncate max-w-[60%] text-right">{currentPath}</span>
      </div>

      {/* Context Menu */}
      {contextMenu && createPortal(
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onAction={handleAction}
          onClose={() => setContextMenu(null)}
          theme={theme}
        />,
        document.body
      )}

      {/* Modals */}
      {modal?.type === 'newFolder' && (
        <ModalDialog title="Create New Folder" value={modal.value}
          onChange={(v) => setModal({ ...modal, value: v })}
          onConfirm={handleModalConfirm} onCancel={() => setModal(null)}
          confirmLabel="Create" theme={theme} />
      )}
      {modal?.type === 'newFile' && (
        <ModalDialog title="Create New File" value={modal.value}
          onChange={(v) => setModal({ ...modal, value: v })}
          onConfirm={handleModalConfirm} onCancel={() => setModal(null)}
          confirmLabel="Create" theme={theme} />
      )}
      {modal?.type === 'rename' && (
        <ModalDialog title={`Rename "${modal.file.name}"`} value={modal.value}
          onChange={(v) => setModal({ ...modal, value: v })}
          onConfirm={handleModalConfirm} onCancel={() => setModal(null)}
          confirmLabel="Rename" theme={theme} />
      )}
      {modal?.type === 'delete' && (
        <ModalDialog title={`Delete "${modal.file.name}"?`}
          onConfirm={handleModalConfirm} onCancel={() => setModal(null)}
          confirmLabel="Delete" confirmDanger theme={theme} />
      )}
      {modal?.type === 'properties' && (
        <PropertiesDialog file={modal.file} currentPath={currentPath} onClose={() => setModal(null)} theme={theme} />
      )}
    </div>
  );
}
