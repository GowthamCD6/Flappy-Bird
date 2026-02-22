class PortalSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.bird = null;

        // Portal states: inactive, entry_spawning, entry_open, transitioning_in,
        //                new_world, exit_spawning, exit_open, transitioning_out, cooldown
        this.state = 'inactive';
        this.triggerScore = 30;
        this.portalDuration = 20000; // 20 seconds to enter
        this.portalOpenTime = 0;
        this.hasTriggered = false;

        // Entry portal - FIXED position
        this.entryPortal = {
            x: 0, y: 0,
            radius: 0, maxRadius: 60,
            rotation: 0,
            particles: [],
            alpha: 0,
            spawnTime: 0,
            spawnDuration: 400 // Fast 0.4s pop open
        };

        // Exit portal (in new world)
        this.exitPortal = {
            x: 0, y: 0,
            radius: 0, maxRadius: 50,
            rotation: 0,
            particles: [],
            alpha: 0,
            spawnTime: 0,
            spawnDuration: 400 // Fast 0.4s pop open
        };

        // Transition effect
        this.transition = {
            progress: 0,
            duration: 1200,
            startTime: 0,
            type: 'in' // 'in' or 'out'
        };

        // Suck-in/Release animation for bird
        this.suckInAnimation = {
            active: false,
            progress: 0,
            duration: 1500, // 1.5 seconds for smooth absorption
            startTime: 0,
            startX: 0,
            startY: 0,
            targetX: 0,
            targetY: 0,
            startScale: 1,
            type: 'in', // 'in' or 'out'
            // Spiral motion properties
            spiralAngle: 0,
            spiralRadius: 0,
            // Visual effects
            portalGlow: 0,
            vortexParticles: [],
            screenDarken: 0
        };

        // Invincibility after exiting portal
        this.invincibilityDuration = 3000; // 3 seconds invincibility
        this.invincibilityTime = 0;
        this.isInvincible = false;

        // Autopilot during invincibility period
        this.autopilotActive = false;
        this.autopilotTargetY = 0;
        this.autopilotFlapCooldown = 0;
        this.autopilotLastFlapTime = 0;

        // New world properties
        this.isNewWorld = false;
        this.worldTransition = 0; // 0 = normal, 1 = new world
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
      

        // Space background sprite
        this.spaceLoaded = false;
        this.spaceSprite = new Image();
        this.spaceSprite.onload = () => {
            this.spaceLoaded = true;
            console.log('Space background sprite loaded!');
        };
        this.spaceSprite.onerror = () => {
            console.log('Space sprite not found, using fallback');
        };
        this.spaceSprite.src = 'assets/images/space.jpg';

        // Space background scrolling for parallax effect
        this.spaceScrollX = 0;
        this.spaceScrollSpeed = 0.5; // Pixels per frame - smooth scrolling
    }

    init(bird, canvas) {
        this.bird = bird;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Pre-load portal position so it's ready instantly
        this._preloadPortal();
    }
    
    // Pre-load portal at game start - no lag when it appears
    _preloadPortal() {
        if (!this.canvas) return;
        
        // Pre-set entry portal position (hidden but ready)
        this.entryPortal.x = this.canvas.width - 80;
        this.entryPortal.y = this.canvas.height / 2;
        this.entryPortal.radius = this.entryPortal.maxRadius;
        this.entryPortal.alpha = 0; // Hidden until triggered
        this.entryPortal.rotation = 0;
        this.entryPortal.particles = [];
        
        // Pre-generate some particles so they're ready
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = this.entryPortal.maxRadius + 10 + Math.random() * 20;
            this.entryPortal.particles.push({
                x: this.entryPortal.x + Math.cos(angle) * dist,
                y: this.entryPortal.y + Math.sin(angle) * dist,
                targetX: this.entryPortal.x,
                targetY: this.entryPortal.y,
                size: 2 + Math.random() * 4,
                alpha: 0, // Hidden
                life: 40 + Math.random() * 20,
                maxLife: 60,
                color: this.portalColors[Math.floor(Math.random() * this.portalColors.length)],
                angle: angle,
                speed: 0.8 + Math.random() * 1.5
            });
        }
        
        console.log('Portal pre-loaded and ready!');
    }

    canTrigger(score) {
        return !this.hasTriggered && score >= this.triggerScore && this.state === 'inactive';
    }

    trigger() {
        if (this.state !== 'inactive') return;

        // Portal appears INSTANTLY - already pre-loaded!
        this.state = 'entry_open';
        this.portalOpenTime = Date.now();

        // Portal is already positioned from preload, just show it
        this.entryPortal.alpha = 1; // Instantly visible
        this.entryPortal.radius = this.entryPortal.maxRadius;
        
        // Activate particles
        for (const p of this.entryPortal.particles) {
            p.alpha = 0.8;
        }

        this.hasTriggered = true;
        this.birdMovingToPortal = true; // Start moving immediately

        // Flash effect for instant appearance
        this.flashAlpha = 0.5;
        this.needsScreenShake = true;
        this.screenShakeIntensity = 5;
        this.screenShakeDuration = 150;

        console.log('Portal is spawning...');
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
       // Update release animation if active
       this._updateReleaseAnimation();

       //Update invincibility status
       this.checkInvincibility();
      
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
    }

    _moveBirdTowardPortal() {
        if (!this.bird) return;

        // Determine target portal
        let targetPortal = this.entryPortal;
        if (this.isNewWorld && this.exitPortal.alpha > 0) {
            targetPortal = this.exitPortal;
        }

        // Only move if portal is visible enough
        if (targetPortal.alpha < 0.4) return;

        // Move bird horizontally toward portal with smooth acceleration
        const birdCenterX = this.bird.x + this.bird.width / 2;
        const portalX = targetPortal.x;
        const distance = portalX - birdCenterX;

        if (distance > 20) {
            // Smooth movement - faster when far, slower when close
            const speed = Math.min(this.birdHorizontalSpeed, distance * 0.02 + 0.5);
            this.bird.x += speed;
        }
    }

    _updateEntrySpawning(now) {
        const elapsed = now - this.entryPortal.spawnTime;
        const progress = Math.min(elapsed / this.entryPortal.spawnDuration, 1);

        // Elastic ease-out for snappy "pop" effect
        const ease = progress < 1 
            ? 1 - Math.pow(2, -10 * progress) * Math.cos(progress * Math.PI * 2) * (1 - progress)
            : 1;
        
        // Overshoot then settle for bouncy feel
        let sizeMultiplier = ease;
        if (progress > 0.3 && progress < 0.7) {
            sizeMultiplier = ease * (1 + Math.sin((progress - 0.3) * Math.PI / 0.4) * 0.15);
        }
        
        this.entryPortal.radius = this.entryPortal.maxRadius * Math.min(sizeMultiplier, 1.1);
        this.entryPortal.alpha = Math.min(ease * 1.2, 1);
        this.entryPortal.rotation += 0.08 + (progress * 0.04); // Quick spin

        // Burst of particles at start
        if (progress < 0.3) {
            // Spawn multiple particles in burst
            for (let i = 0; i < 3; i++) {
                if (Math.random() < 0.6) {
                    this._spawnPortalParticle(this.entryPortal);
                }
            }
        } else if (Math.random() < 0.3) {
            this._spawnPortalParticle(this.entryPortal);
        }

        // Allow bird movement immediately
        if (progress >= 0.2 && !this.birdMovingToPortal) {
            this.birdMovingToPortal = true;
        }

        if (progress >= 1) {
            this.state = 'entry_open';
            this.portalOpenTime = now;
            this.entryPortal.radius = this.entryPortal.maxRadius; // Normalize size
            this.flashAlpha = 0;
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
        if (this._checkPortalCollision(this.entryPortal) && !this.suckInAnimation.active) {
            // Start suck-in animation
            this.suckInAnimation.active = true;
            this.suckInAnimation.progress = 0;
            this.suckInAnimation.startTime = now;
            this.suckInAnimation.startX = this.bird.x;
            this.suckInAnimation.startY = this.bird.y;
            this.suckInAnimation.targetX = this.entryPortal.x - this.bird.width / 2;
            this.suckInAnimation.targetY = this.entryPortal.y - this.bird.height / 2;
            this.suckInAnimation.startScale = 1;
            this.suckInAnimation.type = 'in';
            this.suckInAnimation.spiralAngle = Math.atan2(
                this.bird.y - this.entryPortal.y,
                this.bird.x - this.entryPortal.x
            );
            this.suckInAnimation.spiralRadius = Math.sqrt(
                Math.pow(this.bird.x - this.entryPortal.x + this.bird.width / 2, 2) +
                Math.pow(this.bird.y - this.entryPortal.y + this.bird.height / 2, 2)
            );
            this.suckInAnimation.vortexParticles = [];
            this.suckInAnimation.screenDarken = 0;
            this.suckInAnimation.portalGlow = 0;
            this.birdMovingToPortal = false;
            this.needsClearPipes = true; // Signal to clear pipes
         
            // Initialize bird portal animation properties
            this.bird.portalRotation = 0;
            this.bird.portalStretchX = 1;
            this.bird.portalStretchY = 1;

            console.log('Being sucked into the portal!');
        }

        // Update suck-in animation
        if (this.suckInAnimation.active && this.suckInAnimation.type === 'in') {
            this._updateSuckInAnimation(now);
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

            // Reposition bird to CENTER for new world
            this.bird.x = this.canvas.width / 2 - this.bird.width / 2;
            this.bird.y = this.canvas.height / 3;
            this.bird.velocity = 0;

            // Start release animation - bird appears from center and expands
            this._startReleaseAnimation();

            // Reset entry portal
            this.entryPortal.alpha = 0;
            this.entryPortal.radius = 0;
            this.entryPortal.particles = [];

            // No purple flash - just white flash from transition effect is enough
            // this.flashAlpha = 0.8;

            console.log('Welcome to the new world! x2 score bonus! No pipes here!');
        }
    }

    _updateNewWorld(now) {
        // Spawn exit portal after 20 seconds in new world
        const elapsed = now - this.newWorldTime;

        if (elapsed >= this.newWorldDuration) {
            // Exit portal appears INSTANTLY - fully formed
            this.exitPortal.x = this.canvas.width - 80; // Fixed X position
            this.exitPortal.y = this.canvas.height / 2; // Center Y
            this.exitPortal.radius = this.exitPortal.maxRadius; // INSTANT full size
            this.exitPortal.alpha = 1; // INSTANT full visibility
            this.exitPortal.rotation = 0;
            this.exitPortal.spawnTime = now;
            this.exitPortal.particles = [];
            this.birdMovingToPortal = true; // Start moving toward exit
            this.state = 'exit_open'; // Skip spawning, directly open
            
            // NO flash effect
            
            console.log('Exit portal is open! Fly into it to return!');
        }
    }

    _updateExitSpawning(now) {
        const elapsed = now - this.exitPortal.spawnTime;
        const progress = Math.min(elapsed / this.exitPortal.spawnDuration, 1);

        // Elastic ease-out for snappy "pop" effect
        const ease = progress < 1 
            ? 1 - Math.pow(2, -10 * progress) * Math.cos(progress * Math.PI * 2) * (1 - progress)
            : 1;
        
        // Overshoot then settle
        let sizeMultiplier = ease;
        if (progress > 0.3 && progress < 0.7) {
            sizeMultiplier = ease * (1 + Math.sin((progress - 0.3) * Math.PI / 0.4) * 0.15);
        }
        
        this.exitPortal.radius = this.exitPortal.maxRadius * Math.min(sizeMultiplier, 1.1);
        this.exitPortal.alpha = Math.min(ease * 1.2, 1);
        this.exitPortal.rotation += 0.08 + (progress * 0.04);

        // Burst of particles at start
        if (progress < 0.3) {
            for (let i = 0; i < 3; i++) {
                if (Math.random() < 0.6) {
                    this._spawnPortalParticle(this.exitPortal);
                }
            }
        } else if (Math.random() < 0.3) {
            this._spawnPortalParticle(this.exitPortal);
        }

        if (progress >= 1) {
            this.state = 'exit_open';
            this.exitPortal.radius = this.exitPortal.maxRadius;
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
        if (this._checkPortalCollision(this.exitPortal) && !this.suckInAnimation.active) {
            // Start suck-in animation for exit
            this.suckInAnimation.active = true;
            this.suckInAnimation.progress = 0;
            this.suckInAnimation.startTime = now;
            this.suckInAnimation.startX = this.bird.x;
            this.suckInAnimation.startY = this.bird.y;
            this.suckInAnimation.targetX = this.exitPortal.x - this.bird.width / 2;
            this.suckInAnimation.targetY = this.exitPortal.y - this.bird.height / 2;
            this.suckInAnimation.startScale = 1;
            this.suckInAnimation.type = 'out';
            this.suckInAnimation.spiralAngle = Math.atan2(
                this.bird.y - this.exitPortal.y,
                this.bird.x - this.exitPortal.x
            );
            this.suckInAnimation.spiralRadius = Math.sqrt(
                Math.pow(this.bird.x - this.exitPortal.x + this.bird.width / 2, 2) +
                Math.pow(this.bird.y - this.exitPortal.y + this.bird.height / 2, 2)
            );
            this.suckInAnimation.vortexParticles = [];
            this.suckInAnimation.screenDarken = 0;
            this.suckInAnimation.portalGlow = 0;
            this.birdMovingToPortal = false;
            this.needsClearPipes = true; // Signal to clear pipes when returning
            
            // Initialize bird portal animation properties
            this.bird.portalRotation = 0;
            this.bird.portalStretchX = 1;
            this.bird.portalStretchY = 1;

            console.log('Being sucked into the exit portal!');
        }

        // Update suck-in animation for exit
        if (this.suckInAnimation.active && this.suckInAnimation.type === 'out') {
            this._updateSuckInAnimation(now);
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

            // Reposition bird to CENTER
            this.bird.x = this.canvas.width / 2 - this.bird.width / 2;
            this.bird.y = this.canvas.height / 3;
            this.bird.velocity = 0;

            // Start release animation - bird appears from center and expands
            this._startReleaseAnimation();

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

           // Start invinciblity period for adaptation
           this.isInvincible = true;
           this.invincibilityTime = Date.now();

           // Start autopilot mode during invincibility
           this.autopilotActive = true;
           this.autopilotTargetY = this.canvas.height / 2; // Keep bird centered
           this.autopilotLastFlapTime = Date.now();

           //No purple flash
           // this.flashAlpha= 0.8

            // Allow re-trigger after 30 more points
            this.triggerScore += 30;
            this.hasTriggered = false;

            console.log('Back to normal world! Invincibility active! Next portal at score ' + this.triggerScore);
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

        // Larger capture radius - bird gets sucked in when it gets close
        return dist < portal.radius + 45;
    }

    _spawnPortalParticle(portal) {
        // Limit particles to avoid performance issues
        if (portal.particles.length >= 20) return;
        
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

    _easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    _updateSuckInAnimation(now) {
        const elapsed = now - this.suckInAnimation.startTime;
        this.suckInAnimation.progress = Math.min(elapsed / this.suckInAnimation.duration, 1);
        const t = this.suckInAnimation.progress;

        // Get target portal
        const portal = this.suckInAnimation.type === 'in' ? this.entryPortal : this.exitPortal;

        // Smooth easing functions for natural absorption
        // Using smooth ease-in-out for position, ease-in for scale (speeds up as it gets closer)
        const smoothEaseInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const smoothEaseIn = t => t * t * t; // Cubic ease-in for acceleration
        const gentleEase = t => 1 - Math.pow(1 - t, 2); // Soft ease-out

        // Smooth position progress - bird moves toward portal center smoothly
        const positionProgress = smoothEaseIn(t); // Accelerates as it gets closer - like being sucked in
        
        // Smooth scale progress - gradual shrinking that speeds up near the end
        const scaleProgress = smoothEaseInOut(t);
        
        // Gentle spiral motion - smooth and subtle
        const spiralSpeed = 0.015 + t * 0.02; // Slower spiral speed for smoother feel
        this.suckInAnimation.spiralAngle += spiralSpeed;
        
        // The spiral gets tighter as the bird approaches (radius decreases smoothly)
        const startRadius = this.suckInAnimation.spiralRadius * 0.5; // Reduced spiral radius
        const currentRadius = startRadius * (1 - positionProgress);
        
        // Calculate smooth position with gentle spiral
        const targetX = portal.x - this.bird.width / 2;
        const targetY = portal.y - this.bird.height / 2;
        const startX = this.suckInAnimation.startX;
        const startY = this.suckInAnimation.startY;
        
        // Smooth interpolation toward center with subtle spiral orbit
        const spiralOffsetX = Math.cos(this.suckInAnimation.spiralAngle) * currentRadius;
        const spiralOffsetY = Math.sin(this.suckInAnimation.spiralAngle) * currentRadius;
        
        // Bird moves from start position toward portal center with diminishing spiral
        this.bird.x = startX + (targetX - startX) * positionProgress + spiralOffsetX;
        this.bird.y = startY + (targetY - startY) * positionProgress + spiralOffsetY;

        // Smooth scale reduction - original size to small (1.0 to 0.05)
        // Starts slow, accelerates in middle, slows at end
        this.bird.suckScale = 1 - (scaleProgress * 0.9); // Scale from 1 to 0.1

        // Gentle, smooth rotation - bird spins slowly and consistently
        const rotationSpeed = 1.5 + t * 1.5; // 1.5 to 3 degrees per frame - gentle spin
        this.bird.portalRotation = (this.bird.portalRotation || 0) + rotationSpeed;

        // Subtle stretch effect - only near the end
        const stretchProgress = t > 0.6 ? gentleEase((t - 0.6) / 0.4) : 0;
        const angleToPortal = Math.atan2(
            portal.y - (this.bird.y + this.bird.height / 2),
            portal.x - (this.bird.x + this.bird.width / 2)
        );
        this.bird.portalStretchX = 1 + stretchProgress * 0.3 * Math.abs(Math.cos(angleToPortal));
        this.bird.portalStretchY = 1 - stretchProgress * 0.2 * Math.abs(Math.cos(angleToPortal));

        // Screen effects - gentle darkening
        this.suckInAnimation.screenDarken = smoothEaseIn(t) * 0.3;
        this.suckInAnimation.portalGlow = smoothEaseIn(t);

        // Disable bird physics
        this.bird.velocity = 0;

        // Spawn vortex particles (subtle)
        if (Math.random() < 0.2 + t * 0.3) {
            this._spawnVortexParticle(portal);
        }

        // Update vortex particles
        this._updateVortexParticles(portal);

        // Portal rotation - smooth acceleration
        portal.rotation += 0.05 + t * 0.1;

        // When suck-in complete, start transition
        if (this.suckInAnimation.progress >= 1) {
            this.suckInAnimation.active = false;
            this.bird.suckScale = 1;
            this.bird.portalRotation = 0;
            this.bird.portalStretchX = 1;
            this.bird.portalStretchY = 1;
            this.suckInAnimation.vortexParticles = [];

            if (this.suckInAnimation.type === 'in') {
                this.state = 'transitioning_in';
                this.transition.startTime = now;
                this.transition.progress = 0;
                this.transition.type = 'in';
                // No purple flash
                console.log('Entering the portal!');
            } else {
                this.state = 'transitioning_out';
                this.transition.startTime = now;
                this.transition.progress = 0;
                this.transition.type = 'out';
                // No purple flash
                console.log('Returning to normal world!');
            }
        }
    }

    _spawnVortexParticle(portal) {
        // Limit vortex particles to avoid performance issues
        if (this.suckInAnimation.vortexParticles.length >= 30) return;
        
        const angle = Math.random() * Math.PI * 2;
        const dist = portal.radius + 30 + Math.random() * 60;
        this.suckInAnimation.vortexParticles.push({
            x: portal.x + Math.cos(angle) * dist,
            y: portal.y + Math.sin(angle) * dist,
            angle: angle,
            dist: dist,
            size: 2 + Math.random() * 6,
            alpha: 0.8 + Math.random() * 0.2,
            speed: 3 + Math.random() * 4,
            rotationSpeed: 0.1 + Math.random() * 0.15,
            color: this.portalColors[Math.floor(Math.random() * this.portalColors.length)],
            life: 1
        });
    }

    _updateVortexParticles(portal) {
        for (let i = this.suckInAnimation.vortexParticles.length - 1; i >= 0; i--) {
            const p = this.suckInAnimation.vortexParticles[i];
            
            // Spiral toward center
            p.angle += p.rotationSpeed;
            p.dist -= p.speed;
            
            p.x = portal.x + Math.cos(p.angle) * p.dist;
            p.y = portal.y + Math.sin(p.angle) * p.dist;
            
            // Fade and shrink as approaching center
            p.life = p.dist / 100;
            p.alpha = p.life * 0.8;
            p.size *= 0.98;
            
            if (p.dist < 5 || p.alpha < 0.05) {
                this.suckInAnimation.vortexParticles.splice(i, 1);
            }
        }
    }

    _startReleaseAnimation() {
        // The bird will have a smooth release/expansion effect
        this.bird.releaseAnimation = {
            active: true,
            progress: 0,
            startTime: Date.now(),
            duration: 600 // 0.6 seconds release
        };
        this.bird.suckScale = 0.3; // Start small
    }

    // Call this in update to handle release animation
    _updateReleaseAnimation() {
        if (!this.bird.releaseAnimation || !this.bird.releaseAnimation.active) return;

        const elapsed = Date.now() - this.bird.releaseAnimation.startTime;
        const progress = Math.min(elapsed / this.bird.releaseAnimation.duration, 1);

        // Elastic ease-out for bouncy release
        const ease = 1 - Math.pow(1 - progress, 3);

        // Scale bird from small to normal
        this.bird.suckScale = 0.3 + (0.7 * ease);

        // Add slight bounce overshoot
        if (progress > 0.7) {
            const bounceProgress = (progress - 0.7) / 0.3;
            const bounce = Math.sin(bounceProgress * Math.PI) * 0.1;
            this.bird.suckScale = Math.min(1.1, this.bird.suckScale + bounce);
        }

        if (progress >= 1) {
            this.bird.releaseAnimation.active = false;
            this.bird.suckScale = 1;
        }
    }

    // Check if bird is currently invincible
    checkInvincibility() {
        if (!this.isInvincible) return false;

        const elapsed = Date.now() - this.invincibilityTime;
        if (elapsed >= this.invincibilityDuration) {
            this.isInvincible = false;
            this.autopilotActive = false; // End autopilot when invincibility ends
            return false;
        }
        return true;
    }

    // Update autopilot - keeps bird flying straight at stable height
    updateAutopilot() {
        if (!this.autopilotActive || !this.bird) return false;

        const canvasHeight = this.canvas.height;
        
        // Target is slightly above center for comfortable viewing
        const targetY = canvasHeight * 0.4;
        
        // Smoothly move bird to target Y position (straight flight)
        const currentY = this.bird.y;
        const diff = targetY - currentY;
        
        // Gradually adjust position for smooth straight flight
        if (Math.abs(diff) > 2) {
            // Move toward target smoothly
            this.bird.y += diff * 0.05;
        }
        
        // Keep velocity at 0 for straight flight (no gravity effect)
        this.bird.velocity = 0;
        
        // Keep bird level (no rotation)
        this.bird.rotation = 0;
        
        return true; // Autopilot is active
    }

    // Break autopilot when user taps
    breakAutopilot() {
        if (this.autopilotActive) {
            this.autopilotActive = false;
            console.log('Autopilot disengaged - manual control active');
            return true;
        }
        return false;
    }

    // Check if autopilot is currently active
    isAutopilotActive() {
        return this.autopilotActive;
    }

    // Get invincibility flash alpha for visual feedback
    getInvincibilityAlpha() {
        if (!this.isInvincible) return 1;
        const elapsed = Date.now() - this.invincibilityTime;
        // Flashing effect - faster near the end
        const remaining = this.invincibilityDuration - elapsed;
        const flashSpeed = remaining < 1000 ? 0.02 : 0.01;
        return 0.5 + Math.sin(elapsed * flashSpeed) * 0.5;
    }

    _drawInvincibilityIndicator(ctx) {
        const elapsed = Date.now() - this.invincibilityTime;
        const remaining = Math.max(0, this.invincibilityDuration - elapsed);
        const seconds = Math.ceil(remaining / 1000);

        ctx.save();

        // Pulsing text effect
        const pulse = Math.sin(elapsed * 0.01) * 0.2 + 0.8;

        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';

        // Glow effect
        ctx.shadowColor = '#10B981'; // Green glow
        ctx.shadowBlur = 8 * pulse;

        ctx.fillStyle = '#34D399'; // Emerald green
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;

        const text = 'PROTECTED ' + seconds + 's';
        const y = 70;
        ctx.strokeText(text, this.canvas.width / 2, y);
        ctx.fillText(text, this.canvas.width / 2, y);

        // Draw autopilot indicator if active
        if (this.autopilotActive) {
            ctx.font = 'bold 10px Arial';
            ctx.shadowColor = '#3B82F6'; // Blue glow
            ctx.shadowBlur = 6 * pulse;
            ctx.fillStyle = '#60A5FA'; // Light blue
            const autopilotText = '✈ AUTOPILOT (tap to control)';
            ctx.strokeText(autopilotText, this.canvas.width / 2, y + 16);
            ctx.fillText(autopilotText, this.canvas.width / 2, y + 16);
        }

        // Draw progress bar for invincibility
        const barWidth = 80;
        const barHeight = 4;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = this.autopilotActive ? y + 24 : y + 8;
        const progress = remaining / this.invincibilityDuration;

        // Bar background
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Bar fill
        ctx.fillStyle = '#34D399';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        ctx.restore();
    }

    draw() {
        const ctx = this.ctx;

        // Draw screen darkening during suck-in animation
        // Screen darken effect during suck-in (keep this - it's subtle)
        if (this.suckInAnimation.active && this.suckInAnimation.screenDarken > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${this.suckInAnimation.screenDarken})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.restore();
        }

        // Purple flash removed - no longer drawing it

        // Draw invincibility indicator (always, even during cooldown)
        if (this.isInvincible) {
            this._drawInvincibilityIndicator(ctx);
        }

        if (this.state === 'inactive' || this.state === 'cooldown') return;

        // Draw vortex particles during suck-in
        if (this.suckInAnimation.active && this.suckInAnimation.vortexParticles.length > 0) {
            this._drawVortexParticles(ctx);
        }

        if (this.state === 'transitioning_in' || this.state === 'transitioning_out') {
            this._drawTransitionEffect(ctx);
        }

        if (this.entryPortal.alpha > 0) {
            const extraGlow = (this.suckInAnimation.active && this.suckInAnimation.type === 'in') 
                ? this.suckInAnimation.portalGlow : 0;
            this._drawPortal(ctx, this.entryPortal, 'ENTER', extraGlow);
        }

        // Draw exit portal (with extra glow during suck-in)
        if (this.exitPortal.alpha > 0) {
            const extraGlow = (this.suckInAnimation.active && this.suckInAnimation.type === 'out') 
                ? this.suckInAnimation.portalGlow : 0;
            this._drawPortal(ctx, this.exitPortal, 'EXIT', extraGlow);
        }

        // Draw timer bar when entry portal is open
        if (this.state === 'entry_open' || this.state === 'entry_spawning') {
            this._drawTimerBar(ctx);
        }

        // Draw countdown to exit portal in new world
        if (this.isNewWorld && this.state === 'new_world') {
            this._drawExitCountdown(ctx);
        }
    }

    _drawVortexParticles(ctx) {
        ctx.save();
        for (const p of this.suckInAnimation.vortexParticles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            
            // Draw particle with trail effect
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw motion trail
            const trailLength = p.speed * 3;
            const trailAngle = p.angle + Math.PI; // Opposite direction
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size * 0.6;
            ctx.globalAlpha = p.alpha * 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(
                p.x + Math.cos(trailAngle) * trailLength,
                p.y + Math.sin(trailAngle) * trailLength
            );
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawPortal(ctx, portal, label, extraGlow = 0) {
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

        // Outer glow behind the sprite (enhanced during suck-in)
        const glowRadius = portal.radius * (1.5 + extraGlow * 0.8);
        const glowIntensity = Math.min(1, 0.3 + extraGlow * 0.7);
        const glowGrad = ctx.createRadialGradient(
            portal.x, portal.y, portal.radius * 0.3,
            portal.x, portal.y, glowRadius
        );
        glowGrad.addColorStop(0, this.portalColors[0] + (extraGlow > 0 ? 'AA' : '50'));
        glowGrad.addColorStop(0.5, this.portalColors[1] + (extraGlow > 0 ? '66' : '25'));
        glowGrad.addColorStop(1, this.portalColors[0] + '00');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(portal.x, portal.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw extra pulsing rings during suck-in
        if (extraGlow > 0) {
            const numRings = 3;
            for (let i = 0; i < numRings; i++) {
                const ringProgress = ((Date.now() * 0.003) + i / numRings) % 1;
                const ringRadius = portal.radius * (0.5 + ringProgress * 1.5);
                const ringAlpha = (1 - ringProgress) * extraGlow * 0.6;
                
                ctx.strokeStyle = this.portalColors[i % this.portalColors.length];
                ctx.lineWidth = 2 + (1 - ringProgress) * 3;
                ctx.globalAlpha = ringAlpha;
                ctx.beginPath();
                ctx.arc(portal.x, portal.y, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = portal.alpha;
        }

        // Draw portal sprite
        ctx.save();
        ctx.translate(portal.x, portal.y);
        ctx.rotate(portal.rotation);

        // Scale based on current radius (slightly larger during suck-in)
        const scale = (portal.radius / portal.maxRadius) * (1 + extraGlow * 0.2);
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

        // Draw space sprite as scrolling background with seamless loop
        if (this.spaceLoaded && this.spaceSprite) {
            const img = this.spaceSprite;
            const canvasW = this.canvas.width;
            const canvasH = this.canvas.height;
            const imgW = img.naturalWidth || img.width;
            const imgH = img.naturalHeight || img.height;

            // Calculate scale to cover entire canvas height while maintaining aspect ratio
            const scaleY = canvasH / imgH;
            const scale = scaleY; // Scale based on height to maintain proper look
            
            // Calculate dimensions
            const drawW = imgW * scale;
            const drawH = imgH * scale;
            
            // Update scroll position for smooth parallax movement
            this.spaceScrollX += this.spaceScrollSpeed;
            
            // Reset scroll when it exceeds image width (seamless loop)
            if (this.spaceScrollX >= drawW) {
                this.spaceScrollX = 0;
            }
            
            // Calculate starting X position (negative for scrolling effect)
            const startX = -this.spaceScrollX;
            
            // Draw the image multiple times to create seamless loop
            // We need at least 2 copies side by side to cover the screen
            for (let x = startX; x < canvasW; x += drawW) {
                ctx.drawImage(
                    this.spaceSprite,
                    x, 0,
                    drawW, drawH
                );
            }
        } else {
            // Fallback: simple dark gradient if sprite not loaded
            const bgGrad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            bgGrad.addColorStop(0, '#0F0A2E');
            bgGrad.addColorStop(0.5, '#1A1145');
            bgGrad.addColorStop(1, '#0D0628');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

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
        this.triggerScore = 30;
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
        this.timerBarFlash = 0;
        this.transition.progress = 0;
        
        // Reset space background scroll
        this.spaceScrollX = 0;
        
        // Reset new animation properties
        this.suckInAnimation.active = false;
        this.suckInAnimation.progress = 0;
        this.isInvincible = false;
        this.invincibilityTime = 0;
        
        // Reset autopilot
        this.autopilotActive = false;
        this.autopilotLastFlapTime = 0;
        
        // Reset bird scale if bird exists
        if (this.bird) {
            this.bird.suckScale = 1;
            this.bird.releaseAnimation = null;
        }
        
        // Pre-load portal for next game - ready instantly!
        this._preloadPortal();
    }

    // Check if bird is being sucked in (for game.js to disable controls)
    isSuckingIn() {
        return this.suckInAnimation.active;
    }
}

const portalSystem = new PortalSystem();