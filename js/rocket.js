class Rocket {
    constructor(canvas, rocketImage, imageLoaded) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.rocketImage = rocketImage;
        this.imageLoaded = imageLoaded;

        this.width = 56;
        this.height = 40;

        this.x = canvas.width + this.width;
        const minY = 60;
        const maxY = canvas.height - 140;
        this.y = minY + Math.random() * (maxY - minY);

        this.speed = 3 + Math.random() * 2;

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
            ctx.save();
            ctx.globalAlpha = p.alpha;
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, '#FFA500');
            gradient.addColorStop(0.5, '#FF4500');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(-Math.PI / 2);

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
        return this.x + this.width < -20;
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

        this.scoreThreshold = 10;
        this.spawnInterval = 3000;
        this.minSpawnInterval = 1500;
        this.lastSpawnTime = 0;

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
        if (score < this.scoreThreshold) return;

        const now = Date.now();

        const difficulty = Math.min((score - this.scoreThreshold) / 30, 1);
        const currentInterval = this.spawnInterval - difficulty * (this.spawnInterval - this.minSpawnInterval);

        if (now - this.lastSpawnTime > currentInterval) {
            this.spawnRocket();
            this.lastSpawnTime = now;
        }

        for (let i = this.rockets.length - 1; i >= 0; i--) {
            this.rockets[i].update();
            if (this.rockets[i].isOffScreen()) {
                this.rockets.splice(i, 1);
            }
        }

        this.updateExplosions();
    }

    spawnRocket() {
        const rocket = new Rocket(this.canvas, this.rocketImage, this.spriteLoaded);

        if (this.rockets.length > 0) {
            rocket.speed += this.rockets.length * 0.5;
        }

        this.rockets.push(rocket);
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
        const colors = ['#FF4500', '#FFA500', '#FFD700', '#FF0000', '#FF6347', '#FFFF00', '#FFFFFF'];
        const particleCount = 40;

        const explosion = {
            particles: [],
            flashAlpha: 1,
            flashTimer: 10,
            x: x,
            y: y
        };

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + (Math.random() - 0.5) * 0.5;
            const speed = 2 + Math.random() * 6;

            explosion.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                alpha: 1,
                life: 30 + Math.random() * 25,
                maxLife: 55,
                color: colors[Math.floor(Math.random() * colors.length)],
                gravity: 0.08,
                decay: 0.96
            });
        }

        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;

            explosion.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 6 + Math.random() * 8,
                alpha: 0.6,
                life: 40 + Math.random() * 20,
                maxLife: 60,
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
                ctx.save();
                ctx.globalAlpha = p.alpha;
                if (p.color === '#555555') {
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                    grad.addColorStop(0, '#FFFFFF');
                    grad.addColorStop(0.3, p.color);
                    grad.addColorStop(1, 'rgba(255,0,0,0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }
    }

    hasActiveExplosions() {
        return this.explosions.length > 0;
    }

    reset() {
        this.rockets = [];
        this.explosions = [];
        this.lastSpawnTime = 0;
    }
}

const rocketSystem = new RocketSystem();