import React, { useState } from 'react';
import { X, Server, Key, User, HardDrive, Shield, ChevronDown, ChevronUp, Settings } from 'lucide-react';

function hexToRgba(hex, alpha) {
  if (!hex) return '';
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Detect if a theme is light based on its background luminance
function isLightTheme(theme) {
  if (!theme?.colors?.background) return false;
  const hex = theme.colors.background.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6;
}

export default function ConnectionDialog({ isOpen, onClose, onConnect, onSave, theme }) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('root');
  const [password, setPassword] = useState('');
  const [saveSession, setSaveSession] = useState(true);
  const [connectionType, setConnectionType] = useState('ssh');
  const [keyFile, setKeyFile] = useState('');
  const [x11Forwarding, setX11Forwarding] = useState(false);
  const [agentForwarding, setAgentForwarding] = useState(false);
  const [compression, setCompression] = useState(false);
  const [sshVersion, setSshVersion] = useState('default');
  const [extraArgs, setExtraArgs] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setHost('');
      setPort('22');
      setUsername('root');
      setPassword('');
      setKeyFile('');
      setX11Forwarding(false);
      setAgentForwarding(false);
      setCompression(false);
      setSshVersion('default');
      setExtraArgs('');
      setConnectionType('ssh');
      setIsAdvancedOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const light = isLightTheme(theme);
  const bg = theme?.colors?.background || '#1a1d27';
  const fg = theme?.colors?.foreground || '#e2e8f0';
  const accent = theme?.colors?.blue || '#3b82f6';
  const subtleBg = light ? hexToRgba(theme?.colors?.brightBlack || '#e5e7eb', 0.5) : 'rgba(255,255,255,0.03)';
  const borderColor = light ? hexToRgba(fg, 0.15) : 'rgba(255,255,255,0.08)';
  const inputBg = light ? hexToRgba(theme?.colors?.brightBlack || '#e5e7eb', 0.4) : 'rgba(0,0,0,0.3)';
  const inputBorder = light ? hexToRgba(fg, 0.2) : 'rgba(255,255,255,0.1)';
  const labelColor = light ? hexToRgba(fg, 0.55) : 'rgba(180,190,210,0.7)';
  const dialogBg = hexToRgba(bg, 0.88);

  const handleSubmit = (e) => {
    e.preventDefault();
    const sessionDetails = {
      id: Date.now().toString(),
      name: name || host,
      host,
      port: parseInt(port),
      username,
      password,
      connectionType,
      keyFile,
      x11Forwarding,
      agentForwarding,
      compression,
      sshVersion,
      extraArgs,
    };
    
    if (saveSession && onSave) {
      onSave(sessionDetails);
    }
    
    onConnect(sessionDetails);
  };

  const inputStyle = {
    backgroundColor: inputBg,
    border: `1px solid ${inputBorder}`,
    color: fg,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '10px',
    padding: '9px 12px',
    width: '100%',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const inputWithIconStyle = { ...inputStyle, paddingLeft: '36px' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col"
        style={{
          backgroundColor: dialogBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${borderColor}`,
          maxHeight: '85vh',
          boxShadow: `0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px ${borderColor}`,
        }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${borderColor}`, backgroundColor: subtleBg }}>
          <div className="flex items-center space-x-2 font-semibold" style={{ color: fg }}>
            <Server className="w-4 h-4" style={{ color: accent }} />
            <h2 className="text-base">New Connection</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: labelColor }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = inputBg; e.currentTarget.style.color = fg; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = labelColor; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          
          <div className="space-y-4">
            {/* Session Name */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>
                Session Name (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HardDrive className="h-3.5 w-3.5" style={{ color: labelColor }} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production Server"
                  style={inputWithIconStyle}
                />
              </div>
            </div>

            {/* Host + Port */}
            <div className="flex space-x-3">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>
                  Hostname / IP *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Server className="h-3.5 w-3.5" style={{ color: labelColor }} />
                  </div>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="192.168.1.100"
                    style={inputWithIconStyle}
                  />
                </div>
              </div>
              <div className="w-24">
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>
                  Port
                </label>
                <input
                  type="number"
                  required
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
              </div>
            </div>

            {/* Username + Password */}
            <div className="flex space-x-3">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-3.5 w-3.5" style={{ color: labelColor }} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={inputWithIconStyle}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-3.5 w-3.5" style={{ color: labelColor }} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={inputWithIconStyle}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Collapsible Section */}
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between px-4 py-3 transition-colors"
              style={{ backgroundColor: subtleBg, color: fg }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = inputBg}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = subtleBg}
            >
              <div className="flex items-center space-x-2 text-sm font-medium">
                <Settings className="w-3.5 h-3.5" style={{ color: accent }} />
                <span>Advanced PuTTY &amp; SSH Options</span>
              </div>
              {isAdvancedOpen
                ? <ChevronUp className="w-4 h-4" style={{ color: labelColor }} />
                : <ChevronDown className="w-4 h-4" style={{ color: labelColor }} />
              }
            </button>

            {isAdvancedOpen && (
              <div className="p-4 space-y-4 animate-in fade-in duration-200" style={{ borderTop: `1px solid ${borderColor}` }}>
                {/* Connection Type */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>
                    Connection Type
                  </label>
                  <div className="grid grid-cols-5 gap-1 p-1 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
                    {['ssh', 'telnet', 'rlogin', 'raw', 'serial'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setConnectionType(type);
                          if (type === 'telnet') setPort('23');
                          else if (type === 'ssh') setPort('22');
                        }}
                        className="py-1.5 text-[10px] uppercase font-bold rounded-md transition-all duration-150"
                        style={connectionType === type
                          ? { backgroundColor: accent, color: '#ffffff' }
                          : { color: labelColor, backgroundColor: 'transparent' }
                        }
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Key File */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>
                    SSH Private Key (.ppk)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      readOnly
                      placeholder="No key file selected"
                      value={keyFile}
                      style={{ ...inputStyle, flex: 1, fontSize: '11px', fontFamily: 'monospace' }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const file = await window.electronAPI.selectFile();
                        if (file) setKeyFile(file);
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                      style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, color: fg }}
                    >
                      Browse…
                    </button>
                    {keyFile && (
                      <button
                        type="button"
                        onClick={() => setKeyFile('')}
                        className="px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                        style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* SSH Protocol Version */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>
                    SSH Protocol Version
                  </label>
                  <select
                    value={sshVersion}
                    onChange={(e) => setSshVersion(e.target.value)}
                    style={{ ...inputStyle }}
                  >
                    <option value="default">Default (negotiate)</option>
                    <option value="2">SSH-2 only</option>
                    <option value="1">SSH-1 only</option>
                  </select>
                </div>

                {/* Checkbox Options */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'X11 Forward', state: x11Forwarding, set: setX11Forwarding },
                    { label: 'Agent Fwd', state: agentForwarding, set: setAgentForwarding },
                    { label: 'Compression', state: compression, set: setCompression },
                  ].map(({ label, state, set }) => (
                    <label
                      key={label}
                      className="flex items-center space-x-2 p-2.5 rounded-lg cursor-pointer transition-all duration-150"
                      style={{ backgroundColor: inputBg, border: `1px solid ${state ? accent + '55' : borderColor}` }}
                    >
                      <input
                        type="checkbox"
                        checked={state}
                        onChange={(e) => set(e.target.checked)}
                        style={{ accentColor: accent, width: '13px', height: '13px' }}
                      />
                      <span className="text-[10px] font-semibold" style={{ color: fg }}>{label}</span>
                    </label>
                  ))}
                </div>

                {/* Extra Arguments */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>
                    Extra plink Arguments (e.g. -v)
                  </label>
                  <input
                    type="text"
                    value={extraArgs}
                    onChange={(e) => setExtraArgs(e.target.value)}
                    placeholder="e.g. -v -ssh"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save Session */}
          <div className="flex items-center p-3 rounded-xl" style={{ backgroundColor: subtleBg, border: `1px solid ${borderColor}` }}>
            <input
              id="save-session"
              type="checkbox"
              checked={saveSession}
              onChange={(e) => setSaveSession(e.target.checked)}
              style={{ accentColor: accent, width: '15px', height: '15px' }}
            />
            <label htmlFor="save-session" className="ml-2.5 text-sm" style={{ color: fg }}>
              Save connection securely (AES encrypted)
            </label>
            <Shield className="ml-auto w-4 h-4" style={{ color: theme?.colors?.green || '#10b981' }} />
          </div>

          </div>

          {/* Footer Actions */}
          <div className="px-5 py-4 flex space-x-3" style={{ borderTop: `1px solid ${borderColor}`, backgroundColor: subtleBg }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-medium text-sm transition-all"
              style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, color: fg }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${hexToRgba(accent, 0.75)})`,
                color: '#ffffff',
                border: `1px solid ${hexToRgba(accent, 0.4)}`,
                boxShadow: `0 4px 20px ${hexToRgba(accent, 0.3)}`,
              }}
            >
              Connect
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
