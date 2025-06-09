const request = require('supertest');
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const Client = require('socket.io-client');

// Mock server setup for testing
function createTestServer() {
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server);
    
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK' });
    });
    
    return { app, server, io };
}

describe('Tic Tac Toe Server', () => {
    let server, app, port;
    
    beforeAll((done) => {
        const testServer = createTestServer();
        app = testServer.app;
        server = testServer.server;
        
        server.listen(() => {
            port = server.address().port;
            done();
        });
    });
    
    afterAll((done) => {
        server.close(done);
    });

    describe('HTTP Endpoints', () => {
        test('Health check endpoint should return OK', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
        });
    });

    describe('Game Logic', () => {
        // Test the Game class logic
        const Game = require('../game-logic'); // We'll need to extract this
        
        test('Should create empty board', () => {
            const game = new Game();
            expect(game.board).toEqual(Array(9).fill(null));
            expect(game.currentPlayer).toBe(0);
            expect(game.gameOver).toBe(false);
        });
        
        test('Should detect horizontal win', () => {
            const game = new Game();
            game.board = ['X', 'X', 'X', null, null, null, null, null, null];
            expect(game.checkWin()).toBe(true);
        });
        
        test('Should detect vertical win', () => {
            const game = new Game();
            game.board = ['X', null, null, 'X', null, null, 'X', null, null];
            expect(game.checkWin()).toBe(true);
        });
        
        test('Should detect diagonal win', () => {
            const game = new Game();
            game.board = ['X', null, null, null, 'X', null, null, null, 'X'];
            expect(game.checkWin()).toBe(true);
        });
        
        test('Should detect draw', () => {
            const game = new Game();
            game.board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
            expect(game.checkWin()).toBe(false);
            expect(game.board.every(cell => cell !== null)).toBe(true);
        });
    });

    describe('Socket.IO Integration', () => {
        let clientSocket1, clientSocket2;
        
        beforeEach((done) => {
            // Create client sockets for testing
            clientSocket1 = new Client(`http://localhost:${port}`);
            clientSocket2 = new Client(`http://localhost:${port}`);
            
            let connected = 0;
            const checkConnection = () => {
                connected++;
                if (connected === 2) done();
            };
            
            clientSocket1.on('connect', checkConnection);
            clientSocket2.on('connect', checkConnection);
        });
        
        afterEach(() => {
            if (clientSocket1.connected) clientSocket1.close();
            if (clientSocket2.connected) clientSocket2.close();
        });
        
        test('Should handle game creation and joining', (done) => {
            clientSocket1.emit('findGame');
            clientSocket1.on('waitingForPlayer', () => {
                clientSocket2.emit('findGame');
            });
            
            let gameStartCount = 0;
            const handleGameStart = (gameState) => {
                gameStartCount++;
                expect(gameState.board).toEqual(Array(9).fill(null));
                expect(gameState.players).toHaveLength(2);
                
                if (gameStartCount === 2) {
                    done();
                }
            };
            
            clientSocket1.on('gameStart', handleGameStart);
            clientSocket2.on('gameStart', handleGameStart);
        });
    });
});

// Performance tests
describe('Performance Tests', () => {
    test('Should handle multiple concurrent games', (done) => {
        const numGames = 10;
        let completedGames = 0;
        
        for (let i = 0; i < numGames; i++) {
            const client1 = new Client(`http://localhost:${port}`);
            const client2 = new Client(`http://localhost:${port}`);
            
            client1.on('connect', () => client1.emit('findGame'));
            client2.on('connect', () => client2.emit('findGame'));
            
            client1.on('gameStart', () => {
                completedGames++;
                client1.close();
                client2.close();
                
                if (completedGames === numGames) {
                    done();
                }
            });
        }
    }, 10000);
});