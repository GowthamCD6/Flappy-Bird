class ShieldSystem {
    constructor() {
        this.isActive = false;
        this.hitsProtected = 0;
        this.maxProtection = 3;
        this.isAvailable = true; 
        this.cooldownTime = 2000; 
        this.cooldownStart = 0;

        this.bird = null;
        this.canvas = null;
        this.ctx = null;

        this.shieldParticles = [];
        this.particleTimer = 0;
        this.shieldRotation = 0;
        this.pulseIntensity = 0;
        this.shieldHealth = 3; 
        
        this.lastHitTime = 0;
        this.hitCooldown = 500;
        
        this.breakTimer = 0;
        this.isBreaking = false;
    }

    init(bird, canvas) {
        this.bird = bird;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    activate() {
        if (!this.isAvailable) {
            console.log('Shield is in cooldown!');
            return false;
        }
        
        if (this.isActive) {
            console.log('Shield already active!');
            return false;
        }

        this.isActive = true;
        this.hitsProtected = 0;
        this.shieldHealth = this.maxProtection;
        this.shieldParticles = [];
        this.shieldRotation = 0;
        this.pulseIntensity = 0;
        this.lastHitTime = 0;

        console.log('🛡️ Shield activated instantly! Protects from 3 pipe hits. No time limit.');
        return true;
    }

    onPipeHit() {
        const currentTime = Date.now();
        if (currentTime - this.lastHitTime < this.hitCooldown) {
            console.log('Hit cooldown active - still protected from recent hit');
            return true;
        }

        if (!this.isActive) {
            return false;
        }

        this.lastHitTime = currentTime;
        this.hitsProtected++;
        this.shieldHealth--;
        
        let colorIndicator = '';
        if (this.shieldHealth === 3) colorIndicator = '🔵 BLUE';
        else if (this.shieldHealth === 2) colorIndicator = '🟡 YELLOW';
        else if (this.shieldHealth === 1) colorIndicator = '🔴 RED';
        else colorIndicator = '💥 BREAKING';
        
        console.log(`✅ Shield absorbed hit ${this.hitsProtected}/3! Remaining: ${this.shieldHealth} ${colorIndicator}`);

        if (this.hitsProtected >= this.maxProtection) {
            console.log('❌ Shield absorbed 3rd hit! Shield will break after collision resolves...');
            this.isActive = false;
            this.isBreaking = true;
            this.b
            akTimer = Date.now();
        }

        return true;
    }

    breakShield() {
        this.isActive = false;
        this.isAvailable = false;
        this.cooldownStart = Date.now();
        this.shieldParticles = [];
        this.shieldHealth = 0;
        this.lastHitTime = 0;
        this.isBreaking = false; 
        console.log('💥 Shield broken after 3 hits! Entering brief 2-second cooldown...');
    }

    update(currentTime) {
        if (this.isBreaking) {
            const breakElapsed = currentTime - this.breakTimer;
            if (breakElapsed >= 300) {
                this.breakShield();
            }
        }
        
        if (!this.isAvailable && !this.isActive) {
            const cooldownElapsed = currentTime - this.cooldownStart;
            if (cooldownElapsed >= this.cooldownTime) {
                this.isAvailable = true;
                console.log('Shield ready for reactivation!');
            }
        }

        if (!this.isActive) return;

        this.shieldRotation += 2;
        this.pulseIntensity = Math.sin(currentTime * 0.01) * 0.5 + 0.5;

        const healthRatio = this.shieldHealth / this.maxProtection;
        this.pulseIntensity *= healthRatio;

        this.particleTimer++;
        if (this.particleTimer % 3 === 0) {
            this.spawnShieldParticle();
        }

        this.updateShieldParticles();
    }

    spawnShieldParticle() {
        const birdCenterX = this.bird.x + this.bird.width / 2;
        const birdCenterY = this.bird.y + this.bird.height / 2;
        const angle = Math.random() * Math.PI * 2;
        const radius = 40 + Math.random() * 15;

        let color1, color2;
        
        if (this.shieldHealth === 3) {
            color1 = '#00BFFF';
            color2 = '#87CEEB';
        } else if (this.shieldHealth === 2) {
            color1 = '#FFD700';
            color2 = '#FFA500';
        } else if (this.shieldHealth === 1) {
            color1 = '#FF4500';
            color2 = '#FF6347';
        }

        if (!color1 || !color2) return;

        this.shieldParticles.push({
            x: birdCenterX + Math.cos(angle) * radius,
            y: birdCenterY + Math.sin(angle) * radius,
            angle: angle,
            radius: radius,
            alpha: 0.8,
            life: 60,
            maxLife: 60,
            color: Math.random() > 0.5 ? color1 : color2
        });
    }

    updateShieldParticles() {
        for (let i = this.shieldParticles.length - 1; i >= 0; i--) {
            const p = this.shieldParticles[i];
            p.life--;
            p.alpha = p.life / p.maxLife;
            p.angle += 0.05;

            const birdCenterX = this.bird.x + this.bird.width / 2;
            const birdCenterY = this.bird.y + this.bird.height / 2;
            p.x = birdCenterX + Math.cos(p.angle) * p.radius;
            p.y = birdCenterY + Math.sin(p.angle) * p.radius;

            if (p.life <= 0) {
                this.shieldParticles.splice(i, 1);
            }
        }
    }

    draw() { 
        this.drawShieldButton();

        if ((!this.isActive && !this.isBreaking) || this.shieldHealth === 0) {
            return;
        }

        const ctx = this.ctx;
        const birdCenterX = this.bird.x + this.bird.width / 2;
        const birdCenterY = this.bird.y + this.bird.height / 2;

        for (const p of this.shieldParticles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const baseAlpha = 0.3 + (this.shieldHealth / this.maxProtection) * 0.4;
        
        ctx.save();
        const shieldRadius = 45 + this.pulseIntensity * 5;

        let shieldColor1, shieldColor2;
        if (this.shieldHealth === 3) {
            shieldColor1 = 'rgba(0, 191, 255, ';
            shieldColor2 = 'rgba(135, 206, 235, ';
        } else if (this.shieldHealth === 2) {
            shieldColor1 = 'rgba(255, 215, 0, ';
            shieldColor2 = 'rgba(255, 165, 0, ';
        } else if (this.shieldHealth === 1) {
            shieldColor1 = 'rgba(255, 69, 0, ';
            shieldColor2 = 'rgba(255, 99, 71, ';
        }

        if (!shieldColor1 || !shieldColor2) {
            ctx.restore();
            return;
        }

        const gradient1 = ctx.createRadialGradient(
            birdCenterX, birdCenterY, shieldRadius - 10,
            birdCenterX, birdCenterY, shieldRadius
        );
        gradient1.addColorStop(0, shieldColor1 + '0)');
        gradient1.addColorStop(1, shieldColor1 + (baseAlpha + this.pulseIntensity * 0.3) + ')');
        
        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.arc(birdCenterX, birdCenterY, shieldRadius, 0, Math.PI * 2);
        ctx.fill();

        const gradient2 = ctx.createRadialGradient(
            birdCenterX, birdCenterY, 0,
            birdCenterX, birdCenterY, 35
        );
        gradient2.addColorStop(0, shieldColor2 + '0.2)');
        gradient2.addColorStop(1, shieldColor2 + '0)');
        
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.arc(birdCenterX, birdCenterY, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = shieldColor1 + (0.5 + this.pulseIntensity * 0.3) + ')';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = this.shieldRotation;
        ctx.beginPath();
        ctx.arc(birdCenterX, birdCenterY, shieldRadius - 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();

        this.drawShieldHealth();
    }

    drawShieldButton() {
        const ctx = this.ctx;
        
        if (!this.isAvailable && !this.isActive) {
            const cooldownElapsed = Date.now() - this.cooldownStart;
            const cooldownProgress = Math.min(cooldownElapsed / this.cooldownTime, 1);
            
            const barWidth = 80;
            const barHeight = 6;
            const barX = this.canvas.width - barWidth - 10;
            const barY = 50;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = 'rgba(0, 191, 255, 0.7)';
            ctx.fillRect(barX, barY, barWidth * cooldownProgress, barHeight);

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            ctx.font = '10px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'right';
            ctx.fillText('Shield Cooldown', this.canvas.width - 10, barY - 5);
        }
    }

    drawShieldHealth() {
        if ((!this.isActive && !this.isBreaking) || this.shieldHealth === 0) return;
        
        const ctx = this.ctx;
        
        const statusBarWidth = this.canvas.width * 0.6;
        const statusBarHeight = 8;
        const statusBarX = (this.canvas.width - statusBarWidth) / 2;
        const statusBarY = 20;
        const progress = this.shieldHealth / this.maxProtection;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(statusBarX, statusBarY, statusBarWidth, statusBarHeight);

        let barColor;
        if (this.shieldHealth === 3) {
            barColor = '#00BFFF';
        } else if (this.shieldHealth === 2) {
            barColor = '#FFD700';
        } else if (this.shieldHealth === 1) {
            barColor = '#FF4500';
        }
        
        if (!barColor) return;

        ctx.fillStyle = barColor;
        ctx.fillRect(statusBarX, statusBarY, statusBarWidth * progress, statusBarHeight);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(statusBarX, statusBarY, statusBarWidth, statusBarHeight);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        
        let statusText = 'SHIELD ACTIVE';
        if (this.isBreaking) {
            statusText = 'SHIELD BREAKING';
        } else if (this.shieldHealth === 3) {
            statusText = 'SHIELD ACTIVE - BLUE';
        } else if (this.shieldHealth === 2) {
            statusText = 'SHIELD ACTIVE - YELLOW';
        } else if (this.shieldHealth === 1) {
            statusText = 'SHIELD ACTIVE - RED';
        }
        
        ctx.fillText(statusText, this.canvas.width / 2, statusBarY - 5);

        const smallBarWidth = 80;
        const smallBarHeight = 6;
        const smallBarX = 10;
        const smallBarY = this.canvas.height - 60;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(smallBarX, smallBarY, smallBarWidth, smallBarHeight);

        ctx.fillStyle = barColor;
        ctx.fillRect(smallBarX, smallBarY, smallBarWidth * progress, smallBarHeight);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(smallBarX, smallBarY, smallBarWidth, smallBarHeight);

        ctx.font = '10px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Shield: ${this.shieldHealth}/3`, smallBarX, smallBarY - 5);
    }

    isProtecting() {
        return this.isActive;
    }

    isReady() {
        return this.isAvailable && !this.isActive;
    }

    getCooldownProgress() {
        if (this.isAvailable || this.isActive) return 1;
        const elapsed = Date.now() - this.cooldownStart;
        return Math.min(elapsed / this.cooldownTime, 1);
    }

    reset() {
        this.isActive = false;
        this.hitsProtected = 0;
        this.isAvailable = true;
        this.cooldownStart = 0;
        this.shieldParticles = [];
        this.particleTimer = 0;
        this.shieldRotation = 0;
        this.pulseIntensity = 0;
        this.shieldHealth = this.maxProtection;
        this.lastHitTime = 0;
        this.breakTimer = 0;
        this.isBreaking = false;
    }

    getShieldHealth() {
        return this.shieldHealth;
    }
}

const shieldSystem = new ShieldSystem();