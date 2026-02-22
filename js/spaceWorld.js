class SpaceWorldSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.bird = null;
        this.isActive = false;
        
        // Coin collection
        this.coins = [];
        this.collectedCoins = 0;
        this.totalCoins = 0; // Persistent coin count for shop
        
        // Coin spawn settings
        this.coinSpawnTimer = 0;
        this.coinSpawnInterval = 800; // Spawn coins every 800ms
        this.coinSpeed = 3; // How fast coins move left
        
        // Coin patterns like Subway Surfers
        this.patterns = ['line', 'arc', 'zigzag', 'diamond', 'wave'];
        this.currentPattern = null;
        this.patternCoins = [];
        this.patternIndex = 0;
        
        // Floating bird control settings
        this.floatVelocity = 0;
        this.floatSpeed = 0.15; // Smooth acceleration
        this.maxFloatSpeed = 4;
        this.floatFriction = 0.92; // Gradual slowdown
        this.isFloating = false;
        
        // Input tracking for smooth controls
        this.moveUp = false;
        this.moveDown = false;
        
        // Coin sprite
        this.coinLoaded = false;
        this.coinSprite = new Image();
        this.coinSprite.onload = () => {
            this.coinLoaded = true;
            console.log('Space coin sprite loaded!');
        };
        this.coinSprite.onerror = () => {
            console.log('Space coin sprite not found, using fallback');
        };
        this.coinSprite.src = 'assets/images/coin.png';
        
        // Coin properties
        this.coinSize = 30;
        this.coinRotation = 0;
        
        // Sparkle effects for collected coins
        this.sparkles = [];
        
        // Coin magnet power (future feature)
        this.magnetActive = false;
        this.magnetRange = 100;
        
        // Callback to add coins to main game
        this.onCoinCollected = null;
    }
    
    init(bird, canvas, onCoinCollected) {
        this.bird = bird;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onCoinCollected = onCoinCollected || null;
        this.setupControls();
    }
    
    setupControls() {
        // Keyboard controls for floating
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
                this.moveUp = true;
                e.preventDefault();
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.moveDown = true;
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
                this.moveUp = false;
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.moveDown = false;
            }
        });
        
        // Touch controls for mobile
        this.canvas?.addEventListener('touchstart', (e) => {
            if (!this.isActive) return;
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchY = touch.clientY - rect.top;
            
            // Top half = move up, bottom half = move down
            if (touchY < this.canvas.height / 2) {
                this.moveUp = true;
            } else {
                this.moveDown = true;
            }
        });
        
        this.canvas?.addEventListener('touchend', () => {
            this.moveUp = false;
            this.moveDown = false;
        });
        
        this.canvas?.addEventListener('touchmove', (e) => {
            if (!this.isActive) return;
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchY = touch.clientY - rect.top;
            
            this.moveUp = touchY < this.canvas.height / 2;
            this.moveDown = touchY >= this.canvas.height / 2;
        });
    }
    
    activate() {
        this.isActive = true;
        this.coins = [];
        this.collectedCoins = 0;
        this.coinSpawnTimer = Date.now();
        this.floatVelocity = 0;
        this.sparkles = [];
        this.patternIndex = 0;
        this.currentPattern = null;
        
        // Spawn initial coins
        this.spawnCoinPattern();
        
        console.log('Space World activated! Collect coins!');
    }
    
    deactivate() {
        this.isActive = false;
        this.moveUp = false;
        this.moveDown = false;
        this.floatVelocity = 0;
        
        console.log(`Space World ended! Collected ${this.collectedCoins} coins.`);
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        const now = Date.now();
        
        // Update floating bird movement
        this.updateFloatingMovement();
        
        // Spawn coins periodically
        if (now - this.coinSpawnTimer > this.coinSpawnInterval) {
            this.spawnCoinPattern();
            this.coinSpawnTimer = now;
        }
        
        // Update coins
        this.updateCoins();
        
        // Check coin collection
        this.checkCoinCollection();
        
        // Update sparkle effects
        this.updateSparkles();
        
        // Rotate coins for animation
        this.coinRotation += 0.1;
    }
    
    updateFloatingMovement() {
        if (!this.bird || !this.isActive) return;
        
        // Apply floating controls (plane-like movement)
        if (this.moveUp) {
            this.floatVelocity -= this.floatSpeed;
        }
        if (this.moveDown) {
            this.floatVelocity += this.floatSpeed;
        }
        
        // Apply friction for smooth deceleration
        this.floatVelocity *= this.floatFriction;
        
        // Clamp velocity
        this.floatVelocity = Math.max(-this.maxFloatSpeed, Math.min(this.maxFloatSpeed, this.floatVelocity));
        
        // Apply velocity to bird
        this.bird.y += this.floatVelocity;
        
        // Keep bird within bounds
        const minY = 50;
        const maxY = this.canvas.height - 100;
        
        if (this.bird.y < minY) {
            this.bird.y = minY;
            this.floatVelocity = 0;
        }
        if (this.bird.y > maxY) {
            this.bird.y = maxY;
            this.floatVelocity = 0;
        }
        
        // Slight tilt based on velocity
        this.bird.rotation = this.floatVelocity * 0.05;
    }
    
    spawnCoinPattern() {
        // Choose a random pattern
        const pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
        const startX = this.canvas.width + 50;
        const centerY = this.canvas.height / 2;
        
        switch (pattern) {
            case 'line':
                this.spawnLinePattern(startX, centerY);
                break;
            case 'arc':
                this.spawnArcPattern(startX, centerY);
                break;
            case 'zigzag':
                this.spawnZigzagPattern(startX, centerY);
                break;
            case 'diamond':
                this.spawnDiamondPattern(startX, centerY);
                break;
            case 'wave':
                this.spawnWavePattern(startX, centerY);
                break;
        }
    }
    
    spawnLinePattern(startX, centerY) {
        // Horizontal line of coins
        const coinCount = 5 + Math.floor(Math.random() * 4);
        const y = 100 + Math.random() * (this.canvas.height - 250);
        
        for (let i = 0; i < coinCount; i++) {
            this.coins.push({
                x: startX + i * 45,
                y: y,
                collected: false,
                scale: 1,
                alpha: 1
            });
        }
    }
    
    spawnArcPattern(startX, centerY) {
        // Arc/curved pattern of coins
        const coinCount = 7;
        const arcHeight = 80;
        const baseY = 150 + Math.random() * (this.canvas.height - 350);
        
        for (let i = 0; i < coinCount; i++) {
            const progress = i / (coinCount - 1);
            const arcY = Math.sin(progress * Math.PI) * arcHeight;
            
            this.coins.push({
                x: startX + i * 40,
                y: baseY - arcY,
                collected: false,
                scale: 1,
                alpha: 1
            });
        }
    }
    
    spawnZigzagPattern(startX, centerY) {
        // Zigzag pattern
        const coinCount = 8;
        const zigHeight = 60;
        let baseY = 200 + Math.random() * (this.canvas.height - 400);
        
        for (let i = 0; i < coinCount; i++) {
            this.coins.push({
                x: startX + i * 40,
                y: baseY + (i % 2 === 0 ? -zigHeight : zigHeight),
                collected: false,
                scale: 1,
                alpha: 1
            });
        }
    }
    
    spawnDiamondPattern(startX, centerY) {
        // Diamond shape
        const baseY = 150 + Math.random() * (this.canvas.height - 350);
        const positions = [
            { dx: 0, dy: 0 },
            { dx: 40, dy: -40 },
            { dx: 40, dy: 40 },
            { dx: 80, dy: -80 },
            { dx: 80, dy: 0 },
            { dx: 80, dy: 80 },
            { dx: 120, dy: -40 },
            { dx: 120, dy: 40 },
            { dx: 160, dy: 0 }
        ];
        
        positions.forEach(pos => {
            this.coins.push({
                x: startX + pos.dx,
                y: baseY + pos.dy,
                collected: false,
                scale: 1,
                alpha: 1
            });
        });
    }
    
    spawnWavePattern(startX, centerY) {
        // Sine wave pattern
        const coinCount = 10;
        const waveHeight = 100;
        const baseY = this.canvas.height / 2;
        
        for (let i = 0; i < coinCount; i++) {
            const waveY = Math.sin(i * 0.5) * waveHeight;
            
            this.coins.push({
                x: startX + i * 35,
                y: baseY + waveY,
                collected: false,
                scale: 1,
                alpha: 1
            });
        }
    }
    
    updateCoins() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            
            // Move coin left
            coin.x -= this.coinSpeed;
            
            // Apply magnet effect if active
            if (this.magnetActive && !coin.collected) {
                const dx = this.bird.x + this.bird.width / 2 - coin.x;
                const dy = this.bird.y + this.bird.height / 2 - coin.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.magnetRange) {
                    const force = (this.magnetRange - dist) / this.magnetRange;
                    coin.x += dx * force * 0.1;
                    coin.y += dy * force * 0.1;
                }
            }
            
            // Remove coins that are off screen
            if (coin.x < -50 || coin.alpha <= 0) {
                this.coins.splice(i, 1);
            }
        }
    }
    
    checkCoinCollection() {
        if (!this.bird) return;
        
        const birdCenterX = this.bird.x + this.bird.width / 2;
        const birdCenterY = this.bird.y + this.bird.height / 2;
        const collectRadius = 25;
        
        for (const coin of this.coins) {
            if (coin.collected) continue;
            
            const dx = birdCenterX - coin.x;
            const dy = birdCenterY - coin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < collectRadius + this.coinSize / 2) {
                this.collectCoin(coin);
            }
        }
    }
    
    collectCoin(coin) {
        coin.collected = true;
        coin.alpha = 0;
        this.collectedCoins++;
        
        // Add coin to main game's coin balance
        if (this.onCoinCollected) {
            this.onCoinCollected(1);
        }
        
        // Create sparkle effect
        this.createSparkles(coin.x, coin.y);
        
        // Play sound (if available)
        this.playCoinSound();
        
        console.log(`Coin collected! Total: ${this.collectedCoins}`);
    }
    
    createSparkles(x, y) {
        const sparkleCount = 8;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2;
            this.sparkles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: 4 + Math.random() * 4,
                alpha: 1,
                color: Math.random() > 0.5 ? '#FFD700' : '#FFF'
            });
        }
    }
    
    updateSparkles() {
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const s = this.sparkles[i];
            s.x += s.vx;
            s.y += s.vy;
            s.alpha -= 0.05;
            s.size *= 0.95;
            
            if (s.alpha <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
    }
    
    playCoinSound() {
        try {
            const audio = new Audio('assets/sounds/point.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (e) {
            // Ignore audio errors
        }
    }
    
    draw(ctx) {
        if (!this.isActive) return;
        
        // Draw coins
        this.drawCoins(ctx);
        
        // Draw sparkles
        this.drawSparkles(ctx);
        
        // Draw coin counter
        this.drawCoinCounter(ctx);
        
        // Draw control hint (first few seconds)
        // this.drawControlHint(ctx);
    }
    
    drawCoins(ctx) {
        ctx.save();
        
        for (const coin of this.coins) {
            if (coin.collected) continue;
            
            ctx.save();
            ctx.globalAlpha = coin.alpha;
            ctx.translate(coin.x, coin.y);
            
            // Coin rotation (spinning effect)
            const scaleX = Math.cos(this.coinRotation) * coin.scale;
            ctx.scale(scaleX, coin.scale);
            
            if (this.coinLoaded) {
                // Draw coin sprite
                ctx.drawImage(
                    this.coinSprite,
                    -this.coinSize / 2,
                    -this.coinSize / 2,
                    this.coinSize,
                    this.coinSize
                );
            } else {
                // Fallback: draw golden circle
                this.drawFallbackCoin(ctx);
            }
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    drawFallbackCoin(ctx) {
        // Outer gold ring
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.arc(0, 0, this.coinSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner gold
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, this.coinSize / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine
        ctx.fillStyle = '#FFEC8B';
        ctx.beginPath();
        ctx.arc(-5, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Dollar sign
        ctx.fillStyle = '#B8860B';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
    }
    
    drawSparkles(ctx) {
        ctx.save();
        
        for (const s of this.sparkles) {
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = s.color;
            
            // Star shape sparkle
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const x = s.x + Math.cos(angle) * s.size;
                const y = s.y + Math.sin(angle) * s.size;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                // Inner points
                const innerAngle = angle + Math.PI / 4;
                const innerX = s.x + Math.cos(innerAngle) * (s.size * 0.4);
                const innerY = s.y + Math.sin(innerAngle) * (s.size * 0.4);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawCoinCounter(ctx) {
        ctx.save();
        
        // Background box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.roundRect(10, 10, 100, 40, 10);
        ctx.fill();
        
        // Coin icon
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(35, 30, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#B8860B';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 35, 30);
        
        // Coin count
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.collectedCoins}`, 55, 32);
        
        ctx.restore();
    }
    
    drawControlHint(ctx) {
        ctx.save();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('↑↓ or W/S to float • Collect coins!', this.canvas.width / 2, this.canvas.height - 30);
        
        ctx.restore();
    }
    
    // Get if bird should use floating controls
    shouldUseFloatingControls() {
        return this.isActive;
    }
    
    // Apply floating movement to bird (called from game.js)
    applyFloatingMovement(bird) {
        if (!this.isActive) return false;
        
        // Bird floats in space - no gravity
        bird.velocity = this.floatVelocity;
        
        return true; // Return true to indicate we handled movement
    }
    
    // Get collected coins count
    getCollectedCoins() {
        return this.collectedCoins;
    }
    
    // Get total coins (for shop)
    getTotalCoins() {
        return this.totalCoins;
    }
    
    // Spend coins (for shop purchases)
    spendCoins(amount) {
        if (this.totalCoins >= amount) {
            this.totalCoins -= amount;
            this.saveCoins();
            return true;
        }
        return false;
    }
    
    // Add coins (for rewards)
    addCoins(amount) {
        this.totalCoins += amount;
        this.saveCoins();
    }
    
    // Save/Load coins from localStorage
    saveCoins() {
        try {
            localStorage.setItem('flappyBirdCoins', this.totalCoins.toString());
        } catch (e) {
            console.log('Could not save coins');
        }
    }
    
    loadCoins() {
        try {
            const saved = localStorage.getItem('flappyBirdCoins');
            if (saved) {
                this.totalCoins = parseInt(saved) || 0;
            }
        } catch (e) {
            this.totalCoins = 0;
        }
    }
    
    // Reset for new game
    reset() {
        this.coins = [];
        this.collectedCoins = 0;
        this.sparkles = [];
        this.floatVelocity = 0;
        this.moveUp = false;
        this.moveDown = false;
        this.isActive = false;
    }
}

// Create global instance
const spaceWorldSystem = new SpaceWorldSystem();