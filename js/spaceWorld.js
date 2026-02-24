class SpaceWorldSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.bird = null;
        this.isActive = false;
        
        this.coins = [];
        this.collectedCoins = 0;
        this.totalCoins = 0; 
        
        this.coinSpawnTimer = 0;
        this.coinSpawnInterval = 800; 
        this.coinSpeed = 3; 
        
        this.patterns = ['line', 'arc', 'zigzag', 'diamond', 'wave'];
        this.currentPattern = null;
        this.patternCoins = [];
        this.patternIndex = 0;
        
        this.floatVelocity = 0;
        this.floatSpeed = 0.15;
        this.maxFloatSpeed = 4;
        this.floatFriction = 0.92; 
        this.isFloating = false;
        
        this.moveUp = false;
        this.moveDown = false;

        this.activePointerId = null;
        
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
        
        this.coinSize = 30;
        this.coinRotation = 0;
        
        this.sparkles = [];
        
        this.magnetActive = false;
        this.magnetRange = 100;
        
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
        
        this.canvas?.addEventListener('touchstart', (e) => {
            if (!this.isActive) return;
            e.preventDefault();

            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchY = touch.clientY - rect.top;

            this.moveUp = touchY < rect.height / 2;
            this.moveDown = touchY >= rect.height / 2;
        }, { passive: false });
        
        this.canvas?.addEventListener('touchend', (e) => {
            if (!this.isActive) return;
            e.preventDefault();
            this.moveUp = false;
            this.moveDown = false;
        }, { passive: false });

        this.canvas?.addEventListener('touchcancel', (e) => {
            if (!this.isActive) return;
            e.preventDefault();
            this.moveUp = false;
            this.moveDown = false;
        }, { passive: false });
        
        this.canvas?.addEventListener('touchmove', (e) => {
            if (!this.isActive) return;
            e.preventDefault();

            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchY = touch.clientY - rect.top;
        this.moveUp = touchY < rect.height / 2;
        this.moveDown = touchY >= rect.height / 2;
        },{passive: false});
        this.canvas?.addEventListner('pointerdown', (e) => {
            if(!this.isActive) return;
            if(e.pointerType === 'mouse' && typeof e.button === 'number' & e.button !== 0)return;
            e.preventDefault ();
            this.activePointerId = e.pointerId;
            try{
                this.canvas.setPointerCapture(e.pointerId);
            } catch(_) {}

            const rect = this.canvas.getBoundingCLientRect();
            const pointerY = e.clientY - rect.top;
            this.moveUp = pointerY < rect.height / 2;
            this.moveDown = pointerY >= rect.height / 2;
        } , {passive:false});
        this.canvas?.addEventListener('pointermove', (e) => {
            if (!this.isActive) return;
            if(this.activePointerId == null || e.pointerId !== this.activePointerId) return;

            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const pointerY = e.clientY - rect.top;
            this.moveUp = pointerY < rect.height / 2;
            this.moveDown = pointerY >= rect.height / 2;
    },{passive:false});


    const endPointer = (e) => {
        if(!this.isActive) return;
        if(this.activePointerId == null || e.pointerId !== this.activePointerId) return;
        e.preventDefault();
        this.activePointerId = null;
        this.moveUP = false;
        this.moveDown = false;
    };
    this.canvas?.addEventListener('pointerUp' , endPointer,{passive:false});
    this.canvas?.addEventListener('pointercancel',endPointer,{passive:false});
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
        
        this.updateFloatingMovement();
        
        if (now - this.coinSpawnTimer > this.coinSpawnInterval) {
            this.spawnCoinPattern();
            this.coinSpawnTimer = now;
        }
        
        this.updateCoins();
        
        this.checkCoinCollection();
        
        this.updateSparkles();
        
        this.coinRotation += 0.1;
    }
    
    updateFloatingMovement() {
        if (!this.bird || !this.isActive) return;
        
        if (this.moveUp) {
            this.floatVelocity -= this.floatSpeed;
        }
        if (this.moveDown) {
            this.floatVelocity += this.floatSpeed;
        }
        
        this.floatVelocity *= this.floatFriction;
        
        this.floatVelocity = Math.max(-this.maxFloatSpeed, Math.min(this.maxFloatSpeed, this.floatVelocity));
        
        this.bird.y += this.floatVelocity;
        
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
        
        this.bird.rotation = this.floatVelocity * 0.05;
    }
    
    spawnCoinPattern() {
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
            
            coin.x -= this.coinSpeed;
            
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
        
        if (this.onCoinCollected) {
            this.onCoinCollected(1);
        }
        
        this.createSparkles(coin.x, coin.y);
        
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
        }
    }
    
    draw(ctx) {
        if (!this.isActive) return;
        
        this.drawCoins(ctx);
        
        this.drawSparkles(ctx);
        
        this.drawCoinCounter(ctx);
        
    }
    
    drawCoins(ctx) {
        ctx.save();
        
        for (const coin of this.coins) {
            if (coin.collected) continue;
            
            ctx.save();
            ctx.globalAlpha = coin.alpha;
            ctx.translate(coin.x, coin.y);
            
            const scaleX = Math.cos(this.coinRotation) * coin.scale;
            ctx.scale(scaleX, coin.scale);
            
            if (this.coinLoaded) {
                ctx.drawImage(
                    this.coinSprite,
                    -this.coinSize / 2,
                    -this.coinSize / 2,
                    this.coinSize,
                    this.coinSize
                );
            } else {
                this.drawFallbackCoin(ctx);
            }
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    drawFallbackCoin(ctx) {
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.arc(0, 0, this.coinSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, this.coinSize / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFEC8B';
        ctx.beginPath();
        ctx.arc(-5, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        
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
            
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const x = s.x + Math.cos(angle) * s.size;
                const y = s.y + Math.sin(angle) * s.size;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
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
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.roundRect(10, 10, 100, 40, 10);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(35, 30, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#B8860B';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 35, 30);
        
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
    
    shouldUseFloatingControls() {
        return this.isActive;
    }
    
    applyFloatingMovement(bird) {
        if (!this.isActive) return false;
        
        bird.velocity = this.floatVelocity;
        
        return true; 
    }
    
    getCollectedCoins() {
        return this.collectedCoins;
    }
    
    getTotalCoins() {
        return this.totalCoins;
    }
    
    spendCoins(amount) {
        if (this.totalCoins >= amount) {
            this.totalCoins -= amount;
            this.saveCoins();
            return true;
        }
        return false;
    }
    
    addCoins(amount) {
        this.totalCoins += amount;
        this.saveCoins();
    }
    
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

const spaceWorldSystem = new SpaceWorldSystem();