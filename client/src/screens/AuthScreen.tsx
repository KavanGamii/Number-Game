import React, { useState } from 'react';
import { Play, HelpCircle, Gamepad2, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (username: string) => void;
  savedUsername: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, savedUsername }) => {
  const [usernameInput, setUsernameInput] = useState(savedUsername);
  const [inputError, setInputError] = useState<string | null>(null);

  const validateUsername = (name: string): boolean => {
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      setInputError('Username must be between 3 and 20 characters.');
      return false;
    }
    const regex = /^[a-zA-Z0-9_]+$/;
    if (!regex.test(trimmed)) {
      setInputError('Only letters, numbers, and underscores are allowed.');
      return false;
    }
    setInputError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = usernameInput.trim();
    if (validateUsername(sanitized)) {
      onLoginSuccess(sanitized);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="glass-panel p-8 md:p-10 rounded-3xl text-center">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <Gamepad2 className="text-primary w-8 h-8" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight uppercase mb-2">
              <span className="text-textMain">Vibe</span>
              <span className="text-gradient-gold ml-2">Guess</span>
            </h1>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent my-3" />
            <p className="text-sm text-textMuted tracking-wide max-w-[280px] leading-relaxed">
              The premier multiplayer number guessing arena. Outsmart your rivals.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-left group">
              <label className="block text-[11px] font-bold text-textMuted uppercase tracking-widest mb-3 ml-1">
                Guest Alias
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  placeholder="Enter your alias..."
                  maxLength={20}
                  className={`w-full input-premium px-5 py-4 rounded-xl text-sm font-medium transition-shadow ${
                    inputError ? 'border-error/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''
                  }`}
                  required
                />
              </div>
              {inputError && (
                <div className="flex items-center gap-2 text-xs text-error mt-3 px-1 animate-fade-in">
                  <AlertCircle size={14} />
                  <span className="font-medium">{inputError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl btn-primary text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-3 mt-8"
            >
              <span>Enter Arena</span>
              <Play size={16} fill="currentColor" />
            </button>
          </form>

          {/* Rules */}
          <div className="mt-10 pt-6 border-t border-white/5 text-left">
            <span className="text-xs font-bold text-textMain flex items-center gap-2 mb-4 uppercase tracking-wider">
              <HelpCircle size={14} className="text-primary" /> Alias Rules
            </span>
            <ul className="space-y-3">
              {[
                'Must be 3 to 20 characters long',
                'Letters, numbers, and underscores only',
                'Must be unique among connected players'
              ].map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs text-textMuted">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1 flex-shrink-0" />
                  <span className="leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
