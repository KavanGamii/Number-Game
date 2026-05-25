# High-Roller Multiplayer Number Guessing Game 🎰

A sleek, real-time multiplayer number guessing game built with a highly premium **Casino-Style** design. Play with your friends in a high-stakes, action-packed lobby where you lock in a secret number and try to guess your opponents' numbers before they guess yours!

## ✨ Features

- **Real-Time Multiplayer:** Powered by **Socket.IO** for instant, latency-free gameplay synchronization.
- **Premium Casino UI/UX:** Ultra-premium glassmorphism, dynamic glowing gradients, beautiful transitions, and micro-animations built with **Framer Motion** and **Tailwind CSS**.
- **Interactive Game Arena:** A stunning digital "felt" table where players sit in a circle. Active players glow when it's their turn with an SVG circular countdown timer!
- **Cinematic Guess Popups:** Massive, full-screen flashes when players make guesses, telling you to "GO HIGHER" or "GO LOWER".
- **Live Action Dashboard:** A sidebar featuring a real-time **Live Feed** of all guesses and a **Standings** leaderboard showcasing the High Rollers.
- **Live Chat Panel:** Send messages, spam emojis, and get system notifications directly in the glowing glass chat panel.
- **Host Controls:** Create private, password-protected rooms, kick players, and completely customize game settings (min/max number, turn timer, hint duration, etc).

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- TypeScript
- Tailwind CSS (Premium glassmorphism & custom utility classes)
- Framer Motion (Fluid animations)
- Lucide React (Icons)

**Backend:**
- Node.js
- Express
- Socket.IO (WebSockets)
- TypeScript

## 🚀 How to Start and Run the Project

This project requires two terminals to run simultaneously: one for the backend server and one for the frontend client.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Start the Server (Backend)
Open your first terminal and run the following commands:
```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Start the server (runs on http://localhost:3001)
npm start
```

### 2. Start the Client (Frontend)
Open your second terminal and run the following commands:
```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Start the React development server
npm run dev
```

### 3. Play!
Once both servers are running, open your browser and navigate to the URL provided by the Vite frontend (usually `http://localhost:5173`). 
You can open the app in multiple browser tabs or windows to simulate multiple players joining the same room!
# Number-Game
