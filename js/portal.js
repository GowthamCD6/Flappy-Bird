class PortalSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.bird = null;

        // Portal states: inactive, entry_spawning, entry_open, transitioning_in,
        //                new_world, exit_spawning, exit_open, transitioning_out, cooldown
        this.state = 'inactive';
        this.triggerScore = 5;
        this.portalDuration = 20000; // 20 seconds to enter
        this.portalOpenTime = 0;
        this.hasTriggered = false;

        // Entry portal - FIXED position
        this.entryPortal = {
            x: 0, y: 0,
            radius: 0, maxRadius: 50,
            rotation: 0,
            particles: [],
            alpha: 0,
            spawnTime: 0,
            spawnDuration: 1500 // 1.5s to fully form
        };

        // Exit portal (in new world)
        this.exitPortal = {
            x: 0, y: 0,
            radius: 0, maxRadius: 50,
            rotation: 0,
            particles: [],
            alpha: 0,
            spawnTime: 0,
            spawnDuration: 1500
        };

        // Transition effect
        this.transition = {
            progress: 0,
            duration: 1200,
            startTime: 0,
            type: 'in' // 'in' or 'out'
        };

        // New world properties
        this.isNewWorld = false;
        this.worldTransition = 0; // 0 = normal, 1 = new world
        this.stars = [];
        this.shootingStars = [];
        this.floatingOrbs = [];
        this.newWorldTime = 0;
        this.newWorldDuration = 20000; // 20 seconds in new world before exit portal

        // Bird horizontal movement when portal active
        this.birdHorizontalSpeed = 1.5;
        this.birdMovingToPortal = false;

        // Score bonus
        this.bonusMultiplier = 2;

        // Reduced gravity in new world (0.5 = half gravity)
        this.newWorldGravityMultiplier = 0.5;

        // Grace period after exiting portal (no pipes for a while)
        this.exitGracePeriod = 3000; // 3 seconds grace
        this.exitTime = 0;
        this.justExited = false;

        // Flag to signal game.js to clear pipes (set during transitions)
        this.needsClearPipes = false;

        // Visual effects
        this.flashAlpha = 0; // Screen flash when portal opens
        this.needsScreenShake = false; // Signal for screen shake
        this.screenShakeIntensity = 5;
        this.screenShakeDuration = 300;

        // Timer bar
        this.timerBarFlash = 0;

        // Portal sprite
        this.spriteLoaded = false;
        this.portalSprite = new Image();
        this.portalSprite.onload = () => {
            this.spriteLoaded = true;
            console.log('Portal sprite loaded!');
        };
        this.portalSprite.onerror = () => {
            console.log('Portal sprite not found, using fallback');
        };
        this.portalSprite.src = 'assets/images/portal.png';

        // Sprite source crop (content area within the 6400x6400 image)
        this.spriteSrc = { x: 1880, y: 1190, width: 2810, height: 4000 };
        // Draw size on canvas
        this.portalDrawSize = 120;

        // Portal colors (for particles & glow) - SAME for both portals now
        this.portalColors = ['#8B5CF6', '#7C3AED', '#6D28D9', '#A78BFA', '#C4B5FD'];
        this.newWorldBgColor1 = '#0F0A2E';
        this.newWorldBgColor2 = '#1A1145';

        this._initStars();
    }

    _initStars() {
        // Pre-generate stars for the new world
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * 400,
                y: Math.random() * 520,
                size: 0.5 + Math.random() * 2,
                twinkleSpeed: 0.02 + Math.random() * 0.04,
                twinkleOffset: Math.random() * Math.PI * 2,
                brightness: 0.5 + Math.random() * 0.5
            });
        }
    }

    init(bird, canvas) {
        this.bird = bird;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    canTrigger(score) {
        return !this.hasTriggered && score >= this.triggerScore && this.state === 'inactive';
    }

    trigger() {
        if (this.state !== 'inactive') return;

        // Portal opens INSTANTLY - skip spawning animation
        this.state = 'entry_open';

        // Spawn entry portal at FIXED position on the right side of screen
        this.entryPortal.x = this.canvas.width - 80; // Fixed X position
        this.entryPortal.y = this.canvas.height / 2; // Center Y
        this.entryPortal.radius = this.entryPortal.maxRadius; // Instantly full size
        this.entryPortal.alpha = 1; // Instantly visible
        this.entryPortal.rotation = 0;
        this.entryPortal.spawnTime = Date.now();
        this.entryPortal.particles = [];

        this.portalOpenTime = Date.now();
        this.hasTriggered = true;
        this.birdMovingToPortal = true; // Start moving bird toward portal

        // Visual effects
        this.flashAlpha = 0.8; // Bright flash when portal opens
        this.needsScreenShake = true; // Trigger screen shake

        console.log('Portal is open! Fly into it within 20 seconds!');
    }

    // Check if pipes should spawn (FALSE when in new world, portal active, or during grace period)
    shouldSpawnPipes() {
        // No pipes in new world
        if (this.isNewWorld) return false;
        
        // No pipes when portal is active (entry or exit visible)
        if (this.state === 'entry_open' || this.state === 'entry_spawning' ||
            this.state === 'transitioning_in' || this.state === 'transitioning_out') {
            return false;
        }
        
        // No pipes during grace period after exiting
        if (this.justExited) {
            const elapsed = Date.now() - this.exitTime;
            if (elapsed < this.exitGracePeriod) {
                return false;
            }
            this.justExited = false; // Grace period over
        }
        
        return true;
    }

    // Get gravity multiplier for new world (reduced gravity)
    getGravityMultiplier() {
        return this.isNewWorld ? this.newWorldGravityMultiplier : 1;
    }

    update(currentTime) {
        // Decay flash effect (always, even when inactive/cooldown)
        if (this.flashAlpha > 0) {
            this.flashAlpha -= 0.03;
            if (this.flashAlpha < 0) this.flashAlpha = 0;
        }

        if (this.state === 'inactive' || this.state === 'cooldown') return;

        const now = Date.now();

        // Move bird horizontally toward portal when active
        if (this.birdMovingToPortal && this.bird) {
            this._moveBirdTowardPortal();
        }

        switch (this.state) {
            case 'entry_spawning':
                this._updateEntrySpawning(now);
                break;
            case 'entry_open':
                this._updateEntryOpen(now);
                break;
            case 'transitioning_in':
                this._updateTransitionIn(now);
                break;
            case 'new_world':
                this._updateNewWorld(now);
                break;
            case 'exit_spawning':
                this._updateExitSpawning(now);
                break;
            case 'exit_open':
                this._updateExitOpen(now);
                break;
            case 'transitioning_out':
                this._updateTransitionOut(now);
                break;
        }

        // Update portal particles
        this._updatePortalParticles(this.entryPortal);
        this._updatePortalParticles(this.exitPortal);

        // Update shooting stars in new world
        if (this.isNewWorld) {
            this._updateShootingStars();
            this._updateFloatingOrbs();
        }
    }

    _moveBirdTowardPortal() {
        if (!this.bird) return;

        // Determine target portal
        let targetPortal = this.entryPortal;
        if (this.isNewWorld && this.exitPortal.alpha > 0) {
            targetPortal = this.exitPortal;
        }

        // Only move if portal is visible
        if (targetPortal.alpha < 0.3) return;

        // Move bird horizontally toward portal
        const birdCenterX = this.bird.x + this.bird.width / 2;
        const portalX = targetPortal.x;

        if (birdCenterX < portalX - 20) {
            this.bird.x += this.birdHorizontalSpeed;
        }
    }

    _updateEntrySpawning(now) {
        const elapsed = now - this.entryPortal.spawnTime;
        const progress = Math.min(elapsed / this.entryPortal.spawnDuration, 1);

        // Ease out
        const ease = 1 - Math.pow(1 - progress, 3);
        this.entryPortal.radius = this.entryPortal.maxRadius * ease;
        this.entryPortal.alpha = ease;
        this.entryPortal.rotation += 0.05;

        // Spawn particles during formation
        if (Math.random() < 0.3) {
            this._spawnPortalParticle(this.entryPortal);
        }

        if (progress >= 1) {
            this.state = 'entry_open';
            this.portalOpenTime = now;
            console.log('Portal is open! You have 20 seconds!');
        }
    }

    _updateEntryOpen(now) {
        const elapsed = now - this.portalOpenTime;
        this.entryPortal.rotation += 0.06;

        // Pulse effect
        const pulse = Math.sin(now * 0.005) * 5;
        this.entryPortal.radius = this.entryPortal.maxRadius + pulse;

        // Spawn particles
        if (Math.random() < 0.4) {
            this._spawnPortalParticle(this.entryPortal);
        }

        // Check timeout
        if (elapsed >= this.portalDuration) {
            this._closePortal();
            return;
        }

        // Flash timer bar when < 5 seconds
        if (this.portalDuration - elapsed < 5000) {
            this.timerBarFlash = Math.sin(now * 0.015) * 0.5 + 0.5;
        }

        // Check bird collision with entry portal
        if (this._checkPortalCollision(this.entryPortal)) {
            this.state = 'transitioning_in';
            this.transition.startTime = now;
            this.transition.progress = 0;
            this.transition.type = 'in';
            this.birdMovingToPortal = false;
            this.needsClearPipes = true; // Signal to clear pipes
            console.log('Entering the portal!');
        }
    }

    _updateTransitionIn(now) {
        const elapsed = now - this.transition.startTime;
        this.transition.progress = Math.min(elapsed / this.transition.duration, 1);
        this.entryPortal.rotation += 0.15; // Spin faster during transition

        // Smoothly transition world
        this.worldTransition = this._easeInOut(this.transition.progress);

        if (this.transition.progress >= 1) {
            this.isNewWorld = true;
            this.worldTransition = 1;
            this.state = 'new_world';
            this.newWorldTime = now;

            // Reposition bird to left side for new world
            this.bird.x = 80;
            this.bird.y = this.canvas.height / 3;
            this.bird.velocity = 0;

            // Reset entry portal
            this.entryPortal.alpha = 0;
            this.entryPortal.radius = 0;
            this.entryPortal.particles = [];

            // Flash effect when entering new world
            this.flashAlpha = 1.0;

            console.log('Welcome to the new world! x2 score bonus! No pipes here!');
        }
    }

    _updateNewWorld(now) {
        // Spawn exit portal after 20 seconds in new world
        const elapsed = now - this.newWorldTime;

        if (elapsed >= this.newWorldDuration) {
            // Exit portal opens INSTANTLY - skip spawning animation
            this.exitPortal.x = this.canvas.width - 80; // Fixed X position
            this.exitPortal.y = this.canvas.height / 2; // Center Y
            this.exitPortal.radius = this.exitPortal.maxRadius; // Instantly full size
            this.exitPortal.alpha = 1; // Instantly visible
            this.exitPortal.rotation = 0;
            this.exitPortal.spawnTime = now;
            this.exitPortal.particles = [];
            this.birdMovingToPortal = true; // Start moving toward exit
            this.state = 'exit_open'; // Skip spawning, go directly to open
            
            // Flash and shake when exit portal appears
            this.flashAlpha = 0.6;
            this.needsScreenShake = true;
            
            console.log('Exit portal is open! Fly into it to return!');
        }
    }

    _updateExitSpawning(now) {
        const elapsed = now - this.exitPortal.spawnTime;
        const progress = Math.min(elapsed / this.exitPortal.spawnDuration, 1);

        // Ease out spawn
        const ease = 1 - Math.pow(1 - progress, 3);
        this.exitPortal.radius = this.exitPortal.maxRadius * ease;
        this.exitPortal.alpha = ease;
        this.exitPortal.rotation += 0.05;

        // Spawn particles
        if (Math.random() < 0.3) {
            this._spawnPortalParticle(this.exitPortal);
        }

        if (progress >= 1) {
            this.state = 'exit_open';
            console.log('Exit portal is open! Fly into it to return!');
        }
    }

    _updateExitOpen(now) {
        this.exitPortal.rotation += 0.06;

        // Pulse
        const pulse = Math.sin(now * 0.005) * 5;
        this.exitPortal.radius = this.exitPortal.maxRadius + pulse;

        // Particles
        if (Math.random() < 0.4) {
            this._spawnPortalParticle(this.exitPortal);
        }

        // Check bird collision with exit portal
        if (this._checkPortalCollision(this.exitPortal)) {
            this.state = 'transitioning_out';
            this.transition.startTime = now;
            this.transition.progress = 0;
            this.transition.type = 'out';
            this.birdMovingToPortal = false;
            this.needsClearPipes = true; // Signal to clear pipes when returning
            console.log('Returning to normal world!');
        }
    }

    _updateTransitionOut(now) {
        const elapsed = now - this.transition.startTime;
        this.transition.progress = Math.min(elapsed / this.transition.duration, 1);
        this.exitPortal.rotation += 0.15;

        // Reverse world transition
        this.worldTransition = 1 - this._easeInOut(this.transition.progress);

        if (this.transition.progress >= 1) {
            this.isNewWorld = false;
            this.worldTransition = 0;
            this.state = 'cooldown';

            // Reposition bird
            this.bird.x = this.canvas.width / 2 - this.bird.width / 2;
            this.bird.y = this.canvas.height / 3;
            this.bird.velocity = 0;

            // Reset portals
            this.entryPortal.alpha = 0;
            this.entryPortal.radius = 0;
            this.exitPortal.alpha = 0;
            this.exitPortal.radius = 0;
            this.entryPortal.particles = [];
            this.exitPortal.particles = [];

            // Start grace period - no pipes for a while after exiting
            this.justExited = true;
            this.exitTime = Date.now();

            // Flash effect when returning
            this.flashAlpha = 1.0;

            // Allow re-trigger after 30 more points
            this.triggerScore += 30;
            this.hasTriggered = false;

            console.log('Back to normal world! Grace period active. Next portal at score ' + this.triggerScore);
        }
    }

    _closePortal() {
        this.state = 'cooldown';
        this.entryPortal.alpha = 0;
        this.entryPortal.radius = 0;
        this.entryPortal.particles = [];
        this.birdMovingToPortal = false;

        // Allow re-trigger later
        this.triggerScore += 15;
        this.hasTriggered = false;

        console.log('Portal closed! Missed it. Next portal at score ' + this.triggerScore);
    }

    _checkPortalCollision(portal) {
        if (portal.alpha < 0.5) return false;

        const birdCX = this.bird.x + this.bird.width / 2;
        const birdCY = this.bird.y + this.bird.height / 2;
        const dx = birdCX - portal.x;
        const dy = birdCY - portal.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        return dist < portal.radius + 10;
    }

    _spawnPortalParticle(portal) {
        const angle = Math.random() * Math.PI * 2;
        const dist = portal.radius + 10 + Math.random() * 20;
        portal.particles.push({
            x: portal.x + Math.cos(angle) * dist,
            y: portal.y + Math.sin(angle) * dist,
            targetX: portal.x,
            targetY: portal.y,
            size: 2 + Math.random() * 4,
            alpha: 0.8,
            life: 40 + Math.random() * 20,
            maxLife: 60,
            color: this.portalColors[Math.floor(Math.random() * this.portalColors.length)],
            angle: angle,
            speed: 0.8 + Math.random() * 1.5
        });
    }

    _updatePortalParticles(portal) {
        for (let i = portal.particles.length - 1; i >= 0; i--) {
            const p = portal.particles[i];

            // Spiral toward center
            p.angle += 0.08;
            const currentDist = Math.sqrt(
                Math.pow(p.x - portal.x, 2) + Math.pow(p.y - portal.y, 2)
            );

            if (currentDist > 5) {
                const dx = portal.x - p.x;
                const dy = portal.y - p.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                p.x += (dx / len) * p.speed + Math.cos(p.angle) * 1.5;
                p.y += (dy / len) * p.speed + Math.sin(p.angle) * 1.5;
            }

            p.life--;
            p.alpha = (p.life / p.maxLife) * 0.8;
            p.size *= 0.98;

            if (p.life <= 0 || currentDist < 5) {
                portal.particles.splice(i, 1);
            }
        }
    }

    _updateShootingStars() {
        // Occasionally spawn shooting stars
        if (Math.random() < 0.008) {
            this.shootingStars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 200,
                vx: -3 - Math.random() * 4,
                vy: 1 + Math.random() * 2,
                length: 20 + Math.random() * 40,
                alpha: 1,
                life: 40
            });
        }

        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const s = this.shootingStars[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life--;
            s.alpha = s.life / 40;
            if (s.life <= 0) this.shootingStars.splice(i, 1);
        }
    }

    _updateFloatingOrbs() {
        // Spawn floating light orbs
        if (Math.random() < 0.02 && this.floatingOrbs.length < 8) {
            this.floatingOrbs.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height - 100),
                baseY: 0,
                radius: 3 + Math.random() * 5,
                alpha: 0,
                maxAlpha: 0.3 + Math.random() * 0.4,
                hue: Math.random() * 360,
                floatPhase: Math.random() * Math.PI * 2,
                floatSpeed: 0.01 + Math.random() * 0.02,
                life: 200 + Math.random() * 200
            });
            this.floatingOrbs[this.floatingOrbs.length - 1].baseY =
                this.floatingOrbs[this.floatingOrbs.length - 1].y;
        }

        for (let i = this.floatingOrbs.length - 1; i >= 0; i--) {
            const o = this.floatingOrbs[i];
            o.floatPhase += o.floatSpeed;
            o.y = o.baseY + Math.sin(o.floatPhase) * 15;
            o.life--;

            if (o.life > 180) {
                o.alpha = Math.min(o.maxAlpha, o.alpha + 0.02);
            } else if (o.life < 40) {
                o.alpha = Math.max(0, o.alpha - 0.01);
            }

            if (o.life <= 0) this.floatingOrbs.splice(i, 1);
        }
    }

    _easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // =================== DRAWING ===================

    draw() {
        const ctx = this.ctx;

        // Draw screen flash effect (always draw, even during cooldown)
        if (this.flashAlpha > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(139, 92, 246, ${this.flashAlpha})`; // Purple flash
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.restore();
        }

        if (this.state === 'inactive' || this.state === 'cooldown') return;

        // Draw transition overlay
        if (this.state === 'transitioning_in' || this.state === 'transitioning_out') {
            this._drawTransitionEffect(ctx);
        }

        // Draw entry portal
        if (this.entryPortal.alpha > 0) {
            this._drawPortal(ctx, this.entryPortal, 'ENTER');
        }

        // Draw exit portal
        if (this.exitPortal.alpha > 0) {
            this._drawPortal(ctx, this.exitPortal, 'EXIT');
        }

        // Draw timer bar when entry portal is open
        if (this.state === 'entry_open' || this.state === 'entry_spawning') {
            this._drawTimerBar(ctx);
        }

        // Draw countdown to exit portal in new world
        if (this.isNewWorld && this.state === 'new_world') {
            this._drawExitCountdown(ctx);
        }

        // Draw "NEW WORLD" indicator
        if (this.isNewWorld && this.state !== 'transitioning_out') {
            this._drawNewWorldIndicator(ctx);
        }
    }

    _drawPortal(ctx, portal, label) {
        ctx.save();
        ctx.globalAlpha = portal.alpha;

        // Draw particles behind portal
        for (const p of portal.particles) {
            ctx.globalAlpha = p.alpha * portal.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = portal.alpha;

        // Outer glow behind the sprite
        const glowRadius = portal.radius * 1.5;
        const glowGrad = ctx.createRadialGradient(
            portal.x, portal.y, portal.radius * 0.3,
            portal.x, portal.y, glowRadius
        );
        glowGrad.addColorStop(0, this.portalColors[0] + '50');
        glowGrad.addColorStop(0.5, this.portalColors[1] + '25');
        glowGrad.addColorStop(1, this.portalColors[0] + '00');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(portal.x, portal.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw portal sprite
        ctx.save();
        ctx.translate(portal.x, portal.y);
        ctx.rotate(portal.rotation);

        // Scale based on current radius
        const scale = (portal.radius / portal.maxRadius);
        const drawW = this.portalDrawSize * scale;
        const drawH = this.portalDrawSize * scale;

        if (this.spriteLoaded && this.portalSprite) {
            // Same sprite for both portals - no tint difference
            ctx.drawImage(
                this.portalSprite,
                this.spriteSrc.x, this.spriteSrc.y,
                this.spriteSrc.width, this.spriteSrc.height,
                -drawW / 2, -drawH / 2,
                drawW, drawH
            );
        } else {
            // Fallback: draw code portal if sprite not loaded
            this._drawFallbackPortal(ctx, portal);
        }

        ctx.restore();

        // Label below portal
        ctx.save();
        ctx.globalAlpha = portal.alpha;
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 2;
        const labelY = portal.y + (drawH / 2) + 16;
        ctx.strokeText(label, portal.x, labelY);
        ctx.fillText(label, portal.x, labelY);
        ctx.restore();

        ctx.restore();
    }

    _drawFallbackPortal(ctx, portal) {
        // Simple fallback if sprite fails to load
        const r = portal.radius * 0.6;
        const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        innerGrad.addColorStop(0, '#FFFFFF');
        innerGrad.addColorStop(0.3, this.portalColors[3] || this.portalColors[0]);
        innerGrad.addColorStop(0.7, this.portalColors[1]);
        innerGrad.addColorStop(1, this.portalColors[0] + '80');
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Spinning ring
        ctx.strokeStyle = this.portalColors[0];
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.lineDashOffset = -portal.rotation * 20;
        ctx.beginPath();
        ctx.arc(0, 0, portal.radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawTimerBar(ctx) {
        const elapsed = Date.now() - this.portalOpenTime;
        const remaining = Math.max(0, this.portalDuration - elapsed);
        const progress = remaining / this.portalDuration;

        const barWidth = this.canvas.width * 0.5;
        const barHeight = 8;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = 32;

        ctx.save();

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Fill with gradient
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * progress, barY);
        if (remaining < 5000) {
            // Flashing red when low
            const flash = this.timerBarFlash;
            gradient.addColorStop(0, `rgba(255, ${Math.floor(80 * flash)}, 0, 1)`);
            gradient.addColorStop(1, '#FF0000');
        } else {
            gradient.addColorStop(0, '#8B5CF6');
            gradient.addColorStop(1, '#A78BFA');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Border
        ctx.strokeStyle = '#C4B5FD';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Timer text
        const seconds = Math.ceil(remaining / 1000);
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('PORTAL ' + seconds + 's', this.canvas.width / 2, barY - 4);

        ctx.restore();
    }

    _drawExitCountdown(ctx) {
        const elapsed = Date.now() - this.newWorldTime;
        const remaining = Math.max(0, this.newWorldDuration - elapsed);
        const seconds = Math.ceil(remaining / 1000);

        ctx.save();
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#A78BFA';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        const text = 'EXIT PORTAL IN ' + seconds + 's';
        ctx.strokeText(text, this.canvas.width / 2, 50);
        ctx.fillText(text, this.canvas.width / 2, 50);
        ctx.restore();
    }

    _drawTransitionEffect(ctx) {
        ctx.save();
        const p = this.transition.progress;

        // Vortex wipe effect
        const portal = this.transition.type === 'in' ? this.entryPortal : this.exitPortal;
        const centerX = portal.x;
        const centerY = portal.y;

        // Expanding/contracting circle reveal
        const maxRadius = Math.sqrt(
            this.canvas.width * this.canvas.width + this.canvas.height * this.canvas.height
        );

        if (this.transition.type === 'in') {
            // Spiral wipe: new world expands from portal center
            const radius = maxRadius * this._easeInOut(p);

            // Draw new world background in the expanding circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.clip();

            this._drawNewWorldBackground(ctx);
        } else {
            // Normal world returns: shrink the new world
            const radius = maxRadius * (1 - this._easeInOut(p));

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.clip();

            this._drawNewWorldBackground(ctx);
        }

        // Flash effect at transition midpoint
        if (p > 0.4 && p < 0.6) {
            const flashAlpha = 1 - Math.abs(p - 0.5) / 0.1;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.6})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        ctx.restore();
    }

    _drawNewWorldIndicator(ctx) {
        ctx.save();

        const now = Date.now();
        const bounce = Math.sin(now * 0.003) * 3;

        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';

        // Glow effect
        ctx.shadowColor = '#A78BFA';
        ctx.shadowBlur = 10;

        ctx.fillStyle = '#C4B5FD';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;

        const text = 'NEW WORLD  x2 SCORE';
        ctx.strokeText(text, this.canvas.width / 2, 25 + bounce);
        ctx.fillText(text, this.canvas.width / 2, 25 + bounce);

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Draw the new world background (space theme)
    drawNewWorldBackground(ctx) {
        if (this.worldTransition <= 0) return;
        this._drawNewWorldBackground(ctx);
    }

    _drawNewWorldBackground(ctx) {
        ctx.save();

        // Dark space background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGrad.addColorStop(0, this.newWorldBgColor1);
        bgGrad.addColorStop(0.5, this.newWorldBgColor2);
        bgGrad.addColorStop(1, '#0D0628');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Stars
        const now = Date.now();
        for (const star of this.stars) {
            const twinkle = 0.3 + (Math.sin(now * star.twinkleSpeed + star.twinkleOffset) + 1) * 0.35;
            ctx.globalAlpha = twinkle * star.brightness;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shooting stars
        ctx.globalAlpha = 1;
        for (const s of this.shootingStars) {
            ctx.globalAlpha = s.alpha;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * (s.length / 3), s.y - s.vy * (s.length / 3));
            ctx.stroke();
        }

        // Floating orbs
        for (const o of this.floatingOrbs) {
            ctx.globalAlpha = o.alpha;
            const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius * 2);
            orbGrad.addColorStop(0, `hsla(${o.hue}, 80%, 70%, 0.6)`);
            orbGrad.addColorStop(1, `hsla(${o.hue}, 80%, 50%, 0)`);
            ctx.fillStyle = orbGrad;
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nebula glow at bottom
        ctx.globalAlpha = 0.15;
        const nebulaGrad = ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height - 100, 20,
            this.canvas.width / 2, this.canvas.height - 100, 250
        );
        nebulaGrad.addColorStop(0, '#8B5CF6');
        nebulaGrad.addColorStop(0.4, '#6D28D9');
        nebulaGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // Draw new-world styled ground
    drawNewWorldGround(ctx, groundY) {
        // Alien ground
        const gradient = ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
        gradient.addColorStop(0, '#2D1B69');
        gradient.addColorStop(0.3, '#1A0F40');
        gradient.addColorStop(1, '#0D0628');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);

        // Glowing top edge
        ctx.strokeStyle = '#A78BFA';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#8B5CF6';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(this.canvas.width, groundY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Crystal formations on ground
        const now = Date.now();
        for (let x = 10; x < this.canvas.width; x += 35) {
            const h = 10 + Math.sin(x * 0.1 + now * 0.001) * 5;
            const glow = 0.3 + Math.sin(now * 0.003 + x * 0.05) * 0.2;
            ctx.globalAlpha = glow;
            ctx.fillStyle = '#7C3AED';
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(x + 5, groundY - h);
            ctx.lineTo(x + 10, groundY);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    isInNewWorld() {
        return this.isNewWorld;
    }

    getScoreMultiplier() {
        return this.isNewWorld ? this.bonusMultiplier : 1;
    }

    isTransitioning() {
        return this.state === 'transitioning_in' || this.state === 'transitioning_out';
    }

    reset() {
        this.state = 'inactive';
        this.hasTriggered = false;
        this.triggerScore = 5;
        this.isNewWorld = false;
        this.worldTransition = 0;
        this.birdMovingToPortal = false;
        this.justExited = false;
        this.exitTime = 0;
        this.needsClearPipes = false;
        this.flashAlpha = 0;
        this.needsScreenShake = false;
        this.entryPortal.alpha = 0;
        this.entryPortal.radius = 0;
        this.entryPortal.particles = [];
        this.exitPortal.alpha = 0;
        this.exitPortal.radius = 0;
        this.exitPortal.particles = [];
        this.shootingStars = [];
        this.floatingOrbs = [];
        this.timerBarFlash = 0;
        this.transition.progress = 0;
    }
}

const portalSystem = new PortalSystem();
