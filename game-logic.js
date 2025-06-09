class Game {
  constructor() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 0; // Player 0 starts
    this.gameOver = false;
  }

  makeMove(index, player) {
    if (this.board[index] !== null || this.gameOver) return false;

    this.board[index] = player;
    
    if (this.checkWin()) {
      this.gameOver = true;
      return true;
    }

    // Check for draw
    if (!this.board.includes(null)) {
      this.gameOver = true;
    }

    // Switch player
    this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
    return true;
  }

  checkWin() {
    const winningCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];

    return winningCombos.some(combo => {
      const [a, b, c] = combo;
      return this.board[a] !== null &&
             this.board[a] === this.board[b] &&
             this.board[a] === this.board[c];
    });
  }
}

module.exports = Game;