export interface Player {
  id: string;
  username: string;
  isHost: boolean;
  score: number;
  isEliminated: boolean;
  secretNumber: number | null;
  lastGuessHint: 'UP' | 'DOWN' | 'CORRECT' | null;
  isReady: boolean;
}

export interface ChatMessage {
  id: string;
  senderUsername: string;
  text: string;
  timestamp: number;
  isSystem: boolean;
}

export interface RoomSettings {
  roomName: string;
  maxPlayers: number;
  minNumber: number;
  maxNumber: number;
  isRealNumber: boolean;
  hintDuration: number;
  selectionTimeout: number;
  turnTimeout: number;
  chatEnabled: boolean;
  eliminatedChatEnabled: boolean;
  autoStart: boolean;
}

export interface GameState {
  currentTurnPlayerId: string | null;
  guessesHistory: {
    guesserName: string;
    guess: number;
    timestamp: number;
    hints: { [playerName: string]: 'UP' | 'DOWN' | 'CORRECT' };
  }[];
  selectionTimer: number;
  turnTimer: number;
  activePlayerIds: string[];
  winnerId: string | null;
}

export interface Room {
  id: string;
  isPrivate: boolean;
  status: 'lobby' | 'selecting' | 'playing' | 'ended';
  settings: RoomSettings;
  players: Player[];
  gameState: GameState;
  chatMessages: ChatMessage[];
}
