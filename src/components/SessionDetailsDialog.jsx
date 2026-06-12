import React, { useState, useEffect } from 'react';
import { X, Server, Key, User, HardDrive, Shield, ChevronDown, ChevronUp, Settings, Eye, EyeOff, Clipboard, Check } from 'lucide-react';

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
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6;
}

export default function SessionDetailsDialog({ isOpen, onClose, session, onSave, theme }) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [connectionType, setConnectionType] = useState('ssh');
  const [keyFile, setKeyFile] = useState('');
  const [x11Forwarding, setX11Forwarding] = useState(false);
  const [agentForwarding, setAgentForwarding] = useState(false);
  const [compression, setCompression] = useState(false);
  const [sshVersion, setSshVersion] = useState('default');
  const [extraArgs, setExtraArgs] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (isOpen && session) {
      setName(session.name || '');
      setHost(session.host || '');
      setPort(String(session.port || '22'));
      setUsername(session.username || '');
      setPassword(session.password || '');
      setConnectionType(session.connectionType || 'ssh');
      setKeyFile(session.keyFile || '');
      setX11Forwarding(!!session.x11Forwarding);
      setAgentForwarding(!!session.agentForwarding);
      setCompression(!!session.compression);
      setSshVersion(session.sshVersion || 'default');
      setExtraArgs(session.extraArgs || '');
      setIsAdvancedOpen(false);
      setShowPassword(false);
      setCopiedField(null);
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const light = isLightTheme(theme);
  const bg = theme?.colors?.background || '#1a1d27';
  const fg = theme?.colors?.foreground || '#e2e8f0';
  const accent = theme?.colors?.blue || '#3b82f6';
  const subtleBg = light ? hexToRgba(theme?.colors?.brightBlack || '#e5e7eb', 0.5) : 'rgba(255,255,255,0.03)';
  const borderColor = light ? hexToRgba(fg, 0.15) : 'rgba(255,255,255,0.08)';
  const inputBg = light ? hexToRgba(theme?.colors?.brightBlack || '#e5e7eb', 0.4) : 'rgba(0,0,0,0.3)';
  const inputBorder = light ? hexToRgba(fg, 0.2) : 'rgba(255,255,255,0.1)';
  const labelColor = light ? hexToRgba(fg, 0.55) : 'rgba(180,190,210,0.7)';
  const dialogBg = hexToRgba(bg, 0.92);

  const handleCopy = (fieldLabel, value) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(fieldLabel);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedDetails = {
      ...session,
      name: name || host,
      host,
      port: parseInt(port) || 22,
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
    
    if (onSave) {
      onSave(updatedDetails);
    }
    onClose();
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
            <h2 className="text-base">Session Details</h2>
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: labelColor }}>
                  Session Name
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy('Name', name)}
                  className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copiedField === 'Name' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
                  {copiedField === 'Name' ? 'Copied' : 'Copy'}
                </button>
              </div>
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: labelColor }}>
                    Hostname / IP *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy('IP', host)}
                    className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'IP' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
                    {copiedField === 'IP' ? 'Copied' : 'Copy'}
                  </button>
                </div>
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: labelColor }}>
                    Username
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy('Username', username)}
                    className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'Username' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
                    {copiedField === 'Username' ? 'Copied' : 'Copy'}
                  </button>
                </div>
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: labelColor }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy('Password', password)}
                    className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'Password' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
                    {copiedField === 'Password' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-3.5 w-3.5" style={{ color: labelColor }} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ ...inputWithIconStyle, paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                <span>Advanced SSH Options</span>
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
              Save Changes
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
