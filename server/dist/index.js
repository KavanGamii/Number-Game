"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const RoomManager_1 = require("./managers/RoomManager");
const gameHandler_1 = require("./handlers/gameHandler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middlewares
app.use((0, cors_1.default)({
    origin: '*', // For dev, allow all origins. Can be locked down later
    methods: ['GET', 'POST'],
}));
app.use(express_1.default.json());
// Basic health check route
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*', // Allow connections from Vite clients
        methods: ['GET', 'POST'],
    },
});
const roomManager = new RoomManager_1.RoomManager();
roomManager.onRoomExpired = (roomId, hostId) => {
    const hostSocket = io.sockets.sockets.get(hostId);
    if (hostSocket) {
        hostSocket.leave(roomId);
        hostSocket.emit('room:kicked', {
            message: 'Room closed due to inactivity (no other players joined for 5 minutes).',
        });
    }
    io.emit('rooms:public_list', roomManager.getPublicRooms());
};
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    (0, gameHandler_1.registerGameHandlers)(io, socket, roomManager);
});
httpServer.listen(PORT, () => {
    console.log(`Real-time game server running on port ${PORT}`);
});
