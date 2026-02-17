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
        this.isPaused = false;
        this.firstInputReceived = false;
        this.score = 0;
        this.highScore = getHighScore();

        this.gameOverTimeoutId = null;

        this.groundY = this.canvas.height - 80;
        this.groundX = 0;

        this.bindEvents();

        // Initialize coin system
        coinSystem.init('coinDisplay');
        coinSystem.reset();

        // Initialize power-up system
        powerUpSystem.init(this.bird, this.canvas);

        this.lastTime = 0;
        this.gameLoop(0);
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            } else if (e.code === 'KeyP' || e.code === 'Escape') {
                e.preventDefault();
                this.togglePause();
            } else if (e.code === 'KeyQ') {
                e.preventDefault();
                this.activatePower(performance.now());
            }
        });

        this.canvas.addEventListener('click', () => this.handleInput());

        // Delegate PASS/PLAY toggle handling so it works reliably
        // even with touch input and regardless of element stacking.
          document.addEventListener(
            'pointerdown',
            (e) => {
                const target = e.target;
                const toggleBtn = target instanceof Element ? target.closest('#toggleBtn') : null;
                if (!toggleBtn) return;

                e.preventDefault();
                e.stopPropagation();
                this.togglePause();
            },
            { capture: true }
        );

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
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click' , (e) => {
                e.stopPropagation();
                this.handleInput();
            });
        }
        
        const shopBtn = document.getElementById('shopBtn');
        if (shopBtn) {
            shopBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openShop();
            });
        }
        
        const closeShopBtn = document.getElementById('closeShopBtn');
        if (closeShopBtn) {
            closeShopBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeShop();
            });
        }

        const powerBtn = document.getElementById('powerBtn');
        if (powerBtn) {
            powerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.activatePower(performance.now());
            });
        }
    }

    handleInput() {
        if (this.showSettings) {
            this.showSettings = false;
            return;
        }

        if (this.gameState === 'gameOver') {
            return;
        }

        if (this.isPaused) {
            return;
        }
        
        if (this.gameState === 'start') {
            this.startGame();
        } else if (this.gameState === 'ready') {
            this.beginPlay();
        } else if (this.gameState === 'playing') {
            this.firstInputReceived = true;
            this.bird.flap();
        }
    }
    
    toggleSettings() {
        this.showSettings = !this.showSettings;
    }

    openShop() {
        const shopScreen = document.getElementById('shopScreen');
        if (shopScreen) {
            shopScreen.classList.remove('hidden');
        }
    }

    closeShop() {
        const shopScreen = document.getElementById('shopScreen')
        if (shopScreen) {
            shopScreen.classList.add('hidden');
        }
    }

    activatePower(currentTime) {
        if (this.gameState !== 'playing') return;
        if (powerUpSystem.isActive) return;

        const activated = powerUpSystem.activate(currentTime);
        if (activated) {
            // Grey out the power button
            const powerBtn = document.getElementById('powerBtn');
            if (powerBtn) powerBtn.classList.add('power-used');
        }
    }

    startGame() {
        this.clearGameOverTimeout();
        this.gameState = 'ready';
        this.firstInputReceived = false;

        const startScreen = document.getElementById('startScreen');
        if (startScreen) startScreen.classList.add('hidden');

        const getReadyScreen = document.getElementById('getReadyScreen');
        if (getReadyScreen) getReadyScreen.classList.remove('hidden');
    }

    beginPlay() {
        this.clearGameOverTimeout();
        this.gameState = 'playing';
        this.firstInputReceived = true;
        this.isPaused = false;

        const getReadyScreen = document.getElementById('getReadyScreen');
        if (getReadyScreen) getReadyScreen.classList.add('hidden');

        const gameControls = document.getElementById('gameControls');
        if (gameControls) gameControls.classList.remove('hidden');

        // Show power button during gameplay
        const powerBtnContainer = document.getElementById('powerBtnContainer');
        if (powerBtnContainer) powerBtnContainer.classList.remove('hidden');

        // Reset power button appearance
        const powerBtn = document.getElementById('powerBtn');
        if (powerBtn) powerBtn.classList.remove('power-used');

        this.syncToggleButton();

        this.bird.flap();
    }

    restart() {
        // Keep as a utility, but the UI flow returns to home.
        this.returnToHome();
    }

        pauseGame() {
        if (this.gameState === 'playing' && !this.isPaused) {
            this.isPaused = true;
            console.log('Game paused');
        }
    }

    resumeGame() {
        if (this.gameState === 'playing' && this.isPaused) {
            this.isPaused = false;
            this.syncToggleButton();
        }
    }

    syncToggleButton() {
        const toggleBtn = document.getElementById('toggleBtn');
        if (!toggleBtn) return;

        // If paused: show PLAY sprite (to resume). If playing: show PASS sprite (to pause).
        toggleBtn.classList.toggle('play-button-sprite', this.isPaused);
        toggleBtn.classList.toggle('pass-sprite', !this.isPaused);
        toggleBtn.title = this.isPaused ? 'Resume Game' : 'Pause Game';
    }

    togglePause() {
        if (this.gameState !== 'playing') return;

        this.isPaused = !this.isPaused;
        this.syncToggleButton();
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.isPaused = false;

        this.syncToggleButton();

        const gameControls = document.getElementById('gameControls');
        if (gameControls) gameControls.classList.add('hidden');

        // Hide power button and reset power-up
        const powerBtnContainer = document.getElementById('powerBtnContainer');
        if (powerBtnContainer) powerBtnContainer.classList.add('hidden');
        powerUpSystem.deactivate();
        // Restore pipe speed
        this.pipeManager.updateSpeed(2);

        if (this.score > this.highScore) {
            this.highScore = this.score;
            saveHighScore(this.score);
        }

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.highScore;
        
        // Show coin/medal based on final score
        coinSystem.updateCoin(this.score);
        coinSystem.show();
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    clearGameOverTimeout() {
        if (this.gameOverTimeoutId != null) {
            clearTimeout(this.gameOverTimeoutId);
            this.gameOverTimeoutId = null;
        }
    }

    returnToHome() {
        this.clearGameOverTimeout();

        this.score = 0;
        this.firstInputReceived = false;
        this.isPaused = false;
        this.bird.reset();
        this.pipeManager.reset();
        this.bgX = 0;
        this.groundX = 0;

        // Reset coin system
        coinSystem.reset();

        // Reset power-up system
        powerUpSystem.reset();
        this.pipeManager.updateSpeed(2);

        // Hide power button
        const powerBtnContainer = document.getElementById('powerBtnContainer');
        if (powerBtnContainer) powerBtnContainer.classList.add('hidden');
        const powerBtn = document.getElementById('powerBtn');
        if (powerBtn) powerBtn.classList.remove('power-used');

        this.gameState = 'start';

        const gameControls = document.getElementById('gameControls');
        if (gameControls) gameControls.classList.add('hidden');

        this.syncToggleButton();

        const startScreen = document.getElementById('startScreen');
        if (startScreen) startScreen.classList.remove('hidden');

        const getReadyScreen = document.getElementById('getReadyScreen');
        if (getReadyScreen) getReadyScreen.classList.add('hidden');

        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
    }

    update(currentTime) {
        if (this.gameState === 'playing' && !this.isPaused) {
            this.bgX -= this.bgSpeed;
            if (this.bgX <= -this.backgroundSprite.width) {
                this.bgX = 0;
            }
        }

        
        if (this.gameState === 'start' || this.gameState === 'ready') {
            this.bird.updateAutoFly(currentTime);
        } else if (this.gameState === 'playing' && !this.isPaused) {
        
            if (!this.firstInputReceived) {
                this.bird.updateAutoFly(currentTime);
            } else {
                this.bird.update(currentTime);
            }
            
            if (this.firstInputReceived) {
                this.pipeManager.update(currentTime);
            }

            if (this.firstInputReceived) {
                // Update power-up system
                powerUpSystem.update(currentTime);

                // Update pipe speed based on power-up
                this.pipeManager.updateSpeed(powerUpSystem.getPipeSpeed());

                if (powerUpSystem.isInvincible()) {
                    // Bird is invincible - skip collision checks
                } else {
                    if (this.pipeManager.checkCollision(this.bird)) {
                        this.gameOver();
                        return;
                    }

                    if (this.bird.isOutOfBounds(this.groundY)) {
                        this.gameOver();
                        return;
                    }
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

    draw() {
        const ctx = this.ctx;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();
        
        this.pipeManager.draw();

        this.drawGround();

        this.bird.draw();

        // Draw power-up effects
        powerUpSystem.draw();

        if (this.gameState === 'playing') {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText(this.score, this.canvas.width / 2, 80);
            ctx.fillText(this.score, this.canvas.width / 2, 80);
        }

 if (this.isPaused && this.gameState === 'playing') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            
            ctx.font = 'bold 18px Arial';
            ctx.strokeText('Click Play to Resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
            ctx.fillText('Click Play to Resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
        
        if (this.showSettings) {
            drawSettings(ctx, this.canvas);
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

function getHighScore() {
    const score = localStorage.getItem('flappyBirdHighScore');
    return score ? parseInt(score) : 0;
}

function saveHighScore(score) {
    localStorage.setItem('flappyBirdHighScore', score.toString());
}

function drawSettings(ctx, canvas) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width,canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Aprial';
    ctx.textAlign = 'center';
    ctx.fillText('setting', canvas.width / 2, canvas.height / 2);
}

window.addEventListener('load', () => {
    new Game();
});