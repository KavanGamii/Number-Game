"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
class RoomManager {
    rooms = new Map();
    socketToRoom = new Map(); // socket.id -> roomId
    timers = new Map(); // roomId -> Timer
    roomExpiryTimers = new Map();
    onRoomExpired;
    constructor() { }
    // Generate unique room ID
    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let roomId = '';
        do {
            roomId = '';
            for (let i = 0; i < 6; i++) {
                roomId += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.rooms.has(roomId));
        return roomId;
    }
    // Check if username is globally unique among all connected players
    isUsernameGloballyUnique(username) {
        const sanitized = username.trim().toLowerCase();
        for (const room of this.rooms.values()) {
            for (const player of room.players) {
                if (player.username.toLowerCase() === sanitized) {
                    return false;
                }
            }
        }
        return true;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId.toUpperCase());
    }
    getRoomBySocketId(socketId) {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId)
            return undefined;
        return this.getRoom(roomId);
    }
    getPublicRooms() {
        return Array.from(this.rooms.values())
            .filter((room) => !room.isPrivate)
            .map((room) => ({
            id: room.id,
            name: room.settings.roomName,
            playerCount: room.players.length,
            maxPlayers: room.settings.maxPlayers,
            status: room.status,
        }));
    }
    createRoom(settings, isPrivate, password) {
        const roomId = this.generateRoomId();
        const defaultSettings = {
            roomName: settings.roomName || `Room ${roomId}`,
            maxPlayers: settings.maxPlayers || 8,
            minNumber: settings.minNumber ?? 1,
            maxNumber: settings.maxNumber ?? 100,
            isRealNumber: settings.isRealNumber || false,
            hintDuration: settings.hintDuration || 4,
            selectionTimeout: settings.selectionTimeout || 30,
            turnTimeout: settings.turnTimeout || 20,
            chatEnabled: settings.chatEnabled ?? true,
            eliminatedChatEnabled: settings.eliminatedChatEnabled ?? true,
            autoStart: settings.autoStart ?? false,
        };
        const newRoom = {
            id: roomId,
            isPrivate,
            password: isPrivate ? password : undefined,
            status: 'lobby',
            settings: defaultSettings,
            players: [],
            gameState: {
                currentTurnPlayerId: null,
                guessesHistory: [],
                selectionTimer: 0,
                turnTimer: 0,
                activePlayerIds: [],
                winnerId: null,
            },
            chatMessages: [],
        };
        this.rooms.set(roomId, newRoom);
        return newRoom;
    }
    joinRoom(roomId, socketId, username, password) {
        const upperRoomId = roomId.toUpperCase();
        const room = this.rooms.get(upperRoomId);
        if (!room) {
            return { room: {}, error: 'Room not found.' };
        }
        if (room.isPrivate && room.password !== password) {
            return { room: {}, error: 'Invalid room password.' };
        }
        if (room.players.length >= room.settings.maxPlayers) {
            return { room: {}, error: 'Room is full.' };
        }
        if (!this.isUsernameGloballyUnique(username)) {
            return { room: {}, error: 'Username is already taken by another active player.' };
        }
        const isHost = room.players.length === 0;
        const newPlayer = {
            id: socketId,
            username: username.trim(),
            isHost,
            score: 0,
            isEliminated: false,
            secretNumber: null,
            lastGuessHint: null,
            isReady: isHost, // Host is ready by default
            missedTurns: 0,
        };
        room.players.push(newPlayer);
        this.socketToRoom.set(socketId, upperRoomId);
        // Cancel expiry timer if player count is > 1
        if (room.players.length > 1) {
            this.clearRoomExpiryTimer(upperRoomId);
        }
        // System message
        this.addSystemMessage(room, `${newPlayer.username} joined the lobby.`);
        return { room };
    }
    leaveRoom(socketId, onUpdate, onDelete) {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId)
            return;
        this.socketToRoom.delete(socketId);
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const playerIndex = room.players.findIndex((p) => p.id === socketId);
        if (playerIndex === -1)
            return;
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        this.addSystemMessage(room, `${player.username} left the room.`);
        if (player.isHost) {
            // Host left! Close the room and return remaining player IDs to kick them
            const remainingPlayerIds = room.players.map((p) => p.id);
            remainingPlayerIds.forEach((pid) => this.socketToRoom.delete(pid));
            this.clearTimer(roomId);
            this.clearRoomExpiryTimer(roomId);
            this.rooms.delete(roomId);
            onDelete(roomId);
            return remainingPlayerIds;
        }
        if (room.players.length === 0) {
            this.clearTimer(roomId);
            this.clearRoomExpiryTimer(roomId);
            this.rooms.delete(roomId);
            onDelete(roomId);
            return;
        }
        // If game is active and player leaves, handle mid-game exit
        if (room.status === 'selecting' || room.status === 'playing') {
            const activeIdx = room.gameState.activePlayerIds.indexOf(socketId);
            if (activeIdx !== -1) {
                room.gameState.activePlayerIds.splice(activeIdx, 1);
            }
            // Check if turn was current player
            if (room.gameState.currentTurnPlayerId === socketId && room.status === 'playing') {
                this.nextTurn(room, onUpdate);
            }
            else {
                this.checkWinConditions(room, onUpdate);
            }
        }
        // If only host remains, start expiry timer
        if (room.players.length === 1) {
            this.startRoomExpiryTimer(roomId);
        }
        onUpdate(room);
    }
    updateSettings(roomId, settings) {
        const room = this.getRoom(roomId);
        if (!room || room.status !== 'lobby')
            return undefined;
        room.settings = {
            ...room.settings,
            ...settings,
        };
        return room;
    }
    toggleReady(roomId, playerId) {
        const room = this.getRoom(roomId);
        if (!room)
            return undefined;
        const player = room.players.find((p) => p.id === playerId);
        if (player && !player.isHost) {
            player.isReady = !player.isReady;
        }
        return room;
    }
    kickPlayer(roomId, hostId, kickPlayerId) {
        const room = this.getRoom(roomId);
        if (!room || room.status !== 'lobby')
            return undefined;
        const host = room.players.find((p) => p.id === hostId);
        if (!host || !host.isHost)
            return undefined;
        const playerIndex = room.players.findIndex((p) => p.id === kickPlayerId);
        if (playerIndex !== -1) {
            const player = room.players[playerIndex];
            room.players.splice(playerIndex, 1);
            this.socketToRoom.delete(kickPlayerId);
            this.addSystemMessage(room, `${player.username} was kicked by the host.`);
            // If only host remains, start expiry timer
            if (room.players.length === 1) {
                this.startRoomExpiryTimer(room.id);
            }
            return room;
        }
        return undefined;
    }
    // Start the Selection Phase
    startSelectionPhase(roomId, onUpdate) {
        const room = this.getRoom(roomId);
        if (!room || (room.status !== 'lobby' && room.status !== 'ended'))
            return undefined;
        // Verify all other players are ready if starting from the lobby
        if (room.status === 'lobby') {
            const otherPlayers = room.players.filter((p) => !p.isHost);
            const allOtherReady = otherPlayers.length > 0 && otherPlayers.every((p) => p.isReady);
            if (!allOtherReady)
                return undefined;
        }
        room.status = 'selecting';
        room.gameState = {
            currentTurnPlayerId: null,
            guessesHistory: [],
            selectionTimer: room.settings.selectionTimeout,
            turnTimer: 0,
            activePlayerIds: room.players.map((p) => p.id),
            winnerId: null,
        };
        // Reset player specific round states
        room.players.forEach((p) => {
            p.isEliminated = false;
            p.secretNumber = null;
            p.lastGuessHint = null;
            p.missedTurns = 0;
        });
        // No system message for selection phase start to keep chat clean
        // Start Selection Countdown
        this.startSelectionTimer(room, onUpdate);
        return room;
    }
    startSelectionTimer(room, onUpdate) {
        this.clearTimer(room.id);
        const interval = setInterval(() => {
            if (room.gameState.selectionTimer > 0) {
                room.gameState.selectionTimer--;
                onUpdate(room);
            }
            else {
                this.clearTimer(room.id);
                // Force random selections for players who didn't lock a number
                room.players.forEach((p) => {
                    if (p.secretNumber === null) {
                        const range = room.settings.maxNumber - room.settings.minNumber;
                        let randomNum;
                        if (room.settings.isRealNumber) {
                            randomNum = Number((room.settings.minNumber + Math.random() * range).toFixed(1));
                        }
                        else {
                            randomNum = Math.floor(room.settings.minNumber + Math.random() * (range + 1));
                        }
                        p.secretNumber = randomNum;
                    }
                });
                this.startGuessingPhase(room, onUpdate);
            }
        }, 1000);
        this.timers.set(room.id, interval);
    }
    submitSecretNumber(roomId, playerId, num, onUpdate) {
        const room = this.getRoom(roomId);
        if (!room || room.status !== 'selecting') {
            return { error: 'Game is not in selecting phase.' };
        }
        const player = room.players.find((p) => p.id === playerId);
        if (!player) {
            return { error: 'Player not found.' };
        }
        if (num < room.settings.minNumber || num > room.settings.maxNumber) {
            return { error: `Number must be between ${room.settings.minNumber} and ${room.settings.maxNumber}.` };
        }
        if (!room.settings.isRealNumber && !Number.isInteger(num)) {
            return { error: 'Only integers are allowed in this room.' };
        }
        // Save number
        player.secretNumber = num;
        // Check if everyone has submitted
        const allSubmitted = room.players.every((p) => p.secretNumber !== null);
        if (allSubmitted) {
            this.clearTimer(room.id);
            this.startGuessingPhase(room, onUpdate);
        }
        else {
            onUpdate(room);
        }
        return { room };
    }
    startGuessingPhase(room, onUpdate) {
        room.status = 'playing';
        // Decide turn order starting from host (or first player in array)
        const hostPlayer = room.players.find((p) => p.isHost) || room.players[0];
        room.gameState.currentTurnPlayerId = hostPlayer.id;
        room.gameState.turnTimer = room.settings.turnTimeout;
        // No system message for turn order start to keep chat clean
        this.startTurnTimer(room, onUpdate);
        onUpdate(room);
    }
    startTurnTimer(room, onUpdate) {
        this.clearTimer(room.id);
        const interval = setInterval(() => {
            if (room.gameState.turnTimer > 0) {
                room.gameState.turnTimer--;
                onUpdate(room);
            }
            else {
                this.clearTimer(room.id);
                // Time expired! Auto-skip/pass turn
                const currentPlayer = room.players.find((p) => p.id === room.gameState.currentTurnPlayerId);
                if (currentPlayer) {
                    currentPlayer.missedTurns = (currentPlayer.missedTurns || 0) + 1;
                    this.addSystemMessage(room, `${currentPlayer.username} missed their turn (${currentPlayer.missedTurns}/3).`);
                    if (currentPlayer.missedTurns >= 3) {
                        currentPlayer.isEliminated = true;
                        this.addSystemMessage(room, `${currentPlayer.username} has been eliminated due to inactivity.`);
                    }
                }
                this.nextTurn(room, onUpdate);
            }
        }, 1000);
        this.timers.set(room.id, interval);
    }
    submitGuess(roomId, guesserId, guess, onUpdate) {
        const room = this.getRoom(roomId);
        if (!room || room.status !== 'playing') {
            return { error: 'Game is not in guessing phase.' };
        }
        if (room.gameState.currentTurnPlayerId !== guesserId) {
            return { error: 'It is not your turn.' };
        }
        const guesser = room.players.find((p) => p.id === guesserId);
        if (!guesser) {
            return { error: 'Guesser not found.' };
        }
        guesser.missedTurns = 0; // Reset consecutive misses on successful guess
        if (guess < room.settings.minNumber || guess > room.settings.maxNumber) {
            return { error: `Guess must be between ${room.settings.minNumber} and ${room.settings.maxNumber}.` };
        }
        this.clearTimer(room.id);
        // Calculate hints for every other ACTIVE player
        const hints = {};
        const hintDisplayMap = {};
        const eliminatedThisTurn = [];
        room.players.forEach((player) => {
            if (player.id === guesserId || player.isEliminated || player.secretNumber === null) {
                return;
            }
            let hint;
            if (guess < player.secretNumber) {
                hint = 'UP';
            }
            else if (guess > player.secretNumber) {
                hint = 'DOWN';
            }
            else {
                hint = 'CORRECT';
                player.isEliminated = true;
                player.lastGuessHint = 'CORRECT';
                eliminatedThisTurn.push(player);
            }
            player.lastGuessHint = hint;
            hints[player.id] = hint;
            hintDisplayMap[player.username] = hint;
        });
        // Record in history
        room.gameState.guessesHistory.push({
            guesserName: guesser.username,
            guess,
            timestamp: Date.now(),
            hints: hintDisplayMap,
        });
        // No system messages for guesses and eliminations to keep chat clean
        // Reset last guess hint after a delay (handled client-side, but clear state on server after timeout)
        const hintDurationMs = room.settings.hintDuration * 1000;
        setTimeout(() => {
            const activeRoom = this.getRoom(roomId);
            if (activeRoom) {
                activeRoom.players.forEach((p) => {
                    if (p.lastGuessHint !== 'CORRECT') {
                        p.lastGuessHint = null;
                    }
                });
                onUpdate(activeRoom);
            }
        }, hintDurationMs);
        // Verify win conditions
        const activePlayers = room.players.filter((p) => !p.isEliminated);
        if (activePlayers.length <= 1) {
            this.endRound(room, activePlayers[0] || guesser, onUpdate);
        }
        else {
            this.nextTurn(room, onUpdate);
        }
        return { room };
    }
    nextTurn(room, onUpdate) {
        const activePlayers = room.players.filter((p) => !p.isEliminated);
        if (activePlayers.length <= 1) {
            this.checkWinConditions(room, onUpdate);
            return;
        }
        // Find current index
        const currentIndex = room.players.findIndex((p) => p.id === room.gameState.currentTurnPlayerId);
        let nextIndex = (currentIndex + 1) % room.players.length;
        // Loop clockwise to find next non-eliminated player
        while (room.players[nextIndex].isEliminated) {
            nextIndex = (nextIndex + 1) % room.players.length;
        }
        room.gameState.currentTurnPlayerId = room.players[nextIndex].id;
        room.gameState.turnTimer = room.settings.turnTimeout;
        // No system message for next turns to keep chat clean
        this.startTurnTimer(room, onUpdate);
        onUpdate(room);
    }
    checkWinConditions(room, onUpdate) {
        const activePlayers = room.players.filter((p) => !p.isEliminated);
        if (activePlayers.length === 1) {
            this.endRound(room, activePlayers[0], onUpdate);
        }
        else if (activePlayers.length === 0) {
            // Edge case: everyone left or somehow no active players
            room.status = 'ended';
            room.gameState.winnerId = null;
            // No system message for empty lobby round ends to keep chat clean
            onUpdate(room);
        }
    }
    endRound(room, winner, onUpdate) {
        this.clearTimer(room.id);
        room.status = 'ended';
        room.gameState.winnerId = winner.id;
        winner.score += 1;
        // Reveal all numbers
        room.players.forEach((p) => {
            p.isEliminated = true; // For styling/display
        });
        // No system message for round winners to keep chat clean
        onUpdate(room);
    }
    addChatMessage(roomId, senderId, text) {
        const room = this.getRoom(roomId);
        if (!room || !room.settings.chatEnabled)
            return undefined;
        const sender = room.players.find((p) => p.id === senderId);
        if (!sender)
            return undefined;
        // Check chat restriction for eliminated players
        if (sender.isEliminated && room.status === 'playing' && !room.settings.eliminatedChatEnabled) {
            return undefined;
        }
        const newMessage = {
            id: Math.random().toString(36).substring(2, 9),
            senderUsername: sender.username,
            text: text.substring(0, 150), // Cap length
            timestamp: Date.now(),
            isSystem: false,
        };
        room.chatMessages.push(newMessage);
        return newMessage;
    }
    addSystemMessage(room, text) {
        const systemMessage = {
            id: Math.random().toString(36).substring(2, 9),
            senderUsername: 'System',
            text,
            timestamp: Date.now(),
            isSystem: true,
        };
        room.chatMessages.push(systemMessage);
    }
    clearTimer(roomId) {
        const timer = this.timers.get(roomId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(roomId);
        }
    }
    startRoomExpiryTimer(roomId) {
        this.clearRoomExpiryTimer(roomId);
        const timeout = setTimeout(() => {
            const room = this.rooms.get(roomId);
            if (room && room.players.length === 1) {
                const hostId = room.players[0].id;
                this.clearTimer(roomId);
                this.clearRoomExpiryTimer(roomId);
                this.rooms.delete(roomId);
                if (this.onRoomExpired) {
                    this.onRoomExpired(roomId, hostId);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
        this.roomExpiryTimers.set(roomId, timeout);
    }
    clearRoomExpiryTimer(roomId) {
        const timer = this.roomExpiryTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            this.roomExpiryTimers.delete(roomId);
        }
    }
}
exports.RoomManager = RoomManager;
