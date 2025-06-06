class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;
        
        // Game state
        this.gameState = 'start'; // start, playing, gameOver
        this.score = 0;
        this.highScore = localStorage.getItem('flappyHighScore') || 0;
        
        // Bird properties
        this.bird = {
            x: 80,
            y: 250,
            width: 30,
            height: 30,
            velocity: 0,
            gravity: 0.5,
            jump: -5,
            rotation: 0
        };
        
        // Pipe properties
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 150;
        this.pipeSpeed = 3;
        this.pipeSpawnRate = 90;
        this.frameCount = 0;
        
        // Colors and styling
        this.colors = {
            bird: '#FFD700',
            pipe: '#228B22',
            pipeOutline: '#006400',
            ground: '#8B4513',
            sky: '#87CEEB'
        };
        
        this.init();
    }
    
    init() {
        this.updateHighScoreDisplay();
        this.bindEvents();
        this.gameLoop();
    }
    
    bindEvents() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });
        
        // Mouse/touch events
        this.canvas.addEventListener('click', () => this.handleInput());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        });
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    handleInput() {
        if (this.gameState === 'start') {
            this.startGame();
        } else if (this.gameState === 'playing') {
            this.bird.velocity = this.bird.jump;
        } else if (this.gameState === 'gameOver') {
            this.restart();
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.hideScreen('startScreen');
        this.showScreen('gameUI');
        this.bird.velocity = this.bird.jump;
    }
    
    restart() {
        this.gameState = 'playing';
        this.score = 0;
        this.bird.y = 250;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.pipes = [];
        this.frameCount = 0;
        
        this.hideScreen('gameOverScreen');
        this.showScreen('gameUI');
        this.updateScore();
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.frameCount++;
        
        // Update bird physics
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Bird rotation based on velocity
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);
        
        // Spawn pipes
        if (this.frameCount % this.pipeSpawnRate === 0) {
            this.spawnPipe();
        }
        
        // Update pipes
        this.updatePipes();
        
        // Check collisions
        this.checkCollisions();
        
        // Check bounds
        if (this.bird.y + this.bird.height > this.canvas.height - 50 || this.bird.y < 0) {
            this.gameOver();
        }
    }
    
    spawnPipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - 100;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            bottomHeight: this.canvas.height - (topHeight + this.pipeGap) - 50,
            passed: false
        });
    }
    
    updatePipes() {
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;
            
            // Check if bird passed pipe
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.updateScore();
            }
            
            // Remove off-screen pipes
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        for (const pipe of this.pipes) {
            // Check collision with top pipe
            if (this.isColliding(this.bird, {
                x: pipe.x,
                y: 0,
                width: this.pipeWidth,
                height: pipe.topHeight
            })) {
                this.gameOver();
                return;
            }
            
            // Check collision with bottom pipe
            if (this.isColliding(this.bird, {
                x: pipe.x,
                y: pipe.bottomY,
                width: this.pipeWidth,
                height: pipe.bottomHeight
            })) {
                this.gameOver();
                return;
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyHighScore', this.highScore);
        }
        
        // Show game over screen
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.highScore;
        this.hideScreen('gameUI');
        this.showScreen('gameOverScreen');
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw pipes
        this.drawPipes();
        
        // Draw bird
        this.drawBird();
        
        // Draw ground
        this.ctx.fillStyle = this.colors.ground;
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
    }
    
    drawBird() {
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width/2, this.bird.y + this.bird.height/2);
        this.ctx.rotate(this.bird.rotation * Math.PI / 180);
        
        // Bird body
        this.ctx.fillStyle = this.colors.bird;
        this.ctx.fillRect(-this.bird.width/2, -this.bird.height/2, this.bird.width, this.bird.height);
        
        // Bird outline
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-this.bird.width/2, -this.bird.height/2, this.bird.width, this.bird.height);
        
        // Bird eye
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(-5, -8, 8, 8);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(-3, -6, 4, 4);
        
        this.ctx.restore();
    }
    
    drawPipes() {
        for (const pipe of this.pipes) {
            // Top pipe
            this.ctx.fillStyle = this.colors.pipe;
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            this.ctx.strokeStyle = this.colors.pipeOutline;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Bottom pipe
            this.ctx.fillStyle = this.colors.pipe;
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, pipe.bottomHeight);
            this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, pipe.bottomHeight);
            
            // Pipe caps
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, this.pipeWidth + 10, 30);
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 30);
        }
    }
    
    updateScore() {
        document.getElementById('currentScore').textContent = this.score;
    }
    
    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    showScreen(screenId) {
        document.getElementById(screenId).classList.remove('hidden');
    }
    
    hideScreen(screenId) {
        document.getElementById(screenId).classList.add('hidden');
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new FlappyBird();
});
