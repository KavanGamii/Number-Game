import React from 'react';
import { useGameState } from './hooks/useGameState';
import { useSocket } from './context/SocketContext';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { GameScreen } from './screens/GameScreen';
import { WifiOff, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const { isConnected } = useSocket();
  const {
    room,
    username,
    saveUsername,
    error,
    loading,
    kickedMessage,
    publicRooms,
    clearError,
    createRoom,
    joinRoom,
    getPublicRooms,
    updateSettings,
    kickPlayer,
    toggleReady,
    startGame,
    submitSecretNumber,
    submitGuess,
    submitInterrogation,
    sendChatMessage,
    restartGame,
    leaveRoom,
  } = useGameState();

  // Initialize audio on first user interaction to bypass browser autoplay blocks
  React.useEffect(() => {
    const initAudio = () => {
      import('./utils/audio').then(({ audio }) => {
        audio.init();
      });
      window.removeEventListener('click', initAudio);
    };
    window.addEventListener('click', initAudio);
    return () => window.removeEventListener('click', initAudio);
  }, []);

  // Prevent accidental navigation when in a room
  React.useEffect(() => {
    if (!room) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Standard for most browsers to show a prompt
    };

    const handlePopState = (e: PopStateEvent) => {
      // Prevent going back by pushing state again
      window.history.pushState(null, '', window.location.href);
      alert("Please use the Exit button in the top left to leave the game safely.");
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Initial push to ensure popstate works for the back button block
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [room]);

  // If WebSocket is not connected, show visual offline splash/warning
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 select-none relative">
        <div className="noise-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center animate-scale-in">
          <div className="p-5 rounded-full mb-6 glass-panel animate-pulse-slow">
            <WifiOff className="text-error" size={32} />
          </div>
          <h2 className="text-2xl font-bold tracking-widest uppercase mb-3 text-textMain">
            Connecting
          </h2>
          <p className="text-sm text-textMuted max-w-[300px] text-center leading-relaxed">
            Establishing secure connection to the premium gaming server.
          </p>
          <div className="flex gap-2 mt-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                style={{ 
                  animation: 'slide-up 0.6s infinite alternate',
                  animationDelay: `${i * 0.15}s` 
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle kicked message overlay
  if (kickedMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <div className="noise-overlay" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />
        
        <div className="w-full max-w-sm p-8 glass-panel rounded-3xl text-center animate-slide-up relative z-10 border border-error/20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-error rounded-b-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20 mb-6">
            <AlertTriangle className="text-error" size={28} />
          </div>
          
          <h2 className="text-xl font-bold text-textMain uppercase mb-3 tracking-wide">
            Access Revoked
          </h2>
          <p className="text-sm text-textMuted leading-relaxed mb-8">
            {kickedMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 btn-primary rounded-xl uppercase font-bold tracking-widest text-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render screens dynamically with a loading overlay helper
  let activeScreen;
  if (!username) {
    activeScreen = (
      <AuthScreen
        onLoginSuccess={(name) => saveUsername(name)}
        savedUsername={username}
      />
    );
  } else if (room) {
    if (room.status === 'lobby') {
      activeScreen = (
        <LobbyScreen
          room={room}
          currentPlayerId={room.players.find((p) => p.username === username)?.id || ''}
          onLeaveRoom={leaveRoom}
          onToggleReady={toggleReady}
          onStartGame={startGame}
          onUpdateSettings={updateSettings}
          onKickPlayer={kickPlayer}
          onSendMessage={sendChatMessage}
        />
      );
    } else {
      activeScreen = (
        <GameScreen
          room={room}
          currentPlayerId={room.players.find((p) => p.username === username)?.id || ''}
          onLeaveRoom={leaveRoom}
          onSubmitSecret={(num) => {
            if (num === -1) {
              restartGame();
            } else {
              submitSecretNumber(num);
            }
          }}
          onSubmitGuess={submitGuess}
          onSubmitInterrogation={submitInterrogation}
          onSendMessage={sendChatMessage}
          onRestartGame={restartGame}
          error={error}
        />
      );
    }
  } else {
    activeScreen = (
      <HomeScreen
        username={username}
        publicRooms={publicRooms}
        onRefreshPublicRooms={getPublicRooms}
        onCreateRoom={createRoom}
        onJoinRoom={(roomId, pwd) => joinRoom(roomId, undefined, pwd)}
        onLogout={() => saveUsername('')}
        error={error}
        clearError={clearError}
      />
    );
  }

  return (
    <>
      <div className="noise-overlay" />
      {activeScreen}

      {/* Subtle Premium Watermark */}
      <div className="fixed bottom-4 left-6 z-40 pointer-events-none select-none text-[10px] tracking-[0.25em] uppercase font-bold flex items-center gap-2 opacity-30 mix-blend-overlay">
        <span>© 2026</span>
        <span className="w-1 h-1 rounded-full bg-primary" />
        <span>Sic Mundus</span>
      </div>

      {/* Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            </div>
            <span className="text-xs text-primary font-bold uppercase tracking-widest animate-pulse">
              Processing
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
