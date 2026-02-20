class Bird {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.width = 40;
        this.height = 30;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height / 3.1;

        this.velocity = 0;
        this.gravity = 0.15;
        this.jumpStrength = -4.5;

        this.rotation = 0;

        this.spriteLoaded = false;

        this.spriteSheet = new Image();
        this.spriteSheet.onload = () => {
            this.spriteLoaded = true;
            console.log('Bird sprite loaded!');
        };
        this.spriteSheet.onerror = () => {
            console.error('Failed to load bird sprite');
        };
        this.spriteSheet.src = 'assets/images/flappybirdassets.png';

        this.frames = [
            { x: 223, y: 124, width: 17, height: 12 },
            { x: 264, y: 90, width: 17, height: 12 },
            { x: 264, y: 64, width: 17, height: 12 }
        ];

        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameInterval = 100;
        this.lastFrameTime = 0;
        
        this.autoFlyTime = 0;
        this.autoFlySpeed = 0.02;
        this.baseY = canvas.height / 3.2;
        this.autoFlyAmplitude = 15;

                // Death animation
        this.isDying = false;
        this.deathBounce = false;
        this.deathTime = 0;
        this.deathPauseTime = 150; // Brief pause at peak of bounce
        this.hitFlashAlpha = 0;
        
        // Blast/Explosion effect
        this.showBlast = false;
        this.blastTime = 0;
        this.blastDuration = 500; // Blast shows for 500ms
        this.blastScale = 0;
        this.blastAlpha = 1;
        this.blastX = 0;
        this.blastY = 0;
        this.hitByRocket = false;
        
        // Load blast sprite
        this.blastLoaded = false;
        this.blastSprite = new Image();
        this.blastSprite.onload = () => {
            this.blastLoaded = true;
            console.log('Blast sprite loaded!');
        };
        this.blastSprite.onerror = () => {
            console.log('Blast sprite not found');
        };
        this.blastSprite.src = 'assets/images/blast.png';
    }

    reset() {
        this.y = this.canvas.height / 2;
        this.velocity = 0;
        this.rotation = 0;
        this.currentFrame = 0;
        this.autoFlyTime = 0;
        this.baseY = this.canvas.height / 3.2;
        this.autoFlyAmplitude = 15;
        this.isDying = false;
        this.deathBounce = false;
        this.deathTime = 0;
        this.hitFlashAlpha = 0;
        this.showBlast = false;
        this.blastTime = 0;
        this.blastScale = 0;
        this.blastAlpha = 1;
        this.hitByRocket = false;
    }
    dieByRocket(){
        if(!this.isDying) {
            this.isDying = true;
            this.hitByRocket = true;
            this.showBlast = true;
            this.blastTime = Date.now();
            this.blastScale = 0.1;
            this.blastAlpha = 1;
            this.blastX = this.x + this.width / 2;
            this.blastY = this.y + this.height / 2;
            this.hitFlashAlpha = 1;
            this.velocity = 0;  // Stop movement during blast
            this.currentFrame = 1;
        }
    }


    die(){
        if (!this.isDying) {
            this.isDying = true;
            this.deathBounce = true;
            this.deathTime = Date.now();
            this.velocity = -6; // strong bounce up like origial flappy bird
            this.hitFlashAlpha = 1; // Flash effect
            this.currentFrame = 1; // use middle frame (wings level)
        }
    }

    updateBlast() {
        if(!this.showBlast) return false;
        const elapsed = Date.now() - this.blastTime;

        //Scale up quickly then hold
        if(elapsed < 100) {
            this.blastScale = 0.1 + (elapsed / 100) * 1.4;  // Scale from 0.1 to 1.5
        } else {
            this.blastScale = 1.5;
        }

        //Fade out after initial burst 
        if(elapsed > 200) {
            this.blastAlpha = 1 - ((elapsed - 200) / 300);
            if(this.blastAlpha < 0) this.blastAlpha = 0;
        }


        //Blast finished 
        if(elapsed >= this.blastDuration) {
            this.showBlast = false;
            // Now start the falling animation
            this.deathBounce = true;
            this.deathTime = Date.now();
            this.velocity = -4; // Smaller bounce after explosion 
            return true; // Blast complete
        }
        return false; // Still showing blast
    }


    drawBlast() {
        if(!this.showBlast) return;
         

        const ctx = this.ctx;
        ctx.save();


        ctx.globalAlpha = this.blastAlpha;
        ctx.translate(this.blastX, this.blastY);
        ctx.scale(this.blastScale,this.blastScale);

        if(this.blastLoaded && this.blastSprite) {
            // Draw blast sprite centred
            const blastWidth = 177;
            const blastHeight = 164;
            ctx.drawImage (
                this.blastSprite,
                180,17,  // Source x , y from sprite
                blastWidth , blastHeight,
                -blastWidth / 2, -blastHeight / 2,
                blastWidth, blastHeight
            );
        } else {
            //Fallback explosion drawing
            this.drawFallbackBlast(ctx);
        }

        ctx.restore();
        
    }

    drawFallbackBlast(ctx) {
        // Draw simple explosion circles (optimized - no gradients per frame)
        const colors = ['#FF4500' , '#FFA500' , '#FFD700' , '#FF0000' , '#FFFF00'];
         

        // Cental bright core
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(
            0, 0, 40, 0, Math.PI * 2);
            ctx.fill();

            // Outer brust circles
            for(let i=0 ; i < 6; i++){
                const angle = (Math.PI * 2 / 6) * i;
                const dist = 35;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;
                const radius = 18;


                ctx.fillStyle = colors[i % colors.length];
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            //center bright flash(simple for performance)
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
    }

    updateDying(groundY){
        const elapsed = Date.now() - this.deathTime;

        // Fade out flash effect
        if(this.hitFlashAlpha > 0) {
            this.hitFlashAlpha -= 0.08;
            if(this.hitFlashAlpha < 0) this.hitFlashAlpha = 0;
        }

        if(this.deathBounce && elapsed < this.deathPauseTime && this.velocity >= -1) {
            this.velocity = 0;
            return;
        }  

        if(this.deathBounce && elapsed >= this.deathPauseTime) {
          this.deathBounce = false;
        }


        //Apply gravity (accelerating fall)
        const deathGravity = 0.5;
        this.velocity += deathGravity;

        //Terminal velocity
        if(this.velocity > 15) {
            this.velocity = 15;
        }


        this.y += this.velocity;

        //Smooth rotation to face down
        if(this.velocity > 0){
            //Gradually rotate as falling
            const targetRotation = Math.min(90, this.velocity * 6);
            this.rotation += (targetRotation - this.rotation) * 0.15;
            if(this.rotation > 90) this.rotation = 90;
        }
        // stop at ground with small bounce 
        if(this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.velocity = 0;
            this.rotation = 90;
        }
    }
    hasHitGround(groundY){
        return this.y + this.height >= groundY -1;
    }

    flap() {
        this.velocity = this.jumpStrength;
    }

    update(currentTime) {
        this.velocity += this.gravity;
        
        if (this.velocity > 6) {
            this.velocity = 6;
        }
        
        this.y += this.velocity;

        this.rotation = Math.min(Math.max(this.velocity * 3, -30), 90);

        if (currentTime - this.lastFrameTime > this.frameInterval) {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            this.lastFrameTime = currentTime;
        }
    }
    
    updateAutoFly(currentTime) {

        this.autoFlyTime += this.autoFlySpeed;
        this.y = this.baseY + Math.sin(this.autoFlyTime) * this.autoFlyAmplitude;
        
        this.rotation = 0;
        
        if (currentTime - this.lastFrameTime > this.frameInterval) {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            this.lastFrameTime = currentTime;
        }
    }

    draw() {
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate((this.rotation * Math.PI) / 180);

        if (this.spriteLoaded && this.spriteSheet) {
            const frame = this.frames[this.currentFrame];

            ctx.drawImage(
                this.spriteSheet,
                frame.x,
                frame.y,
                frame.width,
                frame.height,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            this.drawFallbackBird();
        }

        ctx.restore();
    }

   drawFallbackBird() {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#f4d03f';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(10, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(12, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(15, 2);
        ctx.lineTo(28, 5);
        ctx.lineTo(15, 10);
        ctx.closePath();
        ctx.fill();
    }
    
    getBounds() {
        return {
            x: this.x + 8,
            y: this.y + 8,
            width: this.width - 16,
            height: this.height - 16
        };
    }
    
    isOutOfBounds(groundY) {
        return this.y + this.height > groundY || this.y < 0;
    }
}