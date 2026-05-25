import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './managers/RoomManager';
import { registerGameHandlers } from './handlers/gameHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: '*', // For dev, allow all origins. Can be locked down later
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow connections from Vite clients
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

roomManager.onRoomExpired = (roomId: string, hostId: string) => {
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
  registerGameHandlers(io, socket, roomManager);
});

httpServer.listen(PORT, () => {
  console.log(`Real-time game server running on port ${PORT}`);
});
