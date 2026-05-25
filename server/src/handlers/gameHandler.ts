import { Server, Socket } from 'socket.io';
import { RoomManager } from '../managers/RoomManager';
import { RoomSettings } from '../types/game';

export function registerGameHandlers(io: Server, socket: Socket, roomManager: RoomManager) {
  // Helper to broadcast room updates
  const broadcastRoomUpdate = (roomId: string) => {
    const room = roomManager.getRoom(roomId);
    if (room) {
      io.to(roomId).emit('room:updated', room);
    }
  };

  // Helper to send global public rooms list
  const broadcastPublicRooms = () => {
    io.emit('rooms:public_list', roomManager.getPublicRooms());
  };

  // Create room
  socket.on(
    'room:create',
    (
      payload: { settings: Partial<RoomSettings>; isPrivate: boolean; password?: string; username: string },
      callback: (response: { success: boolean; roomId?: string; error?: string }) => void
    ) => {
      try {
        const { settings, isPrivate, password, username } = payload;

        if (!roomManager.isUsernameGloballyUnique(username)) {
          return callback({ success: false, error: 'Username is already taken by another active player.' });
        }

        const room = roomManager.createRoom(settings, isPrivate, password);
        const { room: joinedRoom, error } = roomManager.joinRoom(room.id, socket.id, username, password);

        if (error) {
          return callback({ success: false, error });
        }

        socket.join(room.id);
        callback({ success: true, roomId: room.id });
        broadcastRoomUpdate(room.id);
        broadcastPublicRooms();
      } catch (err: any) {
        callback({ success: false, error: err.message || 'Failed to create room.' });
      }
    }
  );

  // Join room
  socket.on(
    'room:join',
    (
      payload: { roomId: string; username: string; password?: string },
      callback: (response: { success: boolean; roomId?: string; error?: string }) => void
    ) => {
      try {
        const { roomId, username, password } = payload;
        const { room, error } = roomManager.joinRoom(roomId, socket.id, username, password);

        if (error) {
          return callback({ success: false, error });
        }

        socket.join(room.id);
        callback({ success: true, roomId: room.id });
        broadcastRoomUpdate(room.id);
        broadcastPublicRooms();
      } catch (err: any) {
        callback({ success: false, error: err.message || 'Failed to join room.' });
      }
    }
  );

  // List public rooms
  socket.on('rooms:get_public', (callback: (rooms: any[]) => void) => {
    callback(roomManager.getPublicRooms());
  });

  // Update Settings
  socket.on('room:update_settings', (payload: { settings: Partial<RoomSettings> }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    // Check if sender is host
    const player = room.players.find((p) => p.id === socket.id);
    if (!player || !player.isHost) return;

    roomManager.updateSettings(room.id, payload.settings);
    broadcastRoomUpdate(room.id);
    broadcastPublicRooms();
  });

  // Kick Player
  socket.on('room:kick_player', (payload: { playerId: string }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const kickedPlayerId = payload.playerId;
    const updatedRoom = roomManager.kickPlayer(room.id, socket.id, kickedPlayerId);

    if (updatedRoom) {
      // Disconnect socket from room namespace
      const targetSocket = io.sockets.sockets.get(kickedPlayerId);
      if (targetSocket) {
        targetSocket.leave(room.id);
        targetSocket.emit('room:kicked', { message: 'You were kicked by the host.' });
      }
      broadcastRoomUpdate(room.id);
      broadcastPublicRooms();
    }
  });

  // Ready toggling
  socket.on('room:toggle_ready', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.toggleReady(room.id, socket.id);
    broadcastRoomUpdate(room.id);
  });

  // Start selection phase
  socket.on('game:start', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player || !player.isHost) return;

    roomManager.startSelectionPhase(room.id, (updatedRoom) => {
      io.to(updatedRoom.id).emit('room:updated', updatedRoom);
    });
    broadcastPublicRooms();
  });

  // Submit secret number
  socket.on(
    'game:submit_secret',
    (payload: { number: number }, callback: (res: { success: boolean; error?: string }) => void) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return callback({ success: false, error: 'Room not found.' });

      const { room: updatedRoom, error } = roomManager.submitSecretNumber(
        room.id,
        socket.id,
        payload.number,
        (uRoom) => {
          io.to(uRoom.id).emit('room:updated', uRoom);
        }
      );

      if (error) {
        callback({ success: false, error });
      } else {
        callback({ success: true });
        if (updatedRoom) {
          io.to(updatedRoom.id).emit('room:updated', updatedRoom);
        }
      }
    }
  );

  // Submit guess
  socket.on(
    'game:submit_guess',
    (payload: { guess: number }, callback: (res: { success: boolean; error?: string }) => void) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return callback({ success: false, error: 'Room not found.' });

      const { room: updatedRoom, error } = roomManager.submitGuess(
        room.id,
        socket.id,
        payload.guess,
        (uRoom) => {
          io.to(uRoom.id).emit('room:updated', uRoom);
        }
      );

      if (error) {
        callback({ success: false, error });
      } else {
        callback({ success: true });
        if (updatedRoom) {
          io.to(updatedRoom.id).emit('room:updated', updatedRoom);
        }
      }
    }
  );

  // Use Interrogation Power Up
  socket.on(
    'game:interrogate',
    (callback: (res: { success: boolean; error?: string }) => void) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return callback({ success: false, error: 'Room not found.' });

      const { room: updatedRoom, error } = roomManager.useInterrogation(
        room.id,
        socket.id,
        (uRoom) => {
          io.to(uRoom.id).emit('room:updated', uRoom);
        }
      );

      if (error) {
        callback({ success: false, error });
      } else {
        callback({ success: true });
        if (updatedRoom) {
          io.to(updatedRoom.id).emit('room:updated', updatedRoom);
        }
      }
    }
  );

  // Send message
  socket.on('chat:send', (payload: { text: string }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const message = roomManager.addChatMessage(room.id, socket.id, payload.text);
    if (message) {
      io.to(room.id).emit('chat:received', message);
    }
  });

  // Emoji Reactions
  socket.on('reaction:send', (payload: { emoji: string }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;
    io.to(room.id).emit('reaction:received', { playerId: socket.id, emoji: payload.emoji, id: Math.random().toString() });
  });

  // Request restart (play again)
  socket.on('game:restart', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player || !player.isHost) return;

    roomManager.startSelectionPhase(room.id, (updatedRoom) => {
      io.to(updatedRoom.id).emit('room:updated', updatedRoom);
    });
  });

  // Helper to handle player leaving
  const handlePlayerLeave = (socketId: string, roomId: string) => {
    const kickedIds = roomManager.leaveRoom(
      socketId,
      (updatedRoom) => {
        io.to(roomId).emit('room:updated', updatedRoom);
      },
      (deletedRoomId) => {
        broadcastPublicRooms();
      }
    );

    if (kickedIds && kickedIds.length > 0) {
      kickedIds.forEach((id) => {
        const targetSocket = io.sockets.sockets.get(id);
        if (targetSocket) {
          targetSocket.leave(roomId);
          targetSocket.emit('room:kicked', { message: 'The host has left, and the room has been closed.' });
        }
      });
    }
    broadcastPublicRooms();
  };

  // Leave room
  socket.on('room:leave', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      const roomId = room.id;
      socket.leave(roomId);
      handlePlayerLeave(socket.id, roomId);
    }
  });

  // Leave / Disconnect
  socket.on('disconnect', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      handlePlayerLeave(socket.id, room.id);
    }
  });
}
