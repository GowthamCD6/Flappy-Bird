class GravitySystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isActive = false;
        this.isUsed = false;
        this.cooldownTime = 10000;
        this.lastUsedTime = 0;

        this.sprite = {
            x: 382,
            y: 102,
            width: 22,
            height: 22
        };

        this.gravityWaves = [];
        this.activationTime = 0;
       this.effectDuration = 2000;

       // Ground explosions
       this.groundExplosions = [];
       this.groundY = 0; // will be set from game

        this.spriteLoaded = false;
        this.spriteSheet = new Image();
        this.spriteSheet.onload = () => {
            this.spriteLoaded = true;
            console.log('Gravity sprite loaded!');
        };
        this.spriteSheet.onerror = () => {
            console.log('Gravity sprite not found, using fallback');
        };
        this.spriteSheet.src = 'assets/images/flappybirdassets(1).png';
        
        // Load blast sprite for ground explosions
        this.blastLoaded = false;
        this.blastSprite = new Image();
        this.blastSprite.onload = () => {
            this.blastLoaded = true;
            console.log('Gravity blast sprite loaded!');
        };
        this.blastSprite.onerror = () => {
            console.log('Gravity blast sprite not found');
        };
        this.blastSprite.src = 'assets/images/blast.png';
    }

    init(canvas, groundY = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.groundY = groundY || (canvas.height - 80);
    }
    
    setGroundY(groundY) {
        this.groundY = groundY;
    }

    isReady() {
        if (this.isUsed) {
            const elapsed = Date.now() - this.lastUsedTime;
            return elapsed >= this.cooldownTime;
        }
        return true;
    }

    getCooldownProgress() {
        if (!this.isUsed) return 1;
        const elapsed = Date.now() - this.lastUsedTime;
        return Math.min(elapsed / this.cooldownTime, 1);
    }

    activate() {
        if (!this.isReady()) {
            console.log('Gravity power on cooldown!');
            return false;
        }

        if (typeof rocketSystem !== 'undefined' && rocketSystem.rockets.length > 0) {

            for (const rocket of rocketSystem.rockets) {
                this.applyGravityToRocket(rocket);
            }

            this.isActive = true;
            this.isUsed = true;
            this.lastUsedTime = Date.now();
            this.activationTime = Date.now();

            this.createGravityWaveEffect();

            console.log('Gravity power activated! All rockets falling!');
            return true;
        } else {
            console.log('No rockets to apply gravity to!');
            return false;
        }
    }

    applyGravityToRocket(rocket) {
        if (typeof rocket.affectedByGravity === 'undefined') {
            rocket.affectedByGravity = false;
            rocket.velocityY = 0;
            rocket.velocityX = 0;
            rocket.gravityStrength = 0.6;
            rocket.rotation = 0;
            rocket.rotationSpeed = 0;
            rocket.hasExploded = false;
        }

        rocket.affectedByGravity = true;
         rocket.velocityY = -2 + Math.random() * 2; // Initial upward bounce
         rocket.velocityX = (Math.random() - 0.5) *3;

         // store reference to gravity system for ground collision
         const gravitySystem = this;

        rocket.update = function() {
            const elapsed = Date.now() - this.spawnTime;

            if (elapsed < this.warningDuration) {
                this.showWarning = true;
                this.warningPhase += 0.15;
                this.warningAlpha = 0.5 + Math.sin(this.warningPhase) * 0.5;
                return;
            }

            this.showWarning = false;
            
            if(this.hasExploded) {
                return; // Don't update if already exploded
            }

            if(this.affectedByGravity){
                //Apply gravity acceleration (realistic physics)
                this.velocityY += this.gravityStrength;

                // Terminal velocity
                if(this.velocityY > 15) {
                    this.velocityY = 15;
                }

                // Apply velocities
                this.x += this.velocityX;
                this.y += this.velocityY;

                // Tumbling rotation (accelerates as it falls)
                this.rotationSpeed += 0.01;
                this.rotation += this.rotationSpeed;
              
                // Slow down horizontal movement with air resistance
                this.velocityX *= 0.99;
                this.speed *= 0.95;

                // Check ground collision
                if(this.y + this.height >= gravitySystem.groundY) {
                    this.y = gravitySystem.groundY - this.height;
                    this.hasExploded = true;

                    // Create ground explosion
                    gravitySystem.createGroundExplosion(this.x + this.width / 2, gravitySystem.groundY);

                    // Mark for removal
                    this.shouldRemove = true;
                } else {
                    this.x -= this.speed;
                }
            } else {
                this.x -= this.speed;
            }

            // Update trail particles
            this.trailTimer++;
            if (this.trailTimer % 2 === 0 && !this.hasExploded) {
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
        };

        const originalDraw = rocket.draw.bind(rocket);

        rocket.draw = function() {
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
        };

        rocket.isOffScreen = function() {
            return this.x + this.width < -20 || this.y > this.canvas.height + 50 || this.shouldRemove;
        };
    }
    
    createGroundExplosion(x, y) {
        const explosion = {
            x: x,
            y: y,
            startTime: Date.now(),
            duration: 600,
            scale: 0.1,
            alpha: 1,
            particles: [],
            shockwave: {
                radius: 5,
                maxRadius: 100,
                alpha: 0.8
            },
            // Use second sprite position for ground explosion
            spriteFrame: Math.random() < 0.5 ? 0 : 1
        };
        
        // Create debris particles (reduced count for performance)
        const colors = ['#FF4500', '#FFA500', '#FFD700', '#FF0000'];
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const speed = 2 + Math.random() * 4;
            explosion.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: -Math.abs(Math.sin(angle) * speed) - 2,
                size: 3 + Math.random() * 4,
                alpha: 1,
                life: 35,
                maxLife: 35,
                color: colors[i % colors.length],
                gravity: 0.15,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
        
        // Add smoke particles (reduced count for performance)
        for (let i = 0; i < 4; i++) {
            explosion.particles.push({
                x: x + (i - 2) * 15,
                y: y - 10,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -0.5,
                size: 15 + i * 5,
                alpha: 0.4,
                life: 40,
                maxLife: 40,
                color: '#666666',
                gravity: -0.01,
                isSmoke: true
            });
        }
        
        this.groundExplosions.push(explosion);
    }

    createGravityWaveEffect() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        for (let i = 0; i < 3; i++) {
            this.gravityWaves.push({
                x: centerX,
                y: centerY,
                radius: 10 + i * 30,
                maxRadius: this.canvas.width,
                alpha: 0.8 - i * 0.2,
                speed: 8 + i * 2,
                color: i === 0 ? '#9932CC' : (i === 1 ? '#8A2BE2' : '#7B68EE')
            });
        }
    }

    update() {
        for (let i = this.gravityWaves.length - 1; i >= 0; i--) {
            const wave = this.gravityWaves[i];
            wave.radius += wave.speed;
            wave.alpha *= 0.96;

            if (wave.radius >= wave.maxRadius || wave.alpha < 0.01) {
                this.gravityWaves.splice(i, 1);
            }
        }
        
        // Update ground explosions
        for (let i = this.groundExplosions.length - 1; i >= 0; i--) {
            const explosion = this.groundExplosions[i];
            const elapsed = Date.now() - explosion.startTime;
            const progress = elapsed / explosion.duration;
            
            if (progress >= 1) {
                this.groundExplosions.splice(i, 1);
                continue;
            }
            
            // Animate scale and alpha
            if (progress < 0.2) {
                explosion.scale = 0.1 + (progress / 0.2) * 0.9; // Scale up to 1
            } else {
                explosion.scale = 1 - ((progress - 0.2) / 0.8) * 0.3; // Slight shrink
            }
            explosion.alpha = 1 - (progress * progress); // Ease out fade
            
            // Update shockwave
            explosion.shockwave.radius = explosion.shockwave.maxRadius * progress;
            explosion.shockwave.alpha = 0.8 * (1 - progress);
            
            // Update particles
            for (let j = explosion.particles.length - 1; j >= 0; j--) {
                const p = explosion.particles[j];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= 0.98; // Air resistance
                p.life--;
                p.alpha = p.life / p.maxLife;
                
                if (p.rotation !== undefined) {
                    p.rotation += p.rotationSpeed;
                }
                
                // Grow smoke particles
                if (p.isSmoke) {
                    p.size += 0.3;
                }
                
                if (p.life <= 0) {
                    explosion.particles.splice(j, 1);
                }
            }
        }

        if (this.isActive && Date.now() - this.activationTime > this.effectDuration) {
            this.isActive = false;
        }
    }

    draw() {
        if (!this.ctx) return;

        const ctx = this.ctx;

        for (const wave of this.gravityWaves) {
            ctx.save();
            ctx.globalAlpha = wave.alpha;
            ctx.strokeStyle = wave.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.globalAlpha = wave.alpha * 0.5;
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius - 2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }
        
        // Draw ground explosions
        for (const explosion of this.groundExplosions) {
            ctx.save();
            
            // Draw shockwave ring
            if (explosion.shockwave.alpha > 0.05) {
                ctx.globalAlpha = explosion.shockwave.alpha;
                ctx.strokeStyle = '#FF6600';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(explosion.x, explosion.y, explosion.shockwave.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Draw particles (optimized - no gradients)
            for (const p of explosion.particles) {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                
                if (p.isSmoke) {
                    // Draw smoke as simple circle (no gradient for performance)
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Draw debris as rotated rectangles
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    if (p.rotation !== undefined) {
                        ctx.rotate(p.rotation);
                    }
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                    ctx.restore();
                }
            }
            
            // Draw blast sprite
            ctx.globalAlpha = explosion.alpha;
            const spriteWidth = explosion.spriteFrame === 0 ? 174 : 174;
            const spriteHeight = explosion.spriteFrame === 0 ? 175 : 145;
            const spriteX = explosion.spriteFrame === 0 ? 183 : 3;
            const spriteY = explosion.spriteFrame === 0 ? 183 : 32;
            
            const drawWidth = spriteWidth * explosion.scale;
            const drawHeight = spriteHeight * explosion.scale;
            
            if (this.blastSprite && this.blastSprite.complete && this.blastSprite.naturalWidth > 0) {
                ctx.drawImage(
                    this.blastSprite,
                    spriteX, spriteY, spriteWidth, spriteHeight,
                    explosion.x - drawWidth / 2,
                    explosion.y - drawHeight,
                    drawWidth, drawHeight
                );
            } else {
                // Fallback explosion drawing
                const gradient = ctx.createRadialGradient(
                    explosion.x, explosion.y - drawHeight / 2,
                    0,
                    explosion.x, explosion.y - drawHeight / 2,
                    drawWidth / 2
                );
                gradient.addColorStop(0, '#FFFF00');
                gradient.addColorStop(0.3, '#FFA500');
                gradient.addColorStop(0.6, '#FF4500');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(explosion.x, explosion.y - drawHeight / 2, drawWidth / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }

        if (this.isActive) {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.2;
            
            ctx.fillStyle = '#9932CC';
            for (let x = 50; x < this.canvas.width; x += 80) {
                const y = (Date.now() / 10 + x) % this.canvas.height;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - 10, y - 20);
                ctx.lineTo(x + 10, y - 20);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }
    }

    hasTargets() {
        return typeof rocketSystem !== 'undefined' && 
               rocketSystem.rockets.some(r => !r.affectedByGravity);
    }

    reset() {
        this.isActive = false;
        this.isUsed = false;
        this.lastUsedTime = 0;
        this.gravityWaves = [];
        this.groundExplosions = [];
    }
}

const gravitySystem = new GravitySystem();
