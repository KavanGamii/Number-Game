import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, History, MessageSquare, Crown, Medal, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularArena } from '../components/CircularArena';
import { ChatPanel } from '../components/ChatPanel';
import { useSocket } from '../context/SocketContext';
import { audio } from '../utils/audio';
import type { Room } from '../types/game';

interface GameScreenProps {
  room: Room;
  currentPlayerId: string;
  onLeaveRoom: () => void;
  onSubmitSecret: (num: number) => void;
  onSubmitGuess: (num: number) => void;
  onSubmitInterrogation: () => void;
  onSendMessage: (text: string) => void;
  onRestartGame: () => void;
  error?: string | null;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  room,
  currentPlayerId,
  onLeaveRoom,
  onSubmitSecret,
  onSubmitGuess,
  onSubmitInterrogation,
  onSendMessage,
  onRestartGame,
  error,
}) => {
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'standings'>('feed');

  const { socket } = useSocket();
  const [reactions, setReactions] = useState<{id: string, playerId: string, emoji: string}[]>([]);

  useEffect(() => {
    if (!socket) return;
    const handleReaction = (payload: {id: string, playerId: string, emoji: string}) => {
      setReactions(prev => [...prev, payload]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== payload.id));
      }, 1500);
    };
    socket.on('reaction:received', handleReaction);
    return () => {
      socket.off('reaction:received', handleReaction);
    };
  }, [socket]);

  const sendReaction = (emoji: string) => {
    if (socket) socket.emit('reaction:send', { emoji });
  };

  useEffect(() => {
    if (room.status === 'ended' && room.gameState.winnerId) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [room.status, room.gameState.winnerId]);

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown size={14} className="text-warning" />;
    if (rank === 1) return <Medal size={14} className="text-gray-300" />;
    if (rank === 2) return <Medal size={14} className="text-amber-700" />;
    return <span className="font-mono text-textMuted/50 text-[10px] font-bold">#{rank + 1}</span>;
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 relative overflow-x-hidden">
      {/* Header */}
      <header className="w-full max-w-[1400px] mx-auto flex items-center justify-between mb-6 pb-4 border-b border-white/5 relative z-10 flex-shrink-0">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="flex items-center gap-2 text-xs font-bold text-textMuted hover:text-textMain transition-colors uppercase tracking-widest group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-error/20 group-hover:text-error group-hover:border-error/30 transition-all">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="hidden sm:inline group-hover:text-error transition-colors">Exit</span>
        </button>

        <div className="px-5 py-2.5 glass-pill flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${room.status === 'ended' ? 'bg-warning' : 'bg-primary animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-textMain">
            {room.status === 'selecting' && 'Number Selection'}
            {room.status === 'playing' && 'Live Arena'}
            {room.status === 'ended' && 'Round Complete'}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[9px] text-textMuted font-bold uppercase tracking-widest">Table Code</span>
          <span className="text-sm font-mono font-black text-primary tracking-[0.2em]">{room.id}</span>
        </div>
      </header>

      <div className="w-full max-w-[1400px] mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 min-h-0">
        
        {/* LEFT: Game Arena & History */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col space-y-6 animate-scale-in">
          
          {/* Main Table */}
          <div className="flex-1 min-h-[450px] lg:min-h-[550px] glass-panel rounded-[2rem] md:rounded-[3rem] relative overflow-hidden group">
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <CircularArena
              room={room}
              currentPlayerId={currentPlayerId}
              onSubmitSecret={(num) => num === -1 ? onRestartGame() : onSubmitSecret(num)}
              onSubmitGuess={onSubmitGuess}
              onSubmitInterrogation={onSubmitInterrogation}
              error={error}
              reactions={reactions}
              onSendReaction={sendReaction}
            />
          </div>
        </div>

        {/* RIGHT: Rankings & Chat */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col space-y-6 h-full overflow-hidden min-h-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Action & Standings Dashboard */}
          <div className="glass-panel rounded-3xl flex-shrink-0 flex flex-col h-[320px] lg:h-[45%] overflow-hidden shadow-2xl border border-white/10" style={{ background: 'linear-gradient(180deg, rgba(20,20,20,0.9) 0%, rgba(10,10,10,0.95) 100%)' }}>
            {/* Tabs Header */}
            <div className="flex border-b border-white/10 bg-black/50 p-1.5 gap-1">
              <button 
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all ${activeTab === 'feed' ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-textMuted hover:text-white hover:bg-white/5'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <History size={14} /> Live Feed
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('standings')}
                className={`flex-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all ${activeTab === 'standings' ? 'bg-warning/20 text-warning shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'text-textMuted hover:text-white hover:bg-white/5'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Trophy size={14} /> Standings
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {activeTab === 'feed' ? (
                  <motion.div key="feed" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="absolute inset-0 overflow-y-auto p-4 custom-scrollbar space-y-3">
                    {room.gameState.guessesHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-textMuted/40 italic">
                        <History size={32} className="mb-2 opacity-20" />
                        <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold">No Action Yet</span>
                      </div>
                    ) : (
                      [...room.gameState.guessesHistory].reverse().map((g, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${idx === 0 ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-black/40 border-white/5'}`}>
                          <div className="flex flex-col">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-textMuted mb-1">{g.guesserName}</span>
                            <span className={`text-xl md:text-2xl font-black ${idx === 0 ? 'text-primary' : 'text-white'}`}>{g.guess}</span>
                          </div>
                          <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                            Play #{room.gameState.guessesHistory.length - idx}
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="standings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="absolute inset-0 overflow-y-auto p-4 custom-scrollbar space-y-3">
                    {sortedPlayers.map((player, rank) => (
                      <div key={player.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${rank === 0 ? 'bg-gradient-to-r from-warning/20 to-warning/5 border-warning/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'bg-black/40 border-white/5'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black ${rank === 0 ? 'bg-warning text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-white/10 text-white'}`}>
                            {rank === 0 ? <Crown size={18} /> : rank + 1}
                          </div>
                          <span className={`text-xs md:text-sm font-black uppercase tracking-[0.1em] ${player.isEliminated && room.status !== 'lobby' ? 'line-through text-textMuted/50' : 'text-white'}`}>
                            {player.username}
                          </span>
                        </div>
                        <span className={`text-[10px] md:text-xs font-black tracking-widest uppercase ${rank === 0 ? 'text-warning' : 'text-textMuted'}`}>
                          {player.score} PTS
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Chat (Desktop) */}
          <div className="hidden lg:flex flex-1 min-h-0">
            <ChatPanel room={room} currentPlayerId={currentPlayerId} onSendMessage={onSendMessage} />
          </div>
        </div>
      </div>

      {/* Fixed Emoji Toolbar */}
      {/* {!room.players.find(p => p.id === currentPlayerId)?.isEliminated && room.status === 'playing' && (
        <div className="fixed left-4 lg:left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3 bg-black/80 backdrop-blur-xl px-2 py-4 rounded-full border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          {['🤬', '🎯', '😱', '🤡'].map(emoji => (
            <button 
              key={emoji}
              onClick={() => {
                sendReaction(emoji);
                import('../utils/audio').then(({ audio }) => audio.playChipClack());
              }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 hover:scale-125 hover:bg-white/20 transition-all text-xl md:text-2xl flex items-center justify-center hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]"
            >
              {emoji}
            </button>
          ))}
        </div>
      )} */}

      {/* Mobile Chat Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setMobileChatOpen(true)}
          className="w-16 h-16 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.8)] hover:bg-white/10 transition-all group"
        >
          <MessageSquare size={28} className="text-white group-hover:text-primary transition-colors" />
          {room.chatMessages.filter(m => !m.isSystem).length > 0 && (
            <span className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-black font-black text-[11px] shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-black">
              {room.chatMessages.filter(m => !m.isSystem).length}
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
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ChatPanel room={room} currentPlayerId={currentPlayerId} onSendMessage={onSendMessage} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowExitConfirm(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm glass-panel rounded-3xl p-8 text-center z-10 border-t border-error/50 shadow-[0_0_50px_rgba(239,68,68,0.15)]"
            >
              <div className="w-16 h-16 mx-auto bg-error/10 border border-error/20 rounded-2xl flex items-center justify-center mb-6">
                <ArrowLeft size={28} className="text-error" />
              </div>
              <h2 className="text-xl font-black text-textMain uppercase tracking-widest mb-3">Abandon Game?</h2>
              <p className="text-sm text-textMuted leading-relaxed mb-8">
                Exiting now will eliminate you from the current match. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-4 btn-ghost rounded-xl text-xs font-bold uppercase tracking-widest">
                  Stay
                </button>
                <button onClick={() => { setShowExitConfirm(false); onLeaveRoom(); }} className="flex-1 py-4 bg-error text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-error/90 transition-colors shadow-[0_4px_15px_rgba(239,68,68,0.4)]">
                  Leave
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameScreen;
