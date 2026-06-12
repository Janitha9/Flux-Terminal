import React from 'react';
import { Settings, Shield, Terminal, Cloud, Palette, HardDrive, Info, X, Check, ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import { themes } from '../themes';

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

export default function SettingsView({ onClose, currentThemeId, onThemeSelect, settings = {}, onUpdateSettings, onExportBackup, onImportBackup, theme }) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const themeList = Object.values(themes);
  const light = isLightTheme(theme);

  const bg         = theme?.colors?.background || '#1a1d27';
  const fg         = theme?.colors?.foreground  || '#e2e8f0';
  const accent     = theme?.colors?.blue        || '#3b82f6';
  const accent2    = theme?.colors?.magenta     || '#8b5cf6';
  const accentGrn  = theme?.colors?.green       || '#10b981';
  const accentRed  = theme?.colors?.red         || '#ef4444';

  // Light theme: cardBg = slightly tinted white; dark: very dark overlay
  const panelBg   = light ? bg                          : hexToRgba(theme?.colors?.black || '#0f111a', 0.85);
  const cardBg    = light ? hexToRgba(fg, 0.05)         : hexToRgba(theme?.colors?.black || '#0f111a', 0.35);
  const cardBorder= light ? hexToRgba(fg, 0.12)         : hexToRgba(fg, 0.08);
  const inputBg   = light ? hexToRgba(fg, 0.07)         : hexToRgba(theme?.colors?.black || '#000', 0.5);
  const inputBorder= light ? hexToRgba(fg, 0.2)         : hexToRgba(fg, 0.15);
  const mutedText = light ? hexToRgba(fg, 0.55)         : hexToRgba(fg, 0.5);   // was opacity-50 → now absolute color

  const sectionLabelStyle = (color) => ({ color: color || accent });
  const headerBg = light ? hexToRgba(fg, 0.04) : 'rgba(0,0,0,0.2)';

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: panelBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: fg,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${cardBorder}`, backgroundColor: headerBg }}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: hexToRgba(accent, 0.12) }}>
            <Settings className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: fg }}>Settings</h2>
            <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: mutedText }}>
              Configure your Flux experience
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors"
          style={{ color: mutedText }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = cardBg; e.currentTarget.style.color = fg; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = mutedText; }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-10">
          
          {/* ── Appearance & Theme ── */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 pb-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
              <Palette className="w-4 h-4" style={{ color: accent }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: accent }}>
                Appearance &amp; Theme
              </h3>
            </div>
            
            {/* Compact Custom Dropdown */}
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl transition-all border text-left cursor-pointer"
                style={{
                  backgroundColor: cardBg,
                  borderColor: isDropdownOpen ? accent : cardBorder,
                }}
              >
                <div className="flex items-center space-x-3">
                  {/* Mini Preview Dot Container */}
                  <div className="flex items-center space-x-1 p-1.5 rounded bg-black/30 border border-white/5">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: themes[currentThemeId]?.colors?.background || '#0f111a' }} />
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: themes[currentThemeId]?.colors?.blue || '#3b82f6' }} />
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: themes[currentThemeId]?.colors?.magenta || '#8b5cf6' }} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold block">{themes[currentThemeId]?.name || 'Default Theme'}</span>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: mutedText }}>Active Theme</span>
                  </div>
                </div>
                <div className="text-gray-400">
                  {isDropdownOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div
                    className="absolute left-0 right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto animate-fade-in animate-slide-in-top border"
                    style={{
                      backgroundColor: panelBg,
                      borderColor: cardBorder,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    }}
                  >
                    {themeList.map((t) => {
                      const isSel = t.id === currentThemeId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onThemeSelect?.(t.id);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
                          style={{
                            backgroundColor: isSel ? hexToRgba(accent, 0.08) : 'transparent',
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1 p-1 rounded bg-black/20 border border-white/5">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors.background }} />
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors.blue }} />
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors.magenta }} />
                            </div>
                            <span className="text-sm font-medium" style={{ color: isSel ? accent : fg }}>
                              {t.name}
                            </span>
                          </div>
                          {isSel && <Check className="w-4 h-4" style={{ color: accent }} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ── Terminal Preferences ── */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 pb-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
              <Terminal className="w-4 h-4" style={{ color: accent2 }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: accent2 }}>
                Terminal Preferences
              </h3>
            </div>
            <div className="space-y-3">
              {/* Cursor Blinking */}
              <div
                className="flex items-center justify-between p-4 rounded-xl transition-colors"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <div>
                  <span className="text-sm font-semibold block" style={{ color: fg }}>Cursor Blinking</span>
                  <span className="text-xs" style={{ color: mutedText }}>Smooth animated cursor blinking.</span>
                </div>
                <button
                  onClick={() => onUpdateSettings?.({ cursorBlinking: !settings.cursorBlinking })}
                  className="w-10 h-5 rounded-full relative shadow-inner transition-colors duration-200 focus:outline-none flex-shrink-0"
                  style={{ backgroundColor: settings.cursorBlinking ? accent : hexToRgba(fg, 0.2) }}
                >
                  <div
                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200"
                    style={{ transform: settings.cursorBlinking ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>

              {/* Font Family */}
              <div
                className="flex items-center justify-between p-4 rounded-xl transition-colors"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <div>
                  <span className="text-sm font-semibold block" style={{ color: fg }}>Font Family</span>
                  <span className="text-xs" style={{ color: mutedText }}>Monospace font for the terminal.</span>
                </div>
                <select
                  value={settings.fontFamily || 'Fira Code'}
                  onChange={(e) => onUpdateSettings?.({ fontFamily: e.target.value })}
                  className="text-xs font-mono px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer focus:ring-1"
                  style={{
                    backgroundColor: inputBg,
                    color: fg,
                    border: `1px solid ${inputBorder}`,
                    focusRingColor: accent,
                  }}
                >
                  <option value="Fira Code">Fira Code</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Consolas">Consolas</option>
                  <option value="Cascadia Code">Cascadia Code</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>

              {/* Font Size */}
              <div
                className="flex items-center justify-between p-4 rounded-xl transition-colors"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <div>
                  <span className="text-sm font-semibold block" style={{ color: fg }}>Font Size</span>
                  <span className="text-xs" style={{ color: mutedText }}>Adjust terminal text scale.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="10"
                    max="24"
                    value={settings.fontSize || 14}
                    onChange={(e) => onUpdateSettings?.({ fontSize: parseInt(e.target.value) || 14 })}
                    className="w-16 text-center text-xs font-mono px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1"
                    style={{ backgroundColor: inputBg, color: fg, border: `1px solid ${inputBorder}` }}
                  />
                  <span className="text-xs" style={{ color: mutedText }}>px</span>
                </div>
              </div>

              {/* Scrollback */}
              <div
                className="flex items-center justify-between p-4 rounded-xl transition-colors"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <div>
                  <span className="text-sm font-semibold block" style={{ color: fg }}>Scrollback Lines</span>
                  <span className="text-xs" style={{ color: mutedText }}>Lines kept in buffer history.</span>
                </div>
                <input
                  type="number"
                  min="100"
                  max="50000"
                  value={settings.scrollback || 5000}
                  onChange={(e) => onUpdateSettings?.({ scrollback: parseInt(e.target.value) || 5000 })}
                  className="w-24 text-center text-xs font-mono px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1"
                  style={{ backgroundColor: inputBg, color: fg, border: `1px solid ${inputBorder}` }}
                />
              </div>
            </div>
          </section>

          {/* ── SSH & SFTP ── */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 pb-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
              <HardDrive className="w-4 h-4" style={{ color: accentGrn }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: accentGrn }}>
                SSH &amp; SFTP
              </h3>
            </div>
            <div className="space-y-3">
              {/* SSH Keepalive Toggle */}
              <div
                className="flex items-center justify-between p-4 rounded-xl transition-colors"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <div>
                  <span className="text-sm font-semibold block" style={{ color: fg }}>SSH Keepalive</span>
                  <span className="text-xs" style={{ color: mutedText }}>Send periodic signals to prevent connection timeout.</span>
                </div>
                <button
                  onClick={() => onUpdateSettings?.({ sshKeepalive: settings.sshKeepalive !== false ? false : true })}
                  className="w-10 h-5 rounded-full relative shadow-inner transition-colors duration-200 focus:outline-none flex-shrink-0"
                  style={{ backgroundColor: settings.sshKeepalive !== false ? accent : hexToRgba(fg, 0.2) }}
                >
                  <div
                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200"
                    style={{ transform: settings.sshKeepalive !== false ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>

              {/* SSH Keepalive Interval */}
              {settings.sshKeepalive !== false && (
                <div
                  className="flex items-center justify-between p-4 rounded-xl transition-colors animate-fade-in animate-slide-in-top"
                  style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                >
                  <div>
                    <span className="text-sm font-semibold block" style={{ color: fg }}>Keepalive Interval</span>
                    <span className="text-xs" style={{ color: mutedText }}>Time between keepalive messages (seconds).</span>
                  </div>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={settings.sshKeepaliveInterval || 30}
                    onChange={(e) => onUpdateSettings?.({ sshKeepaliveInterval: parseInt(e.target.value) || 30 })}
                    className="w-20 text-center text-xs font-mono px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1"
                    style={{ backgroundColor: inputBg, color: fg, border: `1px solid ${inputBorder}` }}
                  />
                </div>
              )}
              {/* Default Directory */}
              <div
                className="flex items-center justify-between p-4 rounded-xl transition-colors"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <div>
                  <span className="text-sm font-semibold block" style={{ color: fg }}>Default Directory</span>
                  <span className="text-xs" style={{ color: mutedText }}>Starting path for SFTP sessions.</span>
                </div>
                <input
                  type="text"
                  value={settings.defaultDirectory || '/'}
                  onChange={(e) => onUpdateSettings?.({ defaultDirectory: e.target.value })}
                  className="w-40 font-mono text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 text-right"
                  style={{ backgroundColor: inputBg, color: fg, border: `1px solid ${inputBorder}` }}
                />
              </div>

              {/* Auto-Reconnect */}
              <div
                className="flex items-center justify-between p-4 rounded-xl transition-colors"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <div>
                  <span className="text-sm font-semibold block" style={{ color: fg }}>Auto-Reconnect</span>
                  <span className="text-xs" style={{ color: mutedText }}>Automatically try to reconnect on disconnect.</span>
                </div>
                <button
                  onClick={() => onUpdateSettings?.({ autoReconnect: !settings.autoReconnect })}
                  className="w-10 h-5 rounded-full relative shadow-inner transition-colors duration-200 focus:outline-none flex-shrink-0"
                  style={{ backgroundColor: settings.autoReconnect ? accent : hexToRgba(fg, 0.2) }}
                >
                  <div
                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200"
                    style={{ transform: settings.autoReconnect ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* ── Backup & Restore ── */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 pb-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
              <Shield className="w-4 h-4" style={{ color: accentRed }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: accentRed }}>
                Backup &amp; Restore
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Backup Card */}
              <div
                className="p-5 rounded-2xl border flex flex-col justify-between"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <div>
                  <h4 className="text-sm font-bold mb-1" style={{ color: fg }}>Local Backup (Export)</h4>
                  <p className="text-xs mb-4" style={{ color: mutedText }}>
                    Export your saved sessions and custom settings locally.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: hexToRgba(accent, 0.15),
                    color: accent,
                    border: `1px solid ${hexToRgba(accent, 0.3)}`,
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span>Export Backup</span>
                </button>
              </div>

              {/* Import Backup Card */}
              <div
                className="p-5 rounded-2xl border flex flex-col justify-between"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <div>
                  <h4 className="text-sm font-bold mb-1" style={{ color: fg }}>Restore Backup (Import)</h4>
                  <p className="text-xs mb-4" style={{ color: mutedText }}>
                    Import saved sessions and configurations from a previously exported file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onImportBackup}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: hexToRgba(accentGrn, 0.15),
                    color: accentGrn,
                    border: `1px solid ${hexToRgba(accentGrn, 0.3)}`,
                  }}
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Backup</span>
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-4 pb-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: mutedText }}>
              Flux Terminal v1.0.0
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
