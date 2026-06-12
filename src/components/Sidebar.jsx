import React, { useState } from 'react';
import { Terminal, Folder, Settings, Plus, Server, LogOut, ChevronRight, Activity, Trash2, Info } from 'lucide-react';

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

export default function Sidebar({ sessions = [], activeSession, activeSessions = [], onSelectSession, onNewSession, onSettingsClick, onDeleteSession, onEditSession, theme }) {
  const bg = theme?.colors?.background || '#1a1d27';
  const fg = theme?.colors?.foreground || '#e2e8f0';
  const accent = theme?.colors?.blue || '#3b82f6';
  const light = isLightTheme(theme);

  const borderColor = light ? hexToRgba(fg, 0.12) : 'rgba(255,255,255,0.06)';
  const hoverBg = light ? hexToRgba(fg, 0.07) : 'rgba(255,255,255,0.05)';
  const labelColor = light ? hexToRgba(fg, 0.45) : 'rgba(180,190,210,0.5)';
  const sectionBg = light ? hexToRgba(theme?.colors?.brightBlack || '#e5e7eb', 0.4) : 'rgba(0,0,0,0.15)';

  return (
    <div
      className="w-full h-full flex flex-col z-40"
      style={{
        backgroundColor: hexToRgba(bg, 0.82),
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: `1px solid ${borderColor}`,
      }}
    >
      
      {/* Top action area */}
      <div className="p-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 text-white"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${hexToRgba(accent, 0.75)})`,
            boxShadow: `0 4px 16px ${hexToRgba(accent, 0.3)}`,
          }}
        >
          <Plus className="w-4 h-4" />
          <span>New Connection</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        <div
          className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: labelColor }}
        >
          Saved Sessions
        </div>
        
        {sessions.map((session) => {
          const isActive = activeSession?.id === session.id;
          return (
            <div
              key={session.id}
              onClick={() => onSelectSession(session)}
              className="w-full flex items-center p-2.5 rounded-xl transition-all duration-200 group cursor-pointer"
              style={{
                backgroundColor: isActive ? hexToRgba(accent, 0.12) : 'transparent',
                color: isActive ? accent : fg,
                border: `1px solid ${isActive ? hexToRgba(accent, 0.25) : 'transparent'}`,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = hoverBg; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div
                className="p-1.5 rounded-lg mr-3 flex-shrink-0"
                style={{ backgroundColor: isActive ? hexToRgba(accent, 0.2) : hexToRgba(fg, 0.08) }}
              >
                <Server className="w-3.5 h-3.5" />
              </div>
              
              <div className="flex-1 text-left truncate">
                <div className="font-medium text-sm truncate">{session.name}</div>
                <div className="text-xs truncate" style={{ color: labelColor }}>{session.host}</div>
              </div>

              {(() => {
                const activeSess = activeSessions.find(as => String(as.id) === String(session.id));
                if (!activeSess) return null;
                const isConnected = activeSess.status === 'connected';
                return (
                  <Activity className={`w-3.5 h-3.5 ${isConnected ? 'text-green-400 animate-pulse' : 'text-red-500'} mr-2`} />
                );
              })()}
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onEditSession(session); }}
                  className="p-1 rounded-md transition-colors"
                  style={{ color: accent }}
                  title="View Details"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = hexToRgba(accent, 0.15)}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                  className="p-1 rounded-md transition-colors"
                  style={{ color: theme?.colors?.red || '#ef4444' }}
                  title="Delete Session"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {!isActive && <ChevronRight className="w-4 h-4" style={{ color: labelColor }} />}
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="text-center px-4 py-8">
            <div className="rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: hexToRgba(fg, 0.06) }}>
              <Terminal className="w-6 h-6" style={{ color: labelColor }} />
            </div>
            <p className="text-sm" style={{ color: labelColor }}>No saved sessions yet</p>
          </div>
        )}
      </div>

      {/* Bottom Settings */}
      <div className="p-3" style={{ borderTop: `1px solid ${borderColor}`, backgroundColor: sectionBg }}>
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center space-x-3 p-2.5 rounded-xl transition-all duration-200"
          style={{ color: fg }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Settings className="w-4 h-4" style={{ color: labelColor }} />
          <span className="font-medium text-sm">Settings</span>
        </button>
      </div>

    </div>
  );
}
