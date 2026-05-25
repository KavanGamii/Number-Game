import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import type { Room, RoomSettings, ChatMessage } from '../types/game';

export const useGameState = () => {
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState<Room | null>(null);
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('guess_game_username') || '';
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [kickedMessage, setKickedMessage] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);

  // Reset states
  const clearError = () => setError(null);

  // Sync username to local storage
  const saveUsername = (name: string) => {
    setUsername(name);
    localStorage.setItem('guess_game_username', name);
  };

  // Socket action handlers
  const createRoom = useCallback(
    (settings: Partial<RoomSettings>, isPrivate: boolean, password?: string, guestName?: string) => {
      if (!socket || !isConnected) return;
      setLoading(true);
      setError(null);
      setKickedMessage(null);

      const resolvedUsername = guestName || username;
      if (guestName) saveUsername(guestName);

      socket.emit(
        'room:create',
        { settings, isPrivate, password, username: resolvedUsername },
        (res: { success: boolean; roomId?: string; error?: string }) => {
          setLoading(false);
          if (!res.success) {
            setError(res.error || 'Failed to create room.');
          }
        }
      );
    },
    [socket, isConnected, username]
  );

  const joinRoom = useCallback(
    (roomId: string, guestName?: string, password?: string) => {
      if (!socket || !isConnected) return;
      setLoading(true);
      setError(null);
      setKickedMessage(null);

      const resolvedUsername = guestName || username;
      if (guestName) saveUsername(guestName);

      socket.emit(
        'room:join',
        { roomId, username: resolvedUsername, password },
        (res: { success: boolean; roomId?: string; error?: string }) => {
          setLoading(false);
          if (!res.success) {
            setError(res.error || 'Failed to join room.');
          }
        }
      );
    },
    [socket, isConnected, username]
  );

  const getPublicRooms = useCallback(() => {
    if (!socket || !isConnected) return;
    socket.emit('rooms:get_public', (rooms: any[]) => {
      setPublicRooms(rooms);
    });
  }, [socket, isConnected]);

  const updateSettings = useCallback(
    (settings: Partial<RoomSettings>) => {
      if (!socket || !isConnected || !room) return;
      socket.emit('room:update_settings', { settings });
    },
    [socket, isConnected, room]
  );

  const kickPlayer = useCallback(
    (playerId: string) => {
      if (!socket || !isConnected || !room) return;
      socket.emit('room:kick_player', { playerId });
    },
    [socket, isConnected, room]
  );

  const toggleReady = useCallback(() => {
    if (!socket || !isConnected || !room) return;
    socket.emit('room:toggle_ready');
  }, [socket, isConnected, room]);

  const startGame = useCallback(() => {
    if (!socket || !isConnected || !room) return;
    socket.emit('game:start');
  }, [socket, isConnected, room]);

  const submitSecretNumber = useCallback(
    (num: number) => {
      if (!socket || !isConnected || !room) return;
      setError(null);
      socket.emit('game:submit_secret', { number: num }, (res: { success: boolean; error?: string }) => {
        if (!res.success) {
          setError(res.error || 'Invalid secret number selection.');
        }
      });
    },
    [socket, isConnected, room]
  );

  const submitGuess = useCallback(
    (num: number) => {
      if (!socket || !isConnected || !room) return;
      setError(null);
      socket.emit('game:submit_guess', { guess: num }, (res: { success: boolean; error?: string }) => {
        if (!res.success) {
          setError(res.error || 'Invalid guess submission.');
        }
      });
    },
    [socket, isConnected, room]
  );

  const submitInterrogation = useCallback(() => {
    if (!socket || !isConnected || !room) return;
    setError(null);
    socket.emit('game:interrogate', (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        setError(res.error || 'Invalid interrogation.');
      }
    });
  }, [socket, isConnected, room]);

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!socket || !isConnected || !room) return;
      socket.emit('chat:send', { text });
    },
    [socket, isConnected, room]
  );

  const restartGame = useCallback(() => {
    if (!socket || !isConnected || !room) return;
    socket.emit('game:restart');
  }, [socket, isConnected, room]);

  const leaveRoom = useCallback(() => {
    if (!socket || !isConnected || !room) return;
    socket.emit('room:leave'); // trigger leave
    setRoom(null);
    setError(null);
  }, [socket, isConnected, room]);

  // Setup listeners
  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdated = (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setError(null);
    };

    const handleChatReceived = (msg: ChatMessage) => {
      setRoom((prevRoom) => {
        if (!prevRoom) return null;
        return {
          ...prevRoom,
          chatMessages: [...prevRoom.chatMessages, msg],
        };
      });
    };

    const handleKicked = (payload: { message: string }) => {
      setRoom(null);
      setKickedMessage(payload.message);
    };

    const handlePublicList = (list: any[]) => {
      setPublicRooms(list);
    };

    socket.on('room:updated', handleRoomUpdated);
    socket.on('chat:received', handleChatReceived);
    socket.on('room:kicked', handleKicked);
    socket.on('rooms:public_list', handlePublicList);

    // Initial load of public rooms
    getPublicRooms();

    return () => {
      socket.off('room:updated', handleRoomUpdated);
      socket.off('chat:received', handleChatReceived);
      socket.off('room:kicked', handleKicked);
      socket.off('rooms:public_list', handlePublicList);
    };
  }, [socket, getPublicRooms]);

  return {
    room,
    username,
    saveUsername,
    error,
    loading,
    kickedMessage,
    publicRooms,
    isConnected,
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
  };
};
