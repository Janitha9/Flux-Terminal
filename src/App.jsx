import React, { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import ConnectionDialog from './components/ConnectionDialog';
import TerminalView from './components/TerminalView';
import FileManager from './components/FileManager';
import ThemeSelector from './components/ThemeSelector';
import SettingsView from './components/SettingsView';
import { defaultTheme, themes } from './themes';
import { Terminal, Palette, FolderGit2, RotateCcw, LogOut, X, Plus } from 'lucide-react';
import SessionDetailsDialog from './components/SessionDetailsDialog';

function hexToRgba(hex, alpha) {
  if (!hex) return '';
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const defaultSettings = {
  cursorBlinking: true,
  fontFamily: 'Fira Code',
  fontSize: 14,
  scrollback: 5000,
  defaultDirectory: '/',
  autoReconnect: true,
  sshKeepalive: true,
  sshKeepaliveInterval: 30,
};

function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [isSessionDetailsOpen, setIsSessionDetailsOpen] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState(defaultTheme.id);
  const [activeTab, setActiveTab] = useState('terminal');
  const [settings, setSettings] = useState(defaultSettings);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isResizing = React.useRef(false);
  const startX = React.useRef(0);
  const startWidth = React.useRef(240);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainAreaWidth = windowWidth - sidebarWidth;
  const showButtonText = mainAreaWidth > 720;
  const showSessionInfoText = mainAreaWidth > 560;
  const showTabText = mainAreaWidth > 480;

  const currentTheme = themes[currentThemeId] || defaultTheme;
  const selectedSession = activeSessions.find(s => String(s.id) === String(selectedSessionId));

  // Load saved sessions, theme & settings on mount
  useEffect(() => {
    async function loadData() {
      const savedSessions = await window.electronAPI.storeGet('sessions') || [];
      const savedTheme = await window.electronAPI.storeGet('themeId');
      const savedSettings = await window.electronAPI.storeGet('settings') || {};
      setSessions(savedSessions);
      if (savedTheme && themes[savedTheme]) {
        setCurrentThemeId(savedTheme);
      }
      setSettings(prev => ({ ...prev, ...savedSettings }));
    }
    loadData();
  }, []);

  const handleSaveSession = (sessionData) => {
    const updatedSessions = [...sessions, { ...sessionData, status: 'saved' }];
    setSessions(updatedSessions);
    window.electronAPI.storeSet('sessions', updatedSessions);
  };

  const handleDeleteSession = (sessionId) => {
    const updatedSessions = sessions.filter(s => String(s.id) !== String(sessionId));
    setSessions(updatedSessions);
    window.electronAPI.storeSet('sessions', updatedSessions);
    if (String(selectedSessionId) === String(sessionId)) {
      handleDisconnectSession(sessionId);
    }
  };

  const handleConnect = (sessionData) => {
    setIsConnectionDialogOpen(false);
    const sessionId = sessionData.id || `session-${Date.now()}`;
    const alreadyActive = activeSessions.find(s => String(s.id) === String(sessionId));
    if (alreadyActive) {
      setSelectedSessionId(sessionId);
      return;
    }
    const newSession = {
      ...sessionData,
      id: sessionId,
      status: 'connected',
      activeSubTab: 'terminal'
    };
    setActiveSessions(prev => [...prev, newSession]);
    setSelectedSessionId(sessionId);
  };

  const handleDisconnectSession = (sessionId) => {
    setActiveSessions(prev => {
      const updated = prev.filter(s => String(s.id) !== String(sessionId));
      if (String(selectedSessionId) === String(sessionId)) {
        if (updated.length > 0) {
          setSelectedSessionId(updated[updated.length - 1].id);
        } else {
          setSelectedSessionId(null);
        }
      }
      return updated;
    });
  };

  const handleDisconnect = () => {
    if (selectedSessionId) {
      handleDisconnectSession(selectedSessionId);
    }
  };

  const handleReconnect = () => {
    if (selectedSessionId) {
      const current = activeSessions.find(s => String(s.id) === String(selectedSessionId));
      if (current) {
        setActiveSessions(prev => prev.filter(s => String(s.id) !== String(selectedSessionId)));
        setTimeout(() => {
          setActiveSessions(prev => [...prev, current]);
          setSelectedSessionId(selectedSessionId);
        }, 100);
      }
    }
  };

  const handleUpdateSessionTab = (sessionId, subTab) => {
    setActiveSessions(prev => prev.map(s => String(s.id) === String(sessionId) ? { ...s, activeSubTab: subTab } : s));
  };

  const handleSessionStatusChange = React.useCallback((sessionId, status) => {
    setActiveSessions(prev => {
      const session = prev.find(s => String(s.id) === String(sessionId));
      if (session && session.status === status) return prev;
      return prev.map(s => String(s.id) === String(sessionId) ? { ...s, status } : s);
    });
  }, []);

  const handleThemeSelect = (themeId) => {
    setCurrentThemeId(themeId);
    window.electronAPI.storeSet('themeId', themeId);
  };

  const handleUpdateSettings = (updatedFields) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updatedFields };
      window.electronAPI.storeSet('settings', newSettings);
      return newSettings;
    });
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setIsSessionDetailsOpen(true);
  };

  const handleUpdateSavedSession = (updatedSession) => {
    const updated = sessions.map(s => String(s.id) === String(updatedSession.id) ? updatedSession : s);
    setSessions(updated);
    window.electronAPI.storeSet('sessions', updated);
    
    // Also update activeSession details dynamically if connected
    setActiveSessions(prev => prev.map(s => String(s.id) === String(updatedSession.id) ? { ...s, ...updatedSession } : s));
  };

  const [toast, setToast] = useState(null);
  const [backupModal, setBackupModal] = useState(null); // 'export' | 'decrypt'
  const [backupEncrypt, setBackupEncrypt] = useState(false);
  const [backupPass, setBackupPass] = useState('');
  const [importFilePath, setImportFilePath] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleExportBackup = () => {
    setBackupModal('export');
  };

  const executeExportBackup = async (password) => {
    try {
      const backupData = {
        version: '1.0.0',
        timestamp: Date.now(),
        sessions: sessions,
        settings: settings,
        themeId: currentThemeId
      };
      const success = await window.electronAPI.exportBackup(JSON.stringify(backupData, null, 2), password);
      if (success) {
        showToast('Backup exported successfully!', 'success');
      }
    } catch (e) {
      showToast('Failed to export backup: ' + e.message, 'error');
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await window.electronAPI.importBackup();
      if (!result) return;

      if (result.isEncrypted) {
        setImportFilePath(result.filePath);
        setBackupModal('decrypt');
      } else {
        await applyBackupData(result.data);
      }
    } catch (e) {
      showToast('Failed to import backup: ' + e.message, 'error');
    }
  };

  const executeImportDecrypt = async (filePath, password) => {
    try {
      const data = await window.electronAPI.decryptBackup(filePath, password);
      if (data) {
        await applyBackupData(data);
      }
    } catch (e) {
      showToast('Incorrect password.', 'error');
    }
  };

  const applyBackupData = async (backupData) => {
    if (!backupData.sessions || !Array.isArray(backupData.sessions)) {
      showToast('Invalid backup file structure!', 'error');
      return;
    }
    
    await window.electronAPI.storeSet('sessions', backupData.sessions);
    if (backupData.settings) await window.electronAPI.storeSet('settings', backupData.settings);
    if (backupData.themeId) await window.electronAPI.storeSet('themeId', backupData.themeId);
    
    setSessions(backupData.sessions);
    if (backupData.settings) setSettings(backupData.settings);
    if (backupData.themeId && themes[backupData.themeId]) {
      setCurrentThemeId(backupData.themeId);
    }
    
    showToast('Backup imported and applied successfully!', 'success');
  };

  // ── Sidebar resize handlers ──
  const handleResizeStart = (e) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (e) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.max(180, Math.min(420, startWidth.current + delta));
      setSidebarWidth(newWidth);
    };
    const onUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans" style={{ backgroundColor: currentTheme.colors.background, color: currentTheme.colors.foreground }}>
      <TitleBar title={`Flux Terminal ${selectedSession ? `- ${selectedSession.name}` : ''}`} theme={currentTheme} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Ambient background glows for glassmorphism */}
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none z-0" style={{ backgroundColor: currentTheme.colors.blue + '10' }} />
        <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none z-0" style={{ backgroundColor: currentTheme.colors.magenta + '0d' }} />
        
        {/* Sidebar + resize handle */}
        <div
          className="h-full flex-shrink-0 flex"
          style={{ width: sidebarWidth }}
        >
          <Sidebar
            sessions={sessions}
            activeSession={selectedSession}
            activeSessions={activeSessions}
            onSelectSession={handleConnect}
            onNewSession={() => setIsConnectionDialogOpen(true)}
            onDeleteSession={handleDeleteSession}
            onEditSession={handleEditSession}
            onSettingsClick={() => {
              if (selectedSessionId) {
                handleUpdateSessionTab(selectedSessionId, 'settings');
              } else {
                setActiveTab('settings');
              }
            }}
            theme={currentTheme}
          />
          {/* Drag handle */}
          <div
            className="w-[5px] h-full flex-shrink-0 cursor-col-resize z-50 group/handle flex items-center justify-center"
            style={{ borderRight: `2px solid ${hexToRgba(currentTheme.colors.brightBlack, 0.15)}` }}
            onMouseDown={handleResizeStart}
            title="Drag to resize sidebar"
          >
            <div
              className="w-[3px] h-12 rounded-full opacity-0 group-hover/handle:opacity-100 transition-opacity duration-150"
              style={{ backgroundColor: currentTheme.colors.blue }}
            />
          </div>
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col relative bg-opacity-50 z-0">
          
          {/* Top Session Tabs Bar */}
          {activeSessions.length > 0 && (
            <div
              className="flex items-center px-4 py-1.5 gap-1.5 flex-shrink-0 flex-nowrap overflow-x-auto select-none"
              style={{
                borderBottom: `1px solid ${currentTheme.colors.brightBlack}22`,
                backgroundColor: currentTheme.colors.black + '15',
              }}
            >
              {activeSessions.map((session) => {
                const isActive = String(session.id) === String(selectedSessionId);
                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 border flex-shrink-0 group/tab animate-fade-in animate-zoom-in"
                    style={isActive
                      ? {
                          backgroundColor: hexToRgba(currentTheme.colors.blue, 0.15),
                          borderColor: hexToRgba(currentTheme.colors.blue, 0.35),
                          color: currentTheme.colors.blue,
                        }
                      : {
                          backgroundColor: hexToRgba(currentTheme.colors.black, 0.2),
                          borderColor: 'transparent',
                          color: currentTheme.colors.brightBlack,
                        }
                    }
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${session.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'} flex-shrink-0`} />
                    <span className="truncate max-w-[120px]">{session.name || session.host}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnectSession(session.id);
                      }}
                      className="p-0.5 rounded hover:bg-black/20 text-current opacity-40 hover:opacity-100 transition-opacity flex-shrink-0"
                      title="Disconnect session"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              <button
                onClick={() => setIsConnectionDialogOpen(true)}
                className="p-1 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                style={{
                  color: currentTheme.colors.brightBlack,
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = hexToRgba(currentTheme.colors.foreground, 0.08)}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Connect to another server"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Top action bar when a session is active */}
          {selectedSession && (
            <div
              className="top-bar-container flex items-center justify-between px-3 py-1.5 flex-shrink-0 flex-nowrap gap-1"
              style={{
                borderBottom: `1px solid ${currentTheme.colors.brightBlack}22`,
                backgroundColor: currentTheme.colors.black + '33',
              }}
            >
              {/* Tab buttons */}
              <div className="flex space-x-1 flex-shrink-0">
                <button
                  onClick={() => handleUpdateSessionTab(selectedSessionId, 'terminal')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 flex-shrink-0"
                  style={selectedSession.activeSubTab === 'terminal'
                    ? { backgroundColor: currentTheme.colors.blue + '25', color: currentTheme.colors.blue }
                    : { color: currentTheme.colors.brightBlack }
                  }
                >
                  <Terminal className="w-4 h-4 flex-shrink-0" />
                  {showTabText && <span>Terminal</span>}
                </button>
                <button
                  onClick={() => handleUpdateSessionTab(selectedSessionId, 'sftp')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 flex-shrink-0"
                  style={selectedSession.activeSubTab === 'sftp'
                    ? { backgroundColor: currentTheme.colors.blue + '25', color: currentTheme.colors.blue }
                    : { color: currentTheme.colors.brightBlack }
                  }
                >
                  <FolderGit2 className="w-4 h-4 flex-shrink-0" />
                  {showTabText && <span>SFTP Files</span>}
                </button>
              </div>

              {/* Right side controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Session info pill */}
                <div
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: hexToRgba(currentTheme.colors.green || '#10b981', 0.15),
                    border: `1px solid ${hexToRgba(currentTheme.colors.green || '#10b981', 0.3)}`,
                    color: currentTheme.colors.green || '#10b981',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse flex-shrink-0" />
                  {showSessionInfoText && (
                    <span className="truncate max-w-[100px] flex-shrink-0">{selectedSession.name || selectedSession.host}</span>
                  )}
                </div>

                {/* Reconnect button */}
                <button
                  onClick={handleReconnect}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                  style={{
                    color: currentTheme.colors.blue || '#3b82f6',
                    backgroundColor: hexToRgba(currentTheme.colors.blue || '#3b82f6', 0.1),
                    border: `1px solid ${hexToRgba(currentTheme.colors.blue || '#3b82f6', 0.2)}`,
                  }}
                  title="Reconnect session"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = hexToRgba(currentTheme.colors.blue, 0.2)}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = hexToRgba(currentTheme.colors.blue, 0.1)}
                >
                  <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
                  {showButtonText && <span className="flex-shrink-0">Reconnect</span>}
                </button>

                {/* Disconnect button */}
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                  style={{
                    color: currentTheme.colors.red || '#ef4444',
                    backgroundColor: hexToRgba(currentTheme.colors.red || '#ef4444', 0.1),
                    border: `1px solid ${hexToRgba(currentTheme.colors.red || '#ef4444', 0.2)}`,
                  }}
                  title="Disconnect session"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = hexToRgba(currentTheme.colors.red, 0.2)}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = hexToRgba(currentTheme.colors.red, 0.1)}
                >
                  <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                  {showButtonText && <span className="flex-shrink-0">Disconnect</span>}
                </button>

                {/* Theme picker */}
                <button
                  onClick={() => setIsThemeSelectorOpen(!isThemeSelectorOpen)}
                  className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: currentTheme.colors.foreground, opacity: 0.5 }}
                  title="Change Theme"
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = currentTheme.colors.magenta; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = currentTheme.colors.foreground; }}
                >
                  <Palette className="w-4 h-4 flex-shrink-0" />
                </button>
              </div>
            </div>
          )}

          {isThemeSelectorOpen && (
            <ThemeSelector 
              currentThemeId={currentThemeId} 
              onThemeSelect={handleThemeSelect} 
              onClose={() => setIsThemeSelectorOpen(false)}
              theme={currentTheme}
            />
          )}

          <div className="flex-1 overflow-hidden relative z-0">
            {activeSessions.length === 0 ? (
              // Empty State
              <div className="absolute inset-0 flex items-center justify-center p-6" style={{ backgroundColor: currentTheme.colors.background }}>
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: currentTheme.colors.blue + '18' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: currentTheme.colors.magenta + '15' }} />
                
                <div className="w-full max-w-lg p-8 rounded-2xl shadow-2xl flex flex-col items-center relative z-10"
                  style={{
                    backgroundColor: currentTheme.colors.black + 'cc',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${currentTheme.colors.brightBlack}33`,
                  }}
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${currentTheme.colors.blue}, ${currentTheme.colors.magenta})` }}>
                    <Terminal className="text-white w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-bold mb-2" style={{
                    backgroundImage: `linear-gradient(135deg, ${currentTheme.colors.blue}, ${currentTheme.colors.magenta})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    Flux Terminal
                  </h1>
                  <p className="text-center mb-8 max-w-sm text-sm" style={{ color: currentTheme.colors.brightBlack }}>
                    A beautiful, fast, and secure terminal emulator with PuTTY core, SFTP, and cloud backup.
                  </p>
                  
                  <button
                    onClick={() => setIsConnectionDialogOpen(true)}
                    className="w-full rounded-xl py-3 px-4 font-medium text-sm transition-all duration-200 shadow-sm"
                    style={{
                      backgroundColor: currentTheme.colors.blue + '18',
                      border: `1px solid ${currentTheme.colors.blue}44`,
                      color: currentTheme.colors.foreground,
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = currentTheme.colors.blue + '30'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = currentTheme.colors.blue + '18'}
                  >
                    Connect to a Server
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Active Session Views - proper flex layout, no absolute tricks */}
                {activeSessions.map((session) => {
                  const isActive = String(session.id) === String(selectedSessionId);
                  return (
                    <div
                      key={session.id}
                      className={`w-full h-full ${isActive ? 'flex' : 'hidden'} flex-col`}
                    >
                      <div className={`w-full h-full ${session.activeSubTab === 'terminal' ? 'flex' : 'hidden'} flex-col`}>
                        <TerminalView session={session} theme={currentTheme} settings={settings} onStatusChange={handleSessionStatusChange} />
                      </div>
                      <div className={`w-full h-full ${session.activeSubTab === 'sftp' ? 'flex' : 'hidden'} flex-col`}>
                        <FileManager
                          session={session}
                          isActive={isActive && session.activeSubTab === 'sftp'}
                          defaultDirectory={settings.defaultDirectory}
                          autoReconnect={settings.autoReconnect}
                          onStatusChange={handleSessionStatusChange}
                          theme={currentTheme}
                        />
                      </div>
                      <div className={`w-full h-full ${session.activeSubTab === 'settings' ? 'flex' : 'hidden'} flex-col`}>
                        <SettingsView
                          onClose={() => handleUpdateSessionTab(session.id, 'terminal')}
                          currentThemeId={currentThemeId}
                          onThemeSelect={handleThemeSelect}
                          settings={settings}
                          onUpdateSettings={handleUpdateSettings}
                          onExportBackup={handleExportBackup}
                          onImportBackup={handleImportBackup}
                          theme={currentTheme}
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Global Settings View (for when no active session) */}
            {activeSessions.length === 0 && activeTab === 'settings' && (
              <div className="w-full h-full absolute inset-0 z-30 animate-fade-in" style={{ backgroundColor: currentTheme.colors.black }}>
                <SettingsView 
                  onClose={() => setActiveTab('terminal')} 
                  currentThemeId={currentThemeId} 
                  onThemeSelect={handleThemeSelect} 
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onExportBackup={handleExportBackup}
                  onImportBackup={handleImportBackup}
                  theme={currentTheme}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <ConnectionDialog 
        isOpen={isConnectionDialogOpen}
        onClose={() => setIsConnectionDialogOpen(false)}
        onConnect={handleConnect}
        onSave={handleSaveSession}
        theme={currentTheme}
      />

      <SessionDetailsDialog
        isOpen={isSessionDetailsOpen}
        onClose={() => setIsSessionDetailsOpen(false)}
        session={editingSession}
        onSave={handleUpdateSavedSession}
        theme={currentTheme}
      />

      {/* Backup Modal Overlay */}
      {backupModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center animate-fade-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-zoom-in"
            style={{
              backgroundColor: hexToRgba(currentTheme.colors.background || '#1a1d27', 0.97),
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${hexToRgba(currentTheme.colors.foreground || '#e2e8f0', 0.12)}`,
            }}>
            {backupModal === 'export' ? (
              <>
                <h3 className="text-base font-semibold mb-4" style={{ color: currentTheme.colors.foreground }}>
                  Export Backup
                </h3>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold" style={{ color: currentTheme.colors.foreground }}>
                    Encrypt backup file (.flx)?
                  </span>
                  <button
                    type="button"
                    onClick={() => setBackupEncrypt(!backupEncrypt)}
                    className="w-10 h-5 rounded-full relative shadow-inner transition-colors duration-200 focus:outline-none flex-shrink-0"
                    style={{ backgroundColor: backupEncrypt ? (currentTheme.colors.blue || '#3b82f6') : 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200"
                      style={{ transform: backupEncrypt ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                {backupEncrypt && (
                  <div className="mb-4">
                    <label className="text-[10px] uppercase tracking-wider block mb-1.5 opacity-60" style={{ color: currentTheme.colors.foreground }}>
                      Backup Password
                    </label>
                    <input
                      type="password"
                      value={backupPass}
                      onChange={(e) => setBackupPass(e.target.value)}
                      placeholder="Enter backup password"
                      className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none font-mono"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        color: currentTheme.colors.foreground,
                        border: `1px solid ${hexToRgba(currentTheme.colors.foreground || '#e2e8f0', 0.12)}`,
                      }}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBackupModal(null);
                      setBackupPass('');
                      setBackupEncrypt(false);
                    }}
                    className="px-4 py-2 text-xs rounded-lg transition-colors"
                    style={{ color: hexToRgba(currentTheme.colors.foreground || '#e2e8f0', 0.6) }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (backupEncrypt && !backupPass.trim()) {
                        showToast('Please enter a password to encrypt.', 'error');
                        return;
                      }
                      const pass = backupEncrypt ? backupPass : null;
                      setBackupModal(null);
                      setBackupPass('');
                      setBackupEncrypt(false);
                      await executeExportBackup(pass);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
                    style={{
                      backgroundColor: hexToRgba(currentTheme.colors.blue || '#3b82f6', 0.15),
                      color: currentTheme.colors.blue || '#3b82f6',
                      border: `1px solid ${hexToRgba(currentTheme.colors.blue || '#3b82f6', 0.3)}`,
                    }}
                  >
                    Export
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold mb-2" style={{ color: currentTheme.colors.foreground }}>
                  Decrypt Backup
                </h3>
                <p className="text-xs opacity-60 mb-4" style={{ color: currentTheme.colors.foreground }}>
                  This backup file is encrypted. Please enter the password to restore it.
                </p>
                
                <div className="mb-4">
                  <label className="text-[10px] uppercase tracking-wider block mb-1.5 opacity-60" style={{ color: currentTheme.colors.foreground }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={backupPass}
                    onChange={(e) => setBackupPass(e.target.value)}
                    placeholder="Enter decryption password"
                    className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none font-mono"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      color: currentTheme.colors.foreground,
                      border: `1px solid ${hexToRgba(currentTheme.colors.foreground || '#e2e8f0', 0.12)}`,
                    }}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBackupModal(null);
                      setBackupPass('');
                      setImportFilePath('');
                    }}
                    className="px-4 py-2 text-xs rounded-lg transition-colors"
                    style={{ color: hexToRgba(currentTheme.colors.foreground || '#e2e8f0', 0.6) }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!backupPass.trim()) {
                        showToast('Please enter the password to decrypt.', 'error');
                        return;
                      }
                      const pass = backupPass;
                      const file = importFilePath;
                      setBackupModal(null);
                      setBackupPass('');
                      setImportFilePath('');
                      await executeImportDecrypt(file, pass);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
                    style={{
                      backgroundColor: hexToRgba(currentTheme.colors.blue || '#3b82f6', 0.15),
                      color: currentTheme.colors.blue || '#3b82f6',
                      border: `1px solid ${hexToRgba(currentTheme.colors.blue || '#3b82f6', 0.3)}`,
                    }}
                  >
                    Decrypt &amp; Restore
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div 
          className="fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-fade-in animate-slide-in-bottom"
          style={{
            backgroundColor: hexToRgba(currentTheme.colors.background || '#1e2230', 0.95),
            border: `1px solid ${hexToRgba(currentTheme.colors.foreground || '#e2e8f0', 0.15)}`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: currentTheme.colors.foreground || '#e2e8f0',
          }}
        >
          {toast.type === 'success' ? (
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-500/20 text-green-400">
              <span className="text-[10px] font-bold">✓</span>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-red-500/20 text-red-400">
              <span className="text-[10px] font-bold">!</span>
            </div>
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button 
            type="button"
            onClick={() => setToast(null)} 
            className="p-1 rounded-lg transition-colors hover:bg-white/10 ml-2"
          >
            <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
