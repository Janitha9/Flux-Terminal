import React from 'react';
import { Minus, Square, X, TerminalSquare } from 'lucide-react';

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

export default function TitleBar({ title = "Flux Terminal", theme }) {
  const handleMinimize = () => window.electronAPI.minimize();
  const handleMaximize = () => window.electronAPI.maximize();
  const handleClose    = () => window.electronAPI.close();

  const light      = isLightTheme(theme);
  const fg         = theme?.colors?.foreground  || '#e2e8f0';
  const accent     = theme?.colors?.blue        || '#3b82f6';
  const bg         = theme?.colors?.background  || '#1a1d27';
  const borderColor= light ? hexToRgba(fg, 0.1) : 'rgba(255,255,255,0.06)';
  const titleBarBg = light ? hexToRgba(bg, 0.92) : 'rgba(0,0,0,0.25)';
  const mutedText  = light ? hexToRgba(fg, 0.6)  : 'rgba(180,190,210,0.6)';
  const btnHoverBg = light ? hexToRgba(fg, 0.08) : 'rgba(255,255,255,0.06)';

  return (
    <div
      className="flex items-center justify-between h-10 select-none sticky top-0 z-50 transition-colors duration-300"
      style={{
        backgroundColor: titleBarBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${borderColor}`,
        WebkitAppRegion: 'drag',
      }}
    >
      {/* App Icon & Title */}
      <div className="flex items-center px-4 space-x-2">
        <TerminalSquare className="w-4 h-4" style={{ color: accent }} />
        <span className="text-sm font-semibold tracking-wide" style={{ color: fg }}>
          {title}
        </span>
      </div>

      {/* Window Controls */}
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={handleMinimize}
          className="px-4 h-full transition-colors flex items-center justify-center"
          style={{ color: mutedText }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = btnHoverBg; e.currentTarget.style.color = fg; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = mutedText; }}
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="px-4 h-full transition-colors flex items-center justify-center"
          style={{ color: mutedText }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = btnHoverBg; e.currentTarget.style.color = fg; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = mutedText; }}
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleClose}
          className="px-4 h-full transition-colors flex items-center justify-center"
          style={{ color: mutedText }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = mutedText; }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
