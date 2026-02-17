class PowerUpSystem {
    constructor() {
        this.isActive = false;
        this.duration = 5000;
        this.startTime = 0;
        this.timeRemaining = 0;

        this.particles = [];
        this.particleTimer = 0;

        this.bird = null;
        this.canvas = null;
        this.ctx = null;

        this.originalSpeed = 2;
        this.boostedSpeed = 5;

        this.fixedY = 0;
    }

    init(bird, canvas) {
        this.bird = bird;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    activate(currentTime) {
        if (this.isActive) return false;

        this.isActive = true;
        this.startTime = currentTime;
        this.timeRemaining = this.duration;
        this.particles = [];

        this.fixedY = this.bird.y;

        console.log('Power-up activated! Bird is invincible for 5 seconds!');
        return true;
    }

    deactivate() {
        this.isActive = false;
        this.timeRemaining = 0;
        this.particles = [];
        console.log('Power-up ended!');
    }

    update(currentTime) {
        if (!this.isActive) return;

        this.timeRemaining = this.duration - (currentTime - this.startTime);
        if (this.timeRemaining <= 0) {
            this.deactivate();
            return;
        }

        this.bird.y = this.fixedY;
        this.bird.velocity = 0;
        this.bird.rotation = 0;

        this.particleTimer++;
        if (this.particleTimer % 2 === 0) {
            this.spawnParticle();
        }

        this.updateParticles();
    }

    spawnParticle() {
        const birdCenterY = this.bird.y + this.bird.height / 2;
        this.particles.push({
            x: this.bird.x - 5,
            y: birdCenterY + (Math.random() - 0.5) * this.bird.height,
            width: 10 + Math.random() * 20,
            height: 2 + Math.random() * 3,
            alpha: 0.8,
            speed: 3 + Math.random() * 4,
            color: Math.random() > 0.5 ? '#FFD700' : '#FFA500'
        });
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x -= p.speed;
            p.alpha -= 0.02;

            if (p.alpha <= 0 || p.x + p.width < 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        if (!this.isActive) return;

        const ctx = this.ctx;

        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.restore();
        }

        ctx.save();
        const birdCenterX = this.bird.x + this.bird.width / 2;
        const birdCenterY = this.bird.y + this.bird.height / 2;
        const glowRadius = this.bird.width;

        const gradient = ctx.createRadialGradient(
            birdCenterX, birdCenterY, 0,
            birdCenterX, birdCenterY, glowRadius
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(birdCenterX, birdCenterY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        this.drawTimerBar();
    }

    drawTimerBar() {
        const ctx = this.ctx;
        const barWidth = this.canvas.width * 0.6;
        const barHeight = 8;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = 15;
        const progress = this.timeRemaining / this.duration;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * progress, barY);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    isInvincible() {
        return this.isActive;
    }

    getPipeSpeed() {
        return this.isActive ? this.boostedSpeed : this.originalSpeed;
    }

    reset() {
        this.isActive = false;
        this.startTime = 0;
        this.timeRemaining = 0;
        this.particles = [];
        this.particleTimer = 0;
    }
}

const powerUpSystem = new PowerUpSystem();