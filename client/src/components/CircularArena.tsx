import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, HelpCircle, Lock, Eye, EyeOff, Play, ArrowUp, ArrowDown, SmilePlus } from 'lucide-react';
import { audio } from '../utils/audio';
import type { Room, Player } from '../types/game';

interface CircularArenaProps {
  room: Room;
  currentPlayerId: string;
  onSubmitSecret: (num: number) => void;
  onSubmitGuess: (num: number) => void;
  error?: string | null;
  reactions?: {id: string, playerId: string, emoji: string}[];
  onSendReaction?: (emoji: string) => void;
}

export const CircularArena: React.FC<CircularArenaProps> = ({
  room,
  currentPlayerId,
  onSubmitSecret,
  onSubmitGuess,
  error,
  reactions = [],
  onSendReaction,
}) => {
  const [secretInput, setSecretInput] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });
  const tableRef = useRef<HTMLDivElement>(null);
  
  const [latestPopup, setLatestPopup] = useState<{ guess: number, hint: string, username: string, id: number } | null>(null);
  const lastProcessedTimestampRef = useRef<number>(0);

  const me = room.players.find((p) => p.id === currentPlayerId);
  const opponents = room.players.filter((p) => p.id !== currentPlayerId);
  const isMyTurn = room.gameState.currentTurnPlayerId === currentPlayerId;

  // Sound: Turn Change (Chip Clack)
  const currentTurnRef = useRef<string | null>(null);
  useEffect(() => {
    if (room.status === 'playing' && room.gameState.currentTurnPlayerId !== currentTurnRef.current) {
      currentTurnRef.current = room.gameState.currentTurnPlayerId;
      if (room.gameState.currentTurnPlayerId === currentPlayerId) {
        audio.playChipClack();
      }
    }
  }, [room.gameState.currentTurnPlayerId, room.status, currentPlayerId]);

  // Sound: Tick
  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    if (room.status === 'playing' && isMyTurn) {
      if (room.gameState.turnTimer !== lastTickRef.current) {
        lastTickRef.current = room.gameState.turnTimer;
        if (room.gameState.turnTimer <= 5 && room.gameState.turnTimer > 0) {
          audio.playTick(room.gameState.turnTimer, 5);
        }
      }
    }
  }, [room.gameState.turnTimer, room.status, isMyTurn]);

  // Responsive Table Resize via ResizeObserver
  useEffect(() => {
    if (!tableRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setTableSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  // Global Popup Trigger (Visible to ALL players when ANYONE guesses)
  useEffect(() => {
    if (room.gameState.guessesHistory.length > 0) {
      const last = room.gameState.guessesHistory[room.gameState.guessesHistory.length - 1];
      
      // Only process if this is a NEW guess (avoids re-triggering on every server tick)
      if (last.timestamp !== lastProcessedTimestampRef.current) {
        lastProcessedTimestampRef.current = last.timestamp;
        
        const player = room.players.find(p => p.username === last.guesserName);
        
        // Extract the hint from the guess history (hints received from opponents)
        const hintsArray = last.hints ? Object.values(last.hints) : [];
        let primaryHint = hintsArray[0] || null;
        if (hintsArray.includes('CORRECT')) primaryHint = 'WINNER';
        
        // If the round ended because of this guess, it's a winner
        const hint = room.status === 'ended' ? 'WINNER' : primaryHint;
        
        if (player && hint) {
          const popupData = {
            guess: last.guess,
            hint: hint,
            username: player.username,
            id: last.timestamp
          };
          setLatestPopup(popupData);
          
          // Sound
          audio.playBassSweep();
          if (hint === 'WINNER') {
            setTimeout(() => audio.playJackpot(), 500);
          }
          
          // Hide popup after 1.75 seconds
          setTimeout(() => {
            setLatestPopup(current => current?.id === popupData.id ? null : current);
          }, 1750);
        }
      }
    }
  }, [room.gameState.guessesHistory, room.players, room.status]);

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(secretInput);
    if (!isNaN(val)) onSubmitSecret(val);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(guessInput);
    if (!isNaN(val)) {
      onSubmitGuess(val);
      setGuessInput('');
    }
  };

  const handleNumberChange = (val: string, setter: (val: string) => void) => {
    if (val === '') {
      setter('');
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) return;

    if (num > room.settings.maxNumber) {
      setter(room.settings.maxNumber.toString());
    } else {
      setter(val);
    }
  };

  const getAvatarGradient = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'from-emerald-400 to-emerald-700',
      'from-amber-400 to-amber-700',
      'from-rose-400 to-rose-700',
      'from-sky-400 to-sky-700',
      'from-fuchsia-400 to-fuchsia-700',
      'from-indigo-400 to-indigo-700',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const isSmallScreen = tableSize.width < 500;
  
  const lastGuess = room.gameState.guessesHistory.length > 0
    ? room.gameState.guessesHistory[room.gameState.guessesHistory.length - 1]
    : null;

  // Component to render a player's chip and tag
  const renderPlayer = (player: Player) => {
    const isCurrentGuesser = room.gameState.currentTurnPlayerId === player.id && room.status === 'playing';
    const isEliminated = player.isEliminated && room.status !== 'lobby';

    return (
      <div
        key={player.id}
        className={`relative z-30 flex flex-col items-center transition-all duration-300 ${
          isEliminated ? 'opacity-40 grayscale' : 'opacity-100'
        } ${isCurrentGuesser ? '-translate-y-2' : ''}`}
      >
        {/* Floating Action Hint */}
        <AnimatePresence>
          {player.lastGuessHint && !isCurrentGuesser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -2 }} exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute -top-8 whitespace-nowrap px-2 py-0.5 rounded text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl border z-50 ${
                player.lastGuessHint === 'UP' ? 'bg-primary text-black border-primary' :
                player.lastGuessHint === 'DOWN' ? 'bg-error text-white border-error' :
                'bg-warning text-black border-warning'
              }`}
            >
              {player.lastGuessHint}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar Casino Chip */}
        <div className="relative flex justify-center items-center">
          
          {/* Active Player Timer Ring */}
          {isCurrentGuesser && room.status === 'playing' && (
             <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] -rotate-90 pointer-events-none z-0">
               <circle cx="50%" cy="50%" r="42%" fill="none" stroke="rgba(16,185,129,0.1)" strokeWidth="4" />
               <motion.circle 
                 cx="50%" cy="50%" r="42%" 
                 fill="none" 
                 stroke={room.gameState.turnTimer <= 5 ? '#ef4444' : '#10b981'} 
                 strokeWidth="4" 
                 strokeLinecap="round"
                 pathLength="100"
                 strokeDasharray="100"
                 initial={{ strokeDashoffset: 100 - (100 * (room.gameState.turnTimer / room.settings.turnTimeout)) }}
                 animate={{ strokeDashoffset: 100 - (100 * (room.gameState.turnTimer / room.settings.turnTimeout)) }}
                 transition={{ duration: 1, ease: "linear" }}
               />
             </svg>
          )}

          <div className={`relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-white text-lg md:text-xl border-4 bg-gradient-to-br ${getAvatarGradient(player.username)} transition-all duration-300 ${
            isCurrentGuesser ? 'border-primary shadow-[0_0_40px_rgba(16,185,129,0.8)] scale-110' : 'border-black shadow-[0_10px_20px_rgba(0,0,0,0.8)] opacity-70 scale-95'
          }`}>
            {/* Striped chip rim effect */}
            <div className="absolute inset-0 rounded-full border-2 border-white/20 border-dashed opacity-50 pointer-events-none" />
            {player.username.charAt(0).toUpperCase()}

            {/* Central Time Text (Mobile focus) */}
            {isCurrentGuesser && room.status === 'playing' && (
              <div className="absolute -bottom-3.5 bg-black/90 border border-primary text-primary px-2 py-0.5 rounded-full text-[9px] font-black tracking-[0.2em] shadow-[0_0_15px_rgba(16,185,129,0.5)] z-20">
                {room.gameState.turnTimer}S
              </div>
            )}
          </div>
          
          {player.isHost && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center border border-warning/30 shadow-lg z-20">
              <Crown size={12} className="text-warning" />
            </div>
          )}

          {isEliminated && player.secretNumber !== null && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center z-30">
              <div className="bg-error text-white text-[11px] font-black px-3 py-1 rounded-full border border-black shadow-lg">
                {player.secretNumber}
              </div>
            </div>
          )}
        </div>

        {/* Player Tag */}
        <div className={`mt-4 px-3 py-1 rounded-lg backdrop-blur-md flex flex-col items-center z-10 transition-all duration-300 ${
          isCurrentGuesser 
            ? 'bg-primary/20 border border-primary/40 shadow-[0_5px_20px_rgba(16,185,129,0.4)] scale-110' 
            : 'bg-black/90 border border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.8)] opacity-70'
        }`}>
          <span className={`text-[10px] md:text-[11px] font-black text-center w-[65px] md:w-[75px] truncate uppercase tracking-widest ${isCurrentGuesser ? 'text-primary drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'text-white'}`}>
            {player.username}
          </span>
          <span className="text-[9px] font-black text-amber-500 tracking-widest mt-0.5">
            {player.score} PTS
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-black p-2 md:p-6">
      
      {/* ---------------------------------------------------- */}
      {/* THE CASINO POKER TABLE                               */}
      {/* ---------------------------------------------------- */}
      <div 
        ref={tableRef}
        className="w-full h-full max-w-[1200px] max-h-[800px] relative rounded-[50px] md:rounded-[120px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between"
        style={{
           // Outer Leather Armrest
           background: '#1a100a', 
           boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9), 0 20px 40px rgba(0,0,0,0.9)',
           padding: isSmallScreen ? '14px' : '28px'
        }}
      >
         
         {/* TOP EDGE: OPPONENTS */}
         <div className="w-full flex justify-center flex-wrap gap-4 md:gap-8 z-30 -mt-8 md:-mt-12">
            {opponents.map(renderPlayer)}
         </div>

         {/* The Felt Inner Table (Positioned Absolutely behind players but inside leather) */}
         <div 
           className="absolute inset-[14px] md:inset-[28px] rounded-[38px] md:rounded-[100px] overflow-hidden flex flex-col items-center justify-center z-10"
           style={{
              // Rich Emerald Felt
              background: 'radial-gradient(ellipse at center, #0f5132 0%, #062615 100%)',
              boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.8)',
           }}
         >
            {/* Table Decals / Gold Rings */}
            <div className="absolute inset-0 border-[2px] border-amber-500/20 rounded-[38px] md:rounded-[98px] m-4 md:m-8 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-[50%] border-[1px] border-amber-500/10 pointer-events-none" />
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
              <div className="w-[1000px] h-[1000px]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '30px 30px' }} />
            </div>

            {/* Central Dealer/Status Console */}
            <div className="relative z-20 bg-black/70 backdrop-blur-md border border-amber-500/30 rounded-3xl md:rounded-[2rem] flex flex-col items-center justify-center p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.7)] w-[90%] max-w-[340px] overflow-hidden">
                
                {/* Inner console completely cleaned up - timer moved to active player avatar */}
                <AnimatePresence mode="wait">
                  {room.status === 'selecting' && (
                     <motion.div key="selecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center w-full mt-2">
                       {me?.secretNumber === null ? (
                          <form onSubmit={handleSecretSubmit} className="flex flex-col items-center w-full z-20">
                            <span className="text-amber-500 uppercase font-black tracking-widest mb-1 text-xs md:text-sm">Lock Number</span>
                            <span className="text-textMuted uppercase font-bold tracking-widest mb-4 text-[9px] md:text-[10px]">{room.settings.minNumber} to {room.settings.maxNumber}</span>
                            <div className="relative w-full mb-4">
                              <input 
                                type={showSecret ? 'number' : 'password'} 
                                inputMode="numeric" 
                                pattern="[0-9]*"
                                min={room.settings.minNumber} 
                                max={room.settings.maxNumber}
                                value={secretInput} 
                                onChange={(e) => handleNumberChange(e.target.value, setSecretInput)} 
                                placeholder="???" 
                                className="w-full text-center bg-black/60 border border-white/20 text-white font-black tracking-widest text-xl py-3 rounded-xl focus:outline-none focus:border-primary shadow-inner" 
                                required 
                              />
                              <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-white"><EyeOff size={18} /></button>
                            </div>
                            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(217,119,6,0.4)] font-black uppercase tracking-widest rounded-xl px-6 py-3 text-xs md:text-sm transition-all hover:scale-105 active:scale-95">Confirm Lock</button>
                          </form>
                       ) : (
                          <div className="flex flex-col items-center text-center py-4">
                            <Lock className="text-amber-500 mb-3" size={36} />
                            <span className="font-black text-white uppercase tracking-widest text-sm">Locked In</span>
                            <span className="font-black text-amber-500 mt-2 text-4xl md:text-5xl drop-shadow-md">{me?.secretNumber}</span>
                          </div>
                       )}
                     </motion.div>
                  )}

                  {room.status === 'playing' && (
                    <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center w-full z-20 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                         <span className={`font-black text-xs md:text-sm uppercase tracking-widest ${room.gameState.turnTimer <= 5 ? 'text-error animate-pulse' : 'text-primary'}`}>
                           Time: {room.gameState.turnTimer}s
                         </span>
                      </div>
                      
                      {isMyTurn ? (
                         me?.isEliminated ? (
                            <div className="py-6 flex flex-col items-center">
                              <span className="text-error font-black uppercase tracking-widest text-center text-xs md:text-sm">Eliminated<br/>Skipping Turn</span>
                            </div>
                         ) : (
                            <form onSubmit={handleGuessSubmit} className="flex flex-col items-center w-full">
                              <span className="text-amber-500 uppercase font-black tracking-widest mb-3 text-xs md:text-sm animate-pulse">Your Turn</span>
                              <div className="relative w-full">
                                <input 
                                  type="number" 
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  min={room.settings.minNumber} 
                                  max={room.settings.maxNumber}
                                  step={room.settings.isRealNumber ? '0.1' : '1'} 
                                  value={guessInput} 
                                  onChange={(e) => handleNumberChange(e.target.value, setGuessInput)} 
                                  placeholder="Guess" 
                                  className="w-full text-center bg-black/60 border-2 border-primary/50 text-white font-black text-xl py-3 rounded-xl focus:outline-none focus:border-primary shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" 
                                  required 
                                />
                                <button type="submit" className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-primary/80 text-white font-black uppercase tracking-widest rounded-lg px-4 text-[10px] md:text-xs shadow-lg transition-transform hover:scale-105 active:scale-95">GO</button>
                              </div>
                              {me?.powerUps?.interrogation && onSubmitInterrogation && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    audio.playChipClack();
                                    onSubmitInterrogation();
                                  }}
                                  className="mt-3 w-full border border-sky-500/50 text-sky-400 bg-sky-900/20 hover:bg-sky-900/40 rounded-xl py-2 font-black uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                                >
                                  <HelpCircle size={14} /> Reveal Odd/Even
                                </button>
                              )}
                            </form>
                         )
                      ) : (
                        <div className="flex flex-col items-center py-4">
                          <span className="text-textMuted uppercase font-bold tracking-widest mb-2 text-[10px] md:text-xs">Waiting for</span>
                          <span className="font-black text-white truncate max-w-[180px] text-center text-lg md:text-xl">
                            {room.players.find((p) => p.id === room.gameState.currentTurnPlayerId)?.username || '...'}
                          </span>
                        </div>
                      )}

                      {/* Display the Last Guess permanently in the center */}
                      {lastGuess && (
                        <div className="mt-5 pt-4 border-t border-white/10 w-full flex flex-col items-center">
                           <span className="text-[9px] md:text-[10px] font-bold text-textMuted uppercase tracking-widest mb-1">Last Play</span>
                           <span className="text-2xl md:text-3xl font-black text-amber-500 drop-shadow-md">{lastGuess.guess}</span>
                           <span className="text-[9px] md:text-[10px] font-bold text-white/40 mt-1">by {lastGuess.guesserName}</span>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {(room.status === 'lobby' || room.status === 'ended') && (
                    <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center mt-2">
                       {room.status === 'ended' ? (
                         <div className="flex flex-col items-center py-4">
                           <Crown size={48} className="text-warning mb-3 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]" />
                           <span className="uppercase font-black tracking-widest text-warning mb-1 text-[10px] md:text-xs">Winner</span>
                           <span className="font-black text-white truncate max-w-[200px] mb-6 text-2xl md:text-3xl">
                             {room.players.find((p) => p.id === room.gameState.winnerId)?.username || 'None'}
                           </span>
                           {me?.isHost && (
                             <button onClick={() => onSubmitSecret(-1)} className="bg-amber-600 text-white font-black uppercase tracking-widest rounded-xl flex items-center gap-2 px-6 py-3 text-xs md:text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(217,119,6,0.5)]">
                               <Play size={14} fill="currentColor" /> Play Again
                             </button>
                           )}
                         </div>
                       ) : (
                         <div className="flex flex-col items-center py-8">
                           <HelpCircle className="text-amber-500/50 mb-3" size={48} />
                           <span className="font-black text-amber-500 uppercase tracking-widest text-lg md:text-xl">Lobby</span>
                         </div>
                       )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* THE IN-CONSOLE GUESS POPUP (Covers the central console for 1.75s) */}
                <AnimatePresence>
                   {latestPopup && (
                     <motion.div
                       key={latestPopup.id}
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 1.1 }}
                       className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl pointer-events-none rounded-3xl md:rounded-[2rem]"
                     >
                        {/* Glowing Aura inside the console */}
                        <div className={`absolute inset-0 blur-[50px] opacity-30 -z-10 ${
                          latestPopup.hint === 'UP' ? 'bg-primary' : latestPopup.hint === 'DOWN' ? 'bg-error' : 'bg-warning'
                        }`} />
                        
                        <span className="text-white text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] bg-white/10 px-4 py-1.5 rounded-full border border-white/20 mb-3 shadow-lg">
                          {latestPopup.username} Guessed
                        </span>
                        
                        <span className="text-6xl md:text-7xl font-black text-white drop-shadow-lg leading-none my-1">
                          {latestPopup.guess}
                        </span>

                        <div className={`flex items-center gap-2 px-6 py-2 mt-4 rounded-full border-2 bg-black/80 shadow-xl ${
                          latestPopup.hint === 'UP' ? 'border-primary text-primary shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 
                          latestPopup.hint === 'DOWN' ? 'border-error text-error shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 
                          'border-warning text-warning shadow-[0_0_30px_rgba(234,179,8,0.5)]'
                        }`}>
                          {latestPopup.hint === 'UP' && <ArrowUp size={24} className="animate-bounce" />}
                          {latestPopup.hint === 'DOWN' && <ArrowDown size={24} className="animate-bounce" />}
                          {latestPopup.hint === 'WINNER' && <Crown size={24} className="animate-pulse" />}
                          <span className="text-lg md:text-xl font-black uppercase tracking-widest">
                            {latestPopup.hint === 'UP' ? 'GO HIGHER' : latestPopup.hint === 'DOWN' ? 'GO LOWER' : 'WINNER!'}
                          </span>
                        </div>
                     </motion.div>
                   )}
                </AnimatePresence>
             </div>
             
             {/* Floating Emoji Reactions */}
             <AnimatePresence>
               {reactions.map((reaction) => (
                   <motion.div
                     key={reaction.id}
                     initial={{ opacity: 0, scale: 0 }}
                     animate={{ 
                       opacity: [0, 1, 1, 0], 
                       scale: [0, 8, 8, 0], 
                       rotate: [0, -20, 20, -20, 20, 0] 
                     }}
                     exit={{ opacity: 0, scale: 0 }}
                     transition={{ duration: 1.5, times: [0, 0.15, 0.85, 1] }}
                     className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] text-6xl md:text-8xl pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
                   >
                     {reaction.emoji}
                   </motion.div>
                 ))}
             </AnimatePresence>

          </div>

          {/* BOTTOM EDGE: ME */}
         <div className="w-full flex justify-center z-30 -mb-8 md:-mb-12">
            {me && renderPlayer(me)}
         </div>

      </div>

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-error/90 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-[0_0_30px_rgba(239,68,68,0.5)] backdrop-blur-md z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default CircularArena;

