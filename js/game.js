class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = 400;
        this.canvas.height = 600;
        this.spriteLoaded = false;

        this.spriteSheet = new Image();
        this.spriteSheet.onload = () => {
            this.spriteLoaded = true;
            console.log('Sprite sheet loaded!');
        };
        this.spriteSheet.onerror = () => {
            console.error('Failed to load sprite sheet');
        };
        this.spriteSheet.src = 'assets/images/flappybirdassets.png';

        this.backgroundSprite = {
            x: 0,
            y: 0,
            width: 144,
            height: 256
        };

        this.bgX = 0;
        this.bgSpeed = 0.5;

        this.bird = new Bird(this.canvas);
        this.pipeManager = new PipeManager(this.canvas);

        this.gameState = 'start';
        this.showSettings = false;
        this.firstInputReceived = false;
        this.score = 0;
        this.highScore = getHighScore();

        this.groundY = this.canvas.height - 80;
        this.groundX = 0;

        this.bindEvents();

        this.lastTime = 0;
        this.gameLoop(0);
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });

        this.canvas.addEventListener('click', () => this.handleInput());

        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restart();
            });
        }
        
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.toggleSettings();
            });
        }
    }

    handleInput() {
        if (this.showSettings) {
            this.showSettings = false;
            return;
        }
        
        if (this.gameState === 'start') {
            this.startGame();
        } else if (this.gameState === 'playing') {
            this.firstInputReceived = true;
            this.bird.flap();
        }
    }
    
    toggleSettings() {
        this.showSettings = !this.showSettings;
    }

    startGame() {
        this.gameState = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
    }

    restart() {
        this.score = 0;
        this.firstInputReceived = false;
        this.bird.reset();
        this.pipeManager.reset();
        this.gameState = 'playing';
        document.getElementById('gameOverScreen').classList.add('hidden');
    }

    gameOver() {
        this.gameState = 'gameOver';

        if (this.score > this.highScore) {
            this.highScore = this.score;
            saveHighScore(this.score);
        }

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    update(currentTime) {
        if (this.gameState === 'playing') {
            this.bgX -= this.bgSpeed;
            if (this.bgX <= -this.backgroundSprite.width) {
                this.bgX = 0;
            }
        }

        
        if (this.gameState === 'start') {
        
            this.bird.updateAutoFly(currentTime);
        } else if (this.gameState === 'playing') {
        
            if (!this.firstInputReceived) {
                this.bird.updateAutoFly(currentTime);
            } else {
                this.bird.update(currentTime);
            }
            
            if (this.firstInputReceived) {
                this.pipeManager.update(currentTime);
            }

            if (this.firstInputReceived) {
                if (this.pipeManager.checkCollision(this.bird)) {
                    this.gameOver();
                    return;
                }

                if (this.bird.isOutOfBounds(this.groundY)) {
                    this.gameOver();
                    return;
                }

                if (this.pipeManager.checkScore(this.bird)) {
                    this.score++;
                }
            }

            this.groundX -= 3;
            if (this.groundX <= -20) {
                this.groundX = 0;
            }
        }
    }

    drawBackground() {
        const ctx = this.ctx;

        if (this.spriteLoaded && this.spriteSheet) {
            const bgWidth = this.backgroundSprite.width;
            const bgHeight = this.backgroundSprite.height;

            const scale = (this.canvas.height - 80) / bgHeight;
            const scaledWidth = bgWidth * scale;
            const scaledHeight = bgHeight * scale;

            const tilesNeeded = Math.ceil(this.canvas.width / scaledWidth) + 2;

            for (let i = 0; i < tilesNeeded; i++) {
                const xPos = (this.bgX * scale) + (i * scaledWidth);

                ctx.drawImage(
                    this.spriteSheet,
                    this.backgroundSprite.x,
                    this.backgroundSprite.y,
                    this.backgroundSprite.width,
                    this.backgroundSprite.height,
                    xPos,
                    0,
                    scaledWidth,
                    scaledHeight
                );
            }
        } else {
            const skyGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            skyGradient.addColorStop(0, '#87CEEB');
            skyGradient.addColorStop(0.5, '#98D8E8');
            skyGradient.addColorStop(1, '#B0E0E6');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawGround() {
        const ctx = this.ctx;

        if (this.spriteLoaded && this.spriteSheet) {
            
            const groundSprite = {
                x: 146,
                y: 0,
                width: 154,
                height: 56
            };

            const groundHeight = 80;
            const spriteWidth = groundSprite.width;
            const tilesNeeded = Math.ceil(this.canvas.width / spriteWidth) + 1;

            for (let i = 0; i < tilesNeeded; i++) {
                const xPos = this.groundX + (i * spriteWidth);
                
                ctx.drawImage(
                    this.spriteSheet,
                    groundSprite.x,
                    groundSprite.y,
                    groundSprite.width,
                    groundSprite.height,
                    xPos,
                    this.groundY,
                    spriteWidth,
                    groundHeight
                );
            }
        } else {
    
            ctx.fillStyle = '#DEB887';
            ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

            ctx.fillStyle = '#8B4513';
            ctx.fillRect(0, this.groundY, this.canvas.width, 15);

            ctx.fillStyle = '#D2691E';
            for (let i = this.groundX; i < this.canvas.width + 20; i += 20) {
                ctx.fillRect(i, this.groundY + 15, 10, this.canvas.height - this.groundY - 15);
            }
        }
    }

    drawGameOverScoreboard() {
        const ctx = this.ctx;
        
        if (this.spriteLoaded && this.spriteSheet) {
            const scoreboardSprite = {
                x: 146,
                y: 58,
                width: 113,
                height: 58
            };
            
            const scoreboardX = (this.canvas.width - scoreboardSprite.width) / 2;
            const scoreboardY = this.canvas.height / 2 - 20;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 3;
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 80);
            ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 80);
            
            ctx.drawImage(
                this.spriteSheet,
                scoreboardSprite.x,
                scoreboardSprite.y,
                scoreboardSprite.width,
                scoreboardSprite.height,
                scoreboardX,
                scoreboardY,
                scoreboardSprite.width,
                scoreboardSprite.height
            );
            
            ctx.fillStyle = '#FFF';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.strokeText('Score:', scoreboardX + 10, scoreboardY + 22);
            ctx.fillText('Score:', scoreboardX + 10, scoreboardY + 22);
            
            ctx.textAlign = 'right';
            ctx.strokeText(this.score, scoreboardX + 100, scoreboardY + 22);
            ctx.fillText(this.score, scoreboardX + 100, scoreboardY + 22);
            
            ctx.textAlign = 'left';
            ctx.strokeText('Best:', scoreboardX + 10, scoreboardY + 42);
            ctx.fillText('Best:', scoreboardX + 10, scoreboardY + 42);
            
            ctx.textAlign = 'right';
            ctx.strokeText(this.highScore, scoreboardX + 100, scoreboardY + 42);
            ctx.fillText(this.highScore, scoreboardX + 100, scoreboardY + 42);
        }
    }

    draw() {
        const ctx = this.ctx;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();
        
        this.pipeManager.draw();

        this.drawGround();

        this.bird.draw();

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(this.score, this.canvas.width / 2, 80);
        ctx.fillText(this.score, this.canvas.width / 2, 80);
        
        if (this.showSettings) {
            drawSettings(ctx, this.canvas);
        }

        if (this.gameState === 'gameOver') {
            this.drawGameOverScoreboard();
        }
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(currentTime);
        this.draw();

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

window.addEventListener('load', () => {
    new Game();
});
