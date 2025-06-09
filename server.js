const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Game state management
const games = new Map();
const waitingPlayers = [];

class Game {
    constructor() {
        this.board = Array(9).fill(null);
        this.players = [];
        this.currentPlayer = 0;
        this.gameOver = false;
        this.winner = null;
        this.id = Math.random().toString(36).substr(2, 9);
    }

    addPlayer(socket) {
        if (this.players.length < 2) {
            this.players.push({
                socket: socket,
                symbol: this.players.length === 0 ? 'X' : 'O',
                id: socket.id
            });
            return true;
        }
        return false;
    }

    makeMove(playerIndex, position) {
        if (this.gameOver || this.board[position] !== null || this.currentPlayer !== playerIndex) {
            return false;
        }

        this.board[position] = this.players[playerIndex].symbol;
        
        if (this.checkWin()) {
            this.gameOver = true;
            this.winner = playerIndex;
        } else if (this.board.every(cell => cell !== null)) {
            this.gameOver = true;
            this.winner = null; // Draw
        } else {
            this.currentPlayer = 1 - this.currentPlayer;
        }

        return true;
    }

    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c];
        });
    }

    getGameState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            winner: this.winner,
            players: this.players.map(p => ({ symbol: p.symbol, id: p.id }))
        };
    }

    reset() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 0;
        this.gameOver = false;
        this.winner = null;
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('findGame', () => {
        let game = null;

        // Try to join an existing waiting game
        if (waitingPlayers.length > 0) {
            const waitingGame = waitingPlayers.shift();
            game = games.get(waitingGame.gameId);
            if (game && game.addPlayer(socket)) {
                socket.join(waitingGame.gameId);
                socket.gameId = waitingGame.gameId;
                
                // Start the game
                io.to(waitingGame.gameId).emit('gameStart', game.getGameState());
                console.log(`Game started: ${waitingGame.gameId}`);
            }
        } else {
            // Create a new game
            game = new Game();
            game.addPlayer(socket);
            games.set(game.id, game);
            socket.join(game.id);
            socket.gameId = game.id;
            
            waitingPlayers.push({ gameId: game.id });
            socket.emit('waitingForPlayer');
            console.log(`New game created: ${game.id}`);
        }
    });

    socket.on('makeMove', (position) => {
        const gameId = socket.gameId;
        const game = games.get(gameId);
        
        if (!game) return;

        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex === -1) return;

        if (game.makeMove(playerIndex, position)) {
            io.to(gameId).emit('gameUpdate', game.getGameState());
            
            if (game.gameOver) {
                console.log(`Game ended: ${gameId}`);
            }
        }
    });

    socket.on('resetGame', () => {
        const gameId = socket.gameId;
        const game = games.get(gameId);
        
        if (game) {
            game.reset();
            io.to(gameId).emit('gameUpdate', game.getGameState());
        }
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        const gameId = socket.gameId;
        if (gameId) {
            const game = games.get(gameId);
            if (game) {
                // Notify the other player
                socket.to(gameId).emit('playerDisconnected');
                
                // Clean up the game
                games.delete(gameId);
                
                // Remove from waiting players if applicable
                const waitingIndex = waitingPlayers.findIndex(w => w.gameId === gameId);
                if (waitingIndex !== -1) {
                    waitingPlayers.splice(waitingIndex, 1);
                }
            }
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
server.listen(PORT, () => {
    console.log(`Tic Tac Toe server running on port ${PORT}`);
});