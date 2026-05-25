import React, { useState, useEffect } from 'react';
import { Plus, LogIn, RefreshCw, Lock, Users, ShieldAlert, LogOut, Sparkles, Crown } from 'lucide-react';
import { ThemeSelector } from '../components/ThemeSelector';
import { audio } from '../utils/audio';
import type { RoomSettings } from '../types/game';

interface HomeScreenProps {
  username: string;
  publicRooms: any[];
  onRefreshPublicRooms: () => void;
  onCreateRoom: (settings: Partial<RoomSettings>, isPrivate: boolean, password?: string) => void;
  onJoinRoom: (roomId: string, password?: string) => void;
  onLogout: () => void;
  error?: string | null;
  clearError: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  username,
  publicRooms,
  onRefreshPublicRooms,
  onCreateRoom,
  onJoinRoom,
  onLogout,
  error,
  clearError,
}) => {
  const [activeTab, setActiveTab] = useState<'public' | 'create' | 'join'>('public');

  const [roomName, setRoomName] = useState(`${username}'s Arena`);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [minNumber, setMinNumber] = useState(1);
  const [maxNumber, setMaxNumber] = useState(100);
  const [isRealNumber, setIsRealNumber] = useState(false);
  const [hintDuration, setHintDuration] = useState(4);
  const [selectionTimeout, setSelectionTimeout] = useState(30);
  const [turnTimeout, setTurnTimeout] = useState(20);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [eliminatedChatEnabled, setEliminatedChatEnabled] = useState(true);
  const [autoStart, setAutoStart] = useState(false);

  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  useEffect(() => {
    onRefreshPublicRooms();
    clearError();
  }, [activeTab]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audio.init();
    if (minNumber >= maxNumber) {
      alert('Minimum range must be lower than maximum range!');
      return;
    }
    onCreateRoom({
      roomName: roomName.trim(), maxPlayers, minNumber, maxNumber, isRealNumber,
      hintDuration, selectionTimeout, turnTimeout, chatEnabled, eliminatedChatEnabled, autoStart,
    }, isPrivate, isPrivate ? password : undefined);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audio.init();
    if (!joinRoomId.trim()) return;
    onJoinRoom(joinRoomId.trim().toUpperCase(), joinPassword || undefined);
  };

  const tabs = [
    { id: 'public' as const, label: 'Lobby', icon: <Users size={16} /> },
    { id: 'create' as const, label: 'Host', icon: <Plus size={16} /> },
    { id: 'join' as const, label: 'Join', icon: <LogIn size={16} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 relative">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-widest hidden sm:block">
            <span className="text-textMain">Vibe</span>
            <span className="text-gradient-gold ml-1.5">Guess</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 glass-pill">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white shadow-lg">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col pr-2">
              <span className="text-[10px] text-textMuted font-bold uppercase tracking-widest">Player</span>
              <span className="text-sm font-bold text-textMain">{username}</span>
            </div>
          </div>
          <ThemeSelector />
          <button
            onClick={onLogout}
            title="Log Out"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-error/10 hover:text-error hover:border-error/20 transition-all duration-300"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col relative z-10 animate-fade-in">
        
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-center gap-3 text-error">
            <ShieldAlert size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Ultra-Premium Tabs */}
        <div className="flex p-1.5 mb-8 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-xl mx-auto w-full max-w-md">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)]'
                  : 'text-textMuted hover:text-textMain hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'public' && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-sm font-bold text-textMain uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" /> Active Tables ({publicRooms.length})
                </h2>
                <button
                  onClick={onRefreshPublicRooms}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider btn-ghost"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {publicRooms.length === 0 ? (
                <div className="glass-panel rounded-3xl p-16 text-center flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <Users size={32} className="text-primary/50" />
                  </div>
                  <h3 className="text-lg font-bold text-textMain mb-2">The lobby is empty</h3>
                  <p className="text-sm text-textMuted mb-8 max-w-sm">
                    No active tables found. Be the first to host a game and invite others to play.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-8 py-4 btn-primary rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-3"
                  >
                    <Crown size={18} /> Host a Table
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publicRooms.map((r) => (
                    <div key={r.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
                      <div className="mb-6 relative z-10">
                        <h3 className="font-black text-lg text-textMain truncate mb-2 group-hover:text-primary transition-colors">
                          {r.name}
                        </h3>
                        <div className="flex items-center gap-4 text-xs font-bold text-textMuted uppercase tracking-wider">
                          <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                            <Users size={14} className="text-primary" /> {r.playerCount} / {r.maxPlayers}
                          </span>
                          <span className={`px-3 py-1.5 rounded-lg border ${
                            r.status === 'lobby' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-warning/10 border-warning/20 text-warning'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onJoinRoom(r.id)}
                        disabled={r.playerCount >= r.maxPlayers}
                        className="w-full py-3 btn-primary rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {r.playerCount >= r.maxPlayers ? 'Table Full' : 'Join Table'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="max-w-2xl mx-auto space-y-6 animate-slide-up pb-10">
              
              {/* General Settings */}
              <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6">
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest border-b border-white/5 pb-4 mb-6">General</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-widest mb-3">Table Name</label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      maxLength={30}
                      className="w-full input-premium px-5 py-3.5 rounded-xl text-sm font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-widest mb-3">Max Players ({maxPlayers})</label>
                    <div className="flex items-center h-[50px] bg-black/40 rounded-xl px-4 border border-white/10">
                      <input
                        type="range"
                        min="2"
                        max="12"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                        className="w-full range-premium"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Lock size={16} className="text-primary" />
                      <span className="text-sm font-bold text-textMain uppercase tracking-wider">Private Table</span>
                    </div>
                    <p className="text-xs text-textMuted">Require a password to join this table.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {isPrivate && (
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password..."
                        className="input-premium px-4 py-2.5 rounded-xl text-sm w-32"
                        required={isPrivate}
                      />
                    )}
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="toggle-premium"
                    />
                  </div>
                </div>
              </div>

              {/* Game Rules */}
              <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6">
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest border-b border-white/5 pb-4 mb-6">Game Rules</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Min Value</label>
                    <input type="number" value={minNumber} onChange={(e) => setMinNumber(parseInt(e.target.value))} className="w-full input-premium px-4 py-3 rounded-xl text-sm text-center" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Max Value</label>
                    <input type="number" value={maxNumber} onChange={(e) => setMaxNumber(parseInt(e.target.value))} className="w-full input-premium px-4 py-3 rounded-xl text-sm text-center" required />
                  </div>
                  <div className="flex items-end">
                     <label className="w-full flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 cursor-pointer">
                      <span className="text-xs font-bold text-textMain uppercase tracking-wider">Decimals</span>
                      <input type="checkbox" checked={isRealNumber} onChange={(e) => setIsRealNumber(e.target.checked)} className="toggle-premium" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Hint Time ({hintDuration}s)</label>
                    <input type="number" min="1" max="10" value={hintDuration} onChange={(e) => setHintDuration(parseInt(e.target.value))} className="w-full input-premium px-4 py-3 rounded-xl text-sm text-center" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Select Time ({selectionTimeout}s)</label>
                    <input type="number" min="10" max="120" value={selectionTimeout} onChange={(e) => setSelectionTimeout(parseInt(e.target.value))} className="w-full input-premium px-4 py-3 rounded-xl text-sm text-center" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Turn Time ({turnTimeout}s)</label>
                    <input type="number" min="10" max="60" value={turnTimeout} onChange={(e) => setTurnTimeout(parseInt(e.target.value))} className="w-full input-premium px-4 py-3 rounded-xl text-sm text-center" required />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Chat Enabled', checked: chatEnabled, set: setChatEnabled },
                  { label: 'Spectator Chat', checked: eliminatedChatEnabled, set: setEliminatedChatEnabled },
                  { label: 'Auto Start', checked: autoStart, set: setAutoStart }
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center justify-between p-4 glass-panel rounded-2xl cursor-pointer">
                    <span className="text-xs font-bold text-textMain uppercase tracking-wider">{item.label}</span>
                    <input type="checkbox" checked={item.checked} onChange={(e) => item.set(e.target.checked)} className="toggle-premium" />
                  </label>
                ))}
              </div>

              <button type="submit" className="w-full py-4 rounded-xl btn-primary text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-3">
                <Plus size={18} /> Host Table
              </button>
            </form>
          )}

          {activeTab === 'join' && (
            <div className="max-w-md mx-auto animate-slide-up">
              <form onSubmit={handleJoinSubmit} className="glass-panel p-8 md:p-10 rounded-3xl space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <LogIn size={28} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-black text-textMain uppercase tracking-widest">Join Private</h3>
                  <p className="text-sm text-textMuted mt-2">Enter the table code to connect.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-bold text-textMuted uppercase tracking-widest mb-3">Table Code</label>
                    <input
                      type="text"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      placeholder="e.g. A4K9B2"
                      maxLength={6}
                      className="w-full input-premium px-5 py-4 rounded-xl text-lg font-black font-mono tracking-[0.5em] text-center text-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-textMuted uppercase tracking-widest mb-3">Password <span className="text-textMuted/50 normal-case tracking-normal">(Optional)</span></label>
                    <input
                      type="password"
                      value={joinPassword}
                      onChange={(e) => setJoinPassword(e.target.value)}
                      placeholder="Enter if private"
                      className="w-full input-premium px-5 py-3.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 rounded-xl btn-primary text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-3">
                  <LogIn size={18} /> Enter Table
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;
