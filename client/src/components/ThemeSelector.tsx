import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  bgClass: string;
  primaryBg: string;
  accentBg: string;
  textColor: string;
}

const THEMES: Theme[] = [
  { id: 'dark-neon', name: 'Dark Neon', bgClass: 'theme-dark-neon', primaryBg: '#10b981', accentBg: '#8b5cf6', textColor: '#f8fafc' },
  { id: 'cyberpunk', name: 'Cyberpunk', bgClass: 'theme-cyberpunk', primaryBg: '#ec4899', accentBg: '#06b6d4', textColor: '#ffffff' },
  { id: 'minimal-dark', name: 'Casino Green', bgClass: 'theme-minimal-dark', primaryBg: '#0F7A5C', accentBg: '#D4AF37', textColor: '#F7F7F7' },
  { id: 'ocean-blue', name: 'Ocean Blue', bgClass: 'theme-ocean-blue', primaryBg: '#008dd5', accentBg: '#38bdf8', textColor: '#f0fdfa' },
  { id: 'purple-gaming', name: 'Purple Gaming', bgClass: 'theme-purple-gaming', primaryBg: '#7c3aed', accentBg: '#f43f5e', textColor: '#faf5ff' },
  { id: 'light', name: 'Light Mode', bgClass: 'theme-light', primaryBg: '#3b82f6', accentBg: '#f59e0b', textColor: '#0f172a' },
];

export const ThemeSelector: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('guess_game_theme') || 'minimal-dark';
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Reset body classes and add current theme
    THEMES.forEach((t) => {
      document.body.classList.remove(t.bgClass);
    });
    const selected = THEMES.find((t) => t.id === currentTheme);
    if (selected) {
      document.body.classList.add(selected.bgClass);
    } else {
      document.body.classList.add('theme-minimal-dark'); // Fallback
    }
    localStorage.setItem('guess_game_theme', currentTheme);
  }, [currentTheme]);

  return (
    <div className="relative">
      {/* <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition duration-300 text-sm font-medium focus:outline-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Palette size={15} className="text-primary" />
        <span className="hidden sm:inline text-xs text-textMuted">Theme</span>
      </button> */}

      {isOpen && (
        <>
          {/* Backdrop to close */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-56 rounded-xl p-4 shadow-2xl z-50 animate-fade-in-up"
            style={{
              background: 'rgba(7,59,45,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(15,122,92,0.1)',
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">Select Style</h3>
              <button onClick={() => setIsOpen(false)} className="text-textMuted/50 hover:text-textMain transition">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setCurrentTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-all duration-200 border ${
                    currentTheme === theme.id
                      ? 'border-primary/30 text-textMain'
                      : 'border-transparent hover:border-white/[0.06] text-textMuted'
                  }`}
                  style={{
                    background: currentTheme === theme.id
                      ? 'rgba(15,122,92,0.12)'
                      : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {currentTheme === theme.id && (
                      <Check size={12} className="text-primary" />
                    )}
                    <span className={currentTheme === theme.id ? 'font-semibold' : ''}>{theme.name}</span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <span
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: theme.primaryBg, border: '1px solid rgba(0,0,0,0.3)' }}
                    />
                    <span
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: theme.accentBg, border: '1px solid rgba(0,0,0,0.3)' }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default ThemeSelector;
