import React from 'react';
import { themes } from '../themes';
import { Check, Palette, X } from 'lucide-react';

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

export default function ThemeSelector({ currentThemeId, onThemeSelect, onClose, theme }) {
  const themeList = Object.values(themes);
  const light = isLightTheme(theme);

  const bg         = theme?.colors?.background || '#1a1d27';
  const fg         = theme?.colors?.foreground  || '#e2e8f0';
  const accent     = theme?.colors?.blue        || '#3b82f6';
  const panelBg    = light ? hexToRgba(bg, 0.95) : hexToRgba(theme?.colors?.black || '#0f111a', 0.9);
  const borderColor= light ? hexToRgba(fg, 0.13) : 'rgba(255,255,255,0.08)';
  const cardBg     = light ? hexToRgba(fg, 0.05) : 'rgba(255,255,255,0.03)';
  const hoverBg    = light ? hexToRgba(fg, 0.09) : 'rgba(255,255,255,0.06)';
  const mutedText  = light ? hexToRgba(fg, 0.55) : 'rgba(180,190,210,0.6)';

  return (
    <div
      className="absolute top-12 right-6 w-96 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300"
      style={{
        backgroundColor: panelBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.4)`,
      }}
    >
      <div
        className="flex items-center justify-between mb-4 pb-3"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <h3 className="font-semibold flex items-center space-x-2 text-sm" style={{ color: fg }}>
          <Palette className="w-4 h-4" style={{ color: accent }} />
          <span>Appearance</span>
        </h3>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 rounded-lg transition-colors"
          style={{ color: mutedText }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.color = fg; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = mutedText; }}
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
        {themeList.map((t) => {
          const isSelected = currentThemeId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onThemeSelect(t.id)}
              className="flex flex-col p-3 rounded-xl text-left transition-all duration-200 hover:-translate-y-0.5"
              style={{
                border: `1px solid ${isSelected ? accent : borderColor}`,
                backgroundColor: isSelected ? hexToRgba(accent, 0.1) : cardBg,
                boxShadow: isSelected ? `0 0 0 1px ${hexToRgba(accent, 0.25)}` : 'none',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = hoverBg; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = cardBg; }}
            >
              {/* Preview Box */}
              <div
                className="w-full h-16 rounded-lg mb-3 flex flex-col justify-center px-3 shadow-inner overflow-hidden relative"
                style={{
                  backgroundColor: t.colors.background,
                  border: `1px solid ${hexToRgba(t.colors.foreground, 0.12)}`,
                }}
              >
                <div className="flex space-x-1 mb-2 absolute top-2 left-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colors.red }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colors.yellow }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colors.green }} />
                </div>
                <div className="mt-4 font-mono text-[10px]" style={{ color: t.colors.foreground }}>
                  <span style={{ color: t.colors.green }}>~/flux</span>$ echo<br/>
                  <span style={{ color: t.colors.cyan }}>Hello World</span>
                  <span
                    className="w-1.5 h-3 inline-block ml-0.5 animate-pulse"
                    style={{ backgroundColor: t.colors.cursor }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between w-full pr-1">
                <span
                  className="text-xs font-semibold"
                  style={{ color: isSelected ? accent : fg }}
                >
                  {t.name}
                </span>
                {isSelected && <Check className="w-4 h-4" style={{ color: accent }} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
