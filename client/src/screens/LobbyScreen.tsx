import React, { useState } from 'react';
import { ArrowLeft, Users, CheckCircle, Shield, XCircle, Play, Settings2, MessageSquare, Copy, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatPanel } from '../components/ChatPanel';
import type { Room, RoomSettings } from '../types/game';

interface LobbyScreenProps {
  room: Room;
  currentPlayerId: string;
  onLeaveRoom: () => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onKickPlayer: (playerId: string) => void;
  onSendMessage: (text: string) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  room,
  currentPlayerId,
  onLeaveRoom,
  onToggleReady,
  onStartGame,
  onUpdateSettings,
  onKickPlayer,
  onSendMessage,
}) => {
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const me = room.players.find((p) => p.id === currentPlayerId);
  const isHost = me?.isHost ?? false;

  const otherPlayers = room.players.filter((p) => !p.isHost);
  const allOtherReady = otherPlayers.length > 0 && otherPlayers.every((p) => p.isReady);
  const hasEnoughPlayers = room.players.length >= 2;

  const handleStartOrRemind = () => {
    if (!hasEnoughPlayers) return;
    if (allOtherReady) {
      onStartGame();
    } else {
      onSendMessage("Please ready up so we can start the game. 🎮");
    }
  };

  const handleSettingChange = (key: keyof RoomSettings, value: any) => {
    if (!isHost) return;
    onUpdateSettings({ [key]: value });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="h-screen max-h-screen flex flex-col p-4 md:p-8 relative">
      {/* Header */}
      <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-white/5 relative z-10 gap-4">
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-2 text-xs font-bold text-textMuted hover:text-textMain transition-colors uppercase tracking-widest group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="hidden sm:inline">Exit</span>
        </button>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-textMuted uppercase tracking-widest font-bold hidden sm:block">Table Code</span>
          <button 
            onClick={copyRoomCode}
            className="flex items-center gap-2 text-base font-mono font-black text-primary tracking-[0.3em] px-4 py-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          >
            {room.id}
            <Copy size={14} className={`transition-all ${codeCopied ? 'text-accent scale-110' : 'text-primary'}`} />
          </button>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 overflow-y-auto lg:overflow-hidden min-h-0">
        
        {/* LEFT: Settings Panel */}
        <div className="lg:col-span-3 xl:col-span-4 flex flex-col h-[600px] lg:h-full overflow-hidden min-h-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-panel p-6 rounded-3xl flex flex-col h-full min-h-0 border-t border-t-white/10">
            <h2 className="text-sm font-black uppercase tracking-widest text-textMain mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Settings2 size={16} className="text-primary" />
              </div>
              <span>Settings</span>
            </h2>

            <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Table Name</label>
                <input type="text" value={room.settings.roomName} onChange={(e) => handleSettingChange('roomName', e.target.value)} disabled={!isHost} className="w-full input-premium px-4 py-3 rounded-xl text-xs disabled:opacity-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Min Range</label>
                  <input type="number" value={room.settings.minNumber} onChange={(e) => handleSettingChange('minNumber', parseInt(e.target.value))} disabled={!isHost} className="w-full input-premium px-4 py-3 rounded-xl text-xs disabled:opacity-50 text-center" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Max Range</label>
                  <input type="number" value={room.settings.maxNumber} onChange={(e) => handleSettingChange('maxNumber', parseInt(e.target.value))} disabled={!isHost} className="w-full input-premium px-4 py-3 rounded-xl text-xs disabled:opacity-50 text-center" />
                </div>
              </div>
              <label className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
                <span className="text-xs font-bold text-textMain uppercase tracking-wider">Decimals</span>
                <input type="checkbox" checked={room.settings.isRealNumber} onChange={(e) => handleSettingChange('isRealNumber', e.target.checked)} disabled={!isHost} className="toggle-premium disabled:opacity-50" />
              </label>
              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Max Players</label>
                <div className="flex items-center gap-4 bg-black/30 p-3 rounded-xl border border-white/5">
                  <input type="range" min="2" max="12" value={room.settings.maxPlayers} onChange={(e) => handleSettingChange('maxPlayers', parseInt(e.target.value))} disabled={!isHost} className="flex-1 range-premium disabled:opacity-50" />
                  <span className="text-xs font-black text-primary w-4">{room.settings.maxPlayers}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Select Time</label>
                  <input type="number" value={room.settings.selectionTimeout} onChange={(e) => handleSettingChange('selectionTimeout', parseInt(e.target.value))} disabled={!isHost} className="w-full input-premium px-4 py-3 rounded-xl text-xs disabled:opacity-50 text-center" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Guess Time</label>
                  <input type="number" value={room.settings.turnTimeout} onChange={(e) => handleSettingChange('turnTimeout', parseInt(e.target.value))} disabled={!isHost} className="w-full input-premium px-4 py-3 rounded-xl text-xs disabled:opacity-50 text-center" />
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">Game Chat</span>
                  <input type="checkbox" checked={room.settings.chatEnabled} onChange={(e) => handleSettingChange('chatEnabled', e.target.checked)} disabled={!isHost} className="toggle-premium disabled:opacity-50 scale-90" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">Spectator Chat</span>
                  <input type="checkbox" checked={room.settings.eliminatedChatEnabled} onChange={(e) => handleSettingChange('eliminatedChatEnabled', e.target.checked)} disabled={!isHost} className="toggle-premium disabled:opacity-50 scale-90" />
                </label>
              </div>
            </div>
            
            {!isHost && (
              <div className="mt-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-3">
                <Shield size={16} className="text-warning" />
                <span className="text-[10px] font-bold text-warning uppercase tracking-widest leading-relaxed">Only host can modify</span>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: Players List */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[550px] lg:h-full space-y-6 overflow-hidden min-h-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-panel p-6 rounded-3xl flex flex-col flex-1 min-h-0 border-t border-t-white/10">
            <h2 className="text-sm font-black uppercase tracking-widest text-textMain mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Users size={16} className="text-primary" />
              </div>
              <span>Players ({room.players.length} / {room.settings.maxPlayers})</span>
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {room.players.map((player, idx) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex justify-between items-center p-4 rounded-2xl border transition-all duration-300 ${
                    player.id === currentPlayerId
                      ? 'bg-primary/10 border-primary/30 shadow-[0_4px_20px_rgba(16,185,129,0.1)]'
                      : 'bg-black/20 border-white/5 hover:bg-black/40 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg ${
                        player.isHost ? 'bg-gradient-to-br from-warning to-yellow-600' : 'bg-gradient-to-br from-primary to-secondary'
                      }`}>
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      {player.isHost && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                          <Crown size={10} className="text-warning" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-textMain flex items-center gap-2">
                        {player.username}
                        {player.id === currentPlayerId && (
                          <span className="text-[8px] px-2 py-0.5 rounded-full bg-primary/20 text-primary uppercase tracking-widest border border-primary/20">You</span>
                        )}
                      </span>
                      {player.isHost && <span className="text-[9px] text-warning uppercase font-bold tracking-widest mt-0.5">Host</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {player.isReady ? (
                      <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <CheckCircle size={14} />
                      </span>
                    ) : (
                      <span className="text-[10px] text-textMuted uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg bg-black/30 border border-white/5">
                        Wait
                      </span>
                    )}

                    {isHost && !player.isHost && (
                      <button
                        onClick={() => onKickPlayer(player.id)}
                        className="w-8 h-8 rounded-full bg-error/10 border border-error/20 flex items-center justify-center text-error hover:bg-error hover:text-white transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              {isHost ? (
                <button
                  onClick={handleStartOrRemind}
                  disabled={!hasEnoughPlayers}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 ${
                    !hasEnoughPlayers
                      ? 'bg-black/40 text-textMuted border border-white/5 cursor-not-allowed'
                      : allOtherReady
                      ? 'btn-primary'
                      : 'bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30'
                  }`}
                >
                  {!hasEnoughPlayers ? (
                    <span>Waiting for Players</span>
                  ) : allOtherReady ? (
                    <>
                      <Play size={16} fill="currentColor" />
                      <span>Start Game</span>
                    </>
                  ) : (
                    <span>Remind Players</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={onToggleReady}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
                    me?.isReady ? 'bg-black/40 text-textMuted border border-white/5' : 'btn-primary'
                  }`}
                >
                  {me?.isReady ? 'Cancel Ready' : 'Ready Up'}
                </button>
              )}
              {isHost && !hasEnoughPlayers && (
                <p className="text-[10px] text-warning text-center mt-3 uppercase font-bold tracking-widest">
                  Min 2 players required
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Chat Panel */}
        <div className="hidden lg:flex lg:col-span-4 xl:col-span-4 flex-col h-full overflow-hidden min-h-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <ChatPanel room={room} currentPlayerId={currentPlayerId} onSendMessage={onSendMessage} />
        </div>
      </div>

      {/* Mobile Chat Fab */}
      <div className="lg:hidden fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setMobileChatOpen(true)}
          className="w-14 h-14 rounded-full btn-primary flex items-center justify-center shadow-2xl"
        >
          <MessageSquare size={24} />
          {room.chatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning rounded-full flex items-center justify-center text-black font-black text-[10px] border-2 border-background">
              {room.chatMessages.length}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Chat Drawer */}
      <AnimatePresence>
        {mobileChatOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileChatOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full h-[80vh] flex flex-col z-10 p-4 rounded-t-3xl glass-panel border-b-0"
            >
              <div className="flex justify-between items-center mb-4 px-2">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/20" />
                <span className="text-sm font-black uppercase tracking-widest text-textMain mt-4">Game Chat</span>
                <button onClick={() => setMobileChatOpen(false)} className="mt-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-textMuted hover:text-white">
                  <XCircle size={16} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ChatPanel room={room} currentPlayerId={currentPlayerId} onSendMessage={onSendMessage} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LobbyScreen;
