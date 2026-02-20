class Rocket {
    constructor(canvas, rocketImage, imageLoaded, customY = null, customSpeed = null, customXOffset = 0) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.rocketImage = rocketImage;
        this.imageLoaded = imageLoaded;

        this.width = 45;
        this.height = 56;

        // Start position with custom X offset for staggered formation
        this.x = canvas.width + this.width + customXOffset;
        
        // Use custom Y if provided, otherwise random
        if (customY !== null) {
            this.y = customY;
        } else {
            const minY = 60;
            const maxY = canvas.height - 140;
            this.y = minY + Math.random() * (maxY - minY);
        }

        // Use custom speed if provided, otherwise random (reduced speed)
        this.speed = customSpeed !== null ? customSpeed : (1.5 + Math.random() * 1);

        this.sprite = {
            x: 138,
            y: 50,
            width: 224,
            height: 400
        };

        this.trail = [];
        this.trailTimer = 0;

        this.warningAlpha = 1;
        this.warningPhase = 0;
        this.showWarning = true;
        this.warningDuration = 800;
        this.spawnTime = Date.now();

        // Gravity properties
        this.velocityY = 0;
        this.affectedByGravity = false;
        this.gravityStrength = 0.5;
        this.rotation = 0;
    }

    applyGravity() {
        this.affectedByGravity = true;
        this.velocityY = 0;
    }

    update() {
        const elapsed = Date.now() - this.spawnTime;

        if (elapsed < this.warningDuration) {
            this.showWarning = true;
            this.warningPhase += 0.15;
            this.warningAlpha = 0.5 + Math.sin(this.warningPhase) * 0.5;
            return;
        }

        this.showWarning = false;
        this.x -= this.speed;

        // Apply gravity effect if activated
        if (this.affectedByGravity) {
            this.velocityY += this.gravityStrength;
            this.y += this.velocityY;
            this.rotation += 0.1; // Rotate as it falls
            
            // Reduce horizontal speed when falling
            this.speed *= 0.98;
        }

        this.trailTimer++;
        if (this.trailTimer % 2 === 0) {
            this.trail.push({
                x: this.x + this.width,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * 8,
                size: 3 + Math.random() * 4,
                alpha: 0.8,
                life: 15 + Math.random() * 10,
                maxLife: 25,
                vx: 1 + Math.random() * 2,
                vy: (Math.random() - 0.5) * 1.5
            });
        }

        for (let i = this.trail.length - 1; i >= 0; i--) {
            const p = this.trail[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.alpha = Math.max(0, p.life / p.maxLife) * 0.8;
            p.size *= 0.95;
            if (p.life <= 0) {
                this.trail.splice(i, 1);
            }
        }
    }

    draw() {
        const ctx = this.ctx;

        if (this.showWarning) {
            ctx.save();
            ctx.globalAlpha = this.warningAlpha;

            const warningX = this.canvas.width - 30;
            const warningY = this.y + this.height / 2;

            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(warningX + 15, warningY);
            ctx.lineTo(warningX, warningY - 10);
            ctx.lineTo(warningX, warningY + 10);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', warningX - 8, warningY + 5);

            ctx.restore();
            return;
        }

        for (const p of this.trail) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Rotate based on gravity state
        if (this.affectedByGravity) {
            ctx.rotate(-Math.PI / 2 + this.rotation);
        } else {
            ctx.rotate(-Math.PI / 2);
        }

        if (this.imageLoaded && this.rocketImage) {
            ctx.drawImage(
                this.rocketImage,
                this.sprite.x, this.sprite.y,
                this.sprite.width, this.sprite.height,
                -this.width / 2, -this.height / 2,
                this.width, this.height
            );
        } else {
            this.drawFallbackRocket(ctx);
        }

        ctx.restore();
    }

    drawFallbackRocket(ctx) {
        ctx.fillStyle = '#CC0000';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width / 2 - 10, -this.height / 2 + 2);
        ctx.lineTo(this.width / 2 - 10, this.height / 2 - 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#990000';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(-this.width / 2 - 6, -this.height / 2 - 5);
        ctx.lineTo(-this.width / 2 + 5, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2 - 6, this.height / 2 + 5);
        ctx.lineTo(-this.width / 2 + 5, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -4);
        ctx.lineTo(-this.width / 2 - 12 - Math.random() * 5, 0);
        ctx.lineTo(-this.width / 2, 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -2);
        ctx.lineTo(-this.width / 2 - 8 - Math.random() * 3, 0);
        ctx.lineTo(-this.width / 2, 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.arc(5, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    getBounds() {
        return {
            x: this.x + 4,
            y: this.y + 2,
            width: this.width - 8,
            height: this.height - 4
        };
    }

    isOffScreen() {
        // Also check if rocket fell below screen
        return this.x + this.width < -20 || this.y > this.canvas.height + 50;
    }

    isActive() {
        const elapsed = Date.now() - this.spawnTime;
        return elapsed >= this.warningDuration;
    }
}

class RocketSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.bird = null;

        this.rockets = [];
        this.explosions = [];

        // Wave system configuration
        this.scoreThreshold = 10;
        this.nextWaveScore = 10;
        this.formationsPerWave = 3;
        this.formationsSpawnedInWave = 0;
        this.waveActive = false;

        // Spawn timing
        this.minSpawnInterval = 15000;
        this.maxSpawnInterval = 20000;
        this.lastSpawnTime = 0;
        this.nextSpawnDelay = 0;

        this.spriteLoaded = false;
        this.rocketImage = new Image();
        this.rocketImage.onload = () => {
            this.spriteLoaded = true;
            console.log('Rocket sprite loaded!');
        };
        this.rocketImage.onerror = () => {
            console.log('Rocket sprite not found, using fallback');
        };
        this.rocketImage.src = 'assets/images/rocket.png';
    }

    init(bird, canvas) {
        this.bird = bird;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    update(score) {
        const now = Date.now();

        if (!this.waveActive && score >= this.nextWaveScore) {
            this.startNewWave();
        }

        if (this.waveActive && this.formationsSpawnedInWave < this.formationsPerWave) {
            if (now - this.lastSpawnTime >= this.nextSpawnDelay) {
                this.spawnRocket();
                this.lastSpawnTime = now;
                this.formationsSpawnedInWave++;

                this.nextSpawnDelay = this.minSpawnInterval + Math.random() * (this.maxSpawnInterval - this.minSpawnInterval);

                if (this.formationsSpawnedInWave >= this.formationsPerWave) {
                    this.endWave();
                }
            }
        }

        for (let i = this.rockets.length - 1; i >= 0; i--) {
            this.rockets[i].update();
            if (this.rockets[i].isOffScreen()) {
                this.rockets.splice(i, 1);
            }
        }

        this.updateExplosions();
    }

    startNewWave() {
        this.waveActive = true;
        this.formationsSpawnedInWave = 0;
        this.lastSpawnTime = Date.now();
        this.nextSpawnDelay = 2000 + Math.random() * 3000;
        console.log('Rocket wave started! Score:', this.nextWaveScore);
    }

    endWave() {
        this.waveActive = false;
        this.nextWaveScore += 10;
        console.log('Rocket wave ended. Next wave at score:', this.nextWaveScore);
    }

    spawnRocket() {
        const rocketHeight = 56;
        const gapHeight = 150;

        const topMargin = 60;
        const bottomMargin = 140;
        const playableHeight = this.canvas.height - topMargin - bottomMargin;

        const zoneHeight = (playableHeight - gapHeight) / 3;

        const gapPosition = Math.random() < 0.5 ? 1 : 2;

        const formationSpeed = 1.8 + Math.random() * 0.7;

        const xOffsets = [
            0,
            100 + Math.random() * 50,
            220 + Math.random() * 80
        ];

        for (let i = xOffsets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [xOffsets[i], xOffsets[j]] = [xOffsets[j], xOffsets[i]];
        }

        let yPositions = [];

        if (gapPosition === 1) {
            yPositions.push(topMargin + Math.random() * 30);
            yPositions.push(topMargin + zoneHeight + gapHeight + Math.random() * 30);
            yPositions.push(this.canvas.height - bottomMargin - rocketHeight - Math.random() * 30);
        } else {
            yPositions.push(topMargin + Math.random() * 30);
            yPositions.push(topMargin + zoneHeight + Math.random() * 30);
            yPositions.push(this.canvas.height - bottomMargin - rocketHeight - Math.random() * 30);
        }

        for (let i = 0; i < 3; i++) {
            const rocket = new Rocket(
                this.canvas,
                this.rocketImage,
                this.spriteLoaded,
                yPositions[i],
                formationSpeed,
                xOffsets[i]
            );
            this.rockets.push(rocket);
        }

        console.log('Rocket formation spawned! Gap position:', gapPosition === 1 ? 'UPPER' : 'LOWER', 'Speed:', formationSpeed.toFixed(2));
    }

    checkCollision(bird) {
        const birdBounds = bird.getBounds();

        for (let i = 0; i < this.rockets.length; i++) {
            const rocket = this.rockets[i];
            if (!rocket.isActive()) continue;

            const rocketBounds = rocket.getBounds();

            if (birdBounds.x < rocketBounds.x + rocketBounds.width &&
                birdBounds.x + birdBounds.width > rocketBounds.x &&
                birdBounds.y < rocketBounds.y + rocketBounds.height &&
                birdBounds.y + birdBounds.height > rocketBounds.y) {

                this.spawnExplosion(
                    rocket.x + rocket.width / 2,
                    rocket.y + rocket.height / 2
                );

                this.rockets.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    spawnExplosion(x, y) {
        const colors = ['#FF4500', '#FFA500', '#FFD700', '#FF0000', '#FFFF00'];
        const particleCount = 20;

        const explosion = {
            particles: [],
            flashAlpha: 1,
            flashTimer: 10,
            x: x,
            y: y
        };

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const speed = 2 + Math.random() * 5;

            explosion.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                alpha: 1,
                life: 30,
                maxLife: 30,
                color: colors[i % colors.length],
                gravity: 0.08,
                decay: 0.96
            });
        }

        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const speed = 1.5;

            explosion.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 10,
                alpha: 0.5,
                life: 40,
                maxLife: 40,
                color: '#555555',
                gravity: -0.02,
                decay: 0.97
            });
        }

        explosion.shockwave = {
            x: x,
            y: y,
            radius: 5,
            maxRadius: 80,
            alpha: 0.8,
            speed: 4
        };

        this.explosions.push(explosion);
    }

    updateExplosions() {
        for (let e = this.explosions.length - 1; e >= 0; e--) {
            const explosion = this.explosions[e];

            if (explosion.flashTimer > 0) {
                explosion.flashTimer--;
                explosion.flashAlpha = explosion.flashTimer / 10;
            }

            if (explosion.shockwave) {
                explosion.shockwave.radius += explosion.shockwave.speed;
                explosion.shockwave.alpha *= 0.92;
                if (explosion.shockwave.radius >= explosion.shockwave.maxRadius) {
                    explosion.shockwave = null;
                }
            }

            let allDead = true;
            for (let i = explosion.particles.length - 1; i >= 0; i--) {
                const p = explosion.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= p.decay;
                p.vy *= p.decay;
                p.life--;
                p.alpha = Math.max(0, (p.life / p.maxLife));
                p.size *= 0.98;

                if (p.life <= 0) {
                    explosion.particles.splice(i, 1);
                } else {
                    allDead = false;
                }
            }

            if (allDead && explosion.flashTimer <= 0 && !explosion.shockwave) {
                this.explosions.splice(e, 1);
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        if (!ctx) return;

        for (const rocket of this.rockets) {
            rocket.draw();
        }

        for (const explosion of this.explosions) {
            if (explosion.flashTimer > 0) {
                ctx.save();
                ctx.globalAlpha = explosion.flashAlpha * 0.3;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.restore();
            }

            if (explosion.shockwave) {
                const sw = explosion.shockwave;
                ctx.save();
                ctx.globalAlpha = sw.alpha;
                ctx.strokeStyle = '#FFA500';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            for (const p of explosion.particles) {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    hasActiveExplosions() {
        return this.explosions.length > 0;
    }

    // Activate gravity power - makes all rockets fall down
    activateGravityPower() {
        if (this.rockets.length === 0) {
            console.log('No rockets to apply gravity to');
            return false;
        }

        for (const rocket of this.rockets) {
            if (!rocket.affectedByGravity) {
                rocket.applyGravity();
            }
        }
        
        console.log('Gravity power activated! Rockets falling...');
        return true;
    }

    // Check if there are rockets that can be affected by gravity
    hasActiveRockets() {
        return this.rockets.some(rocket => rocket.isActive() && !rocket.affectedByGravity);
    }

    reset() {
        this.rockets = [];
        this.explosions = [];
        this.lastSpawnTime = 0;

        this.nextWaveScore = this.scoreThreshold;
        this.formationsSpawnedInWave = 0;
        this.waveActive = false;
        this.nextSpawnDelay = 0;
    }
}

const rocketSystem = new RocketSystem();