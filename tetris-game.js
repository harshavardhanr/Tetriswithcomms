// Tetris Game Logic
export class TetrisGame {
    constructor() {
        this.boardWidth = 10;
        this.boardHeight = 20;
        this.board = Array(this.boardHeight).fill(null).map(() => Array(this.boardWidth).fill(0));
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.dropInterval = 1000;
        this.lastDropTime = 0;
        
        this.pieces = [
            // I piece
            [[1,1,1,1]],
            // O piece
            [[1,1],[1,1]],
            // T piece
            [[0,1,0],[1,1,1]],
            // S piece
            [[0,1,1],[1,1,0]],
            // Z piece
            [[1,1,0],[0,1,1]],
            // J piece
            [[1,0,0],[1,1,1]],
            // L piece
            [[0,0,1],[1,1,1]]
        ];
        
        this.spawnPiece();
    }
    
    spawnPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.currentPiece = this.pieces[pieceIndex];
        this.currentX = Math.floor(this.boardWidth / 2) - Math.floor(this.currentPiece[0].length / 2);
        this.currentY = 0;
        
        if (this.checkCollision(this.currentPiece, this.currentX, this.currentY)) {
            this.gameOver = true;
        }
    }
    
    rotatePiece() {
        if (!this.currentPiece || this.paused || this.gameOver) return false;
        
        const rotated = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[i]).reverse()
        );
        
        if (!this.checkCollision(rotated, this.currentX, this.currentY)) {
            this.currentPiece = rotated;
            return true;
        }
        return false;
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece || this.paused || this.gameOver) return false;
        
        const newX = this.currentX + dx;
        const newY = this.currentY + dy;
        
        if (!this.checkCollision(this.currentPiece, newX, newY)) {
            this.currentX = newX;
            this.currentY = newY;
            return true;
        }
        return false;
    }
    
    checkCollision(piece, x, y) {
        for (let py = 0; py < piece.length; py++) {
            for (let px = 0; px < piece[py].length; px++) {
                if (piece[py][px]) {
                    const boardX = x + px;
                    const boardY = y + py;
                    
                    if (boardX < 0 || boardX >= this.boardWidth ||
                        boardY >= this.boardHeight ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        for (let py = 0; py < this.currentPiece.length; py++) {
            for (let px = 0; px < this.currentPiece[py].length; px++) {
                if (this.currentPiece[py][px]) {
                    const boardY = this.currentY + py;
                    const boardX = this.currentX + px;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = 1;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        for (let y = this.boardHeight - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell === 1)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.boardWidth).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
        }
    }
    
    drop() {
        if (this.paused || this.gameOver) return;
        
        const now = Date.now();
        if (now - this.lastDropTime >= this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.lastDropTime = now;
        }
    }
    
    hardDrop() {
        if (this.paused || this.gameOver) return;
        
        while (this.movePiece(0, 1)) {}
        this.lockPiece();
    }
    
    togglePause() {
        if (!this.gameOver) {
            this.paused = !this.paused;
        }
        return this.paused;
    }
    
    getBoardState() {
        const displayBoard = this.board.map(row => [...row]);
        
        if (this.currentPiece && !this.paused && !this.gameOver) {
            for (let py = 0; py < this.currentPiece.length; py++) {
                for (let px = 0; px < this.currentPiece[py].length; px++) {
                    if (this.currentPiece[py][px]) {
                        const boardY = this.currentY + py;
                        const boardX = this.currentX + px;
                        if (boardY >= 0 && boardY < this.boardHeight &&
                            boardX >= 0 && boardX < this.boardWidth) {
                            displayBoard[boardY][boardX] = 2; // Current piece
                        }
                    }
                }
            }
        }
        
        return {
            board: displayBoard,
            score: this.score,
            level: this.level,
            lines: this.lines,
            gameOver: this.gameOver,
            paused: this.paused
        };
    }
}

