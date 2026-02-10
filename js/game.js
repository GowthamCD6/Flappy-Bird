class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = 400;
        this.canvas.height = 600;

        this.spritesSheet = new Image();
        this.spriteSheet.src = 'assets/images/flppybirdassets.png';
        this.spriteLoaded = false;

        this.spritesSheet.onload = () => {
            this.spriteLoaded = true;
        };

        this.backgroundSprite = {
            x: 0,
            y: 0,
            width: 144,
            height: 256
        };

        this.bgx = 0;
        this.bgSpeed = 0.5;

        this.bird = new Bird(this.canvas);
        this.pipeManager = new PipeManager(this.canvas);

        this.gamestate = 'start';
        this.score = 0;
        this.highScore = getHighScore();

        this.groundY = this.canvas.height - 80;
        this.groundX = 0;

        this.bindEvents();

        this.lastTime = 0;
        this.gameLoop(0);
    }

    bindEvents() {
        document.addEventListener('Keydown', (e) => {
            if (e.code === 'space') {
                e.preventDefault();
                this.handleInput();
            }
        });

        this.canvas.addEventListener('click', () => this.handleInput());

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
    }

    handleInput() {
        if(this.gamestate === 'start') {
            this.startGame();
        } else if (this.gamestate === 'playing') {
            this.bird.flap();
        }
    }

    startGame() {
        this.gameState = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
    }

    restart() {
        this.score = 0;
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
        if (this.gameState === 'plying') {
            this.bgx -= this.bgSpeed;
            if (this.bgx <= -this.backgroundSprite.width) {
                this.bgx = 0;
            }
        }

        if (this.gameState !== 'playing') {
            this.bird.update(currentTime);
            return;
        }

        this.bird.update(currentTime);

        this.pipeManager.update(currentTime);

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

        this.groundX -= 3;
        if (this.groundX <= -20) {
            this.groundX = 0;
        }
    }

    drawBackGround() {
        const ctx = this.ctx;

        if (this.spriteLoaded) {
            const bgWidth = this.backgroundSprite.width;
            const bgHeight = this.backgroundSprite.height;

            const scale = (this.canvas.height - 80) / bgHeight;
            const scaleWidth = bgWidth * scale;
            const scaleHeight = bgHeight * scale;

            const tilesNeeded = Math.ceil(this.canvas.width / scaleWidth) + 2;

            for (let i = 0; i < tilesNeeded; i++) {
                const xPos = (this.bgx * scale) + (i * scaleWidth);

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
            const skyGradient = ctx.createLinerGradient(0, 0, 0, )
        }
    }
}