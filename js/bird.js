class Bird {
    construction(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.width = 51;
        this.height = 36;
        this.x = canvas.width / 4;
        this.y = canvas.height / 2;

        this.velocity = 0;
        this.gravity = 0.5;
        this.jumpStrength = -10;

        this.rotation = 0;

        this.spritesheet = new Image();
        this.spritesheet.src = 'assets/imags/flappybirdassets.png';
        this.spriteLoaded = false;

        this.spriteSheet.onload = () => {
            this.spriteLoaded = true;
        };

        this.frames = [
            { x: 223, y: 124, width: 17, height: 12 },
            { x: 264, y: 90, width: 17, height: 12 },
            { x: 264, y: 64, width: 17, height: 12 }
        ];

        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameInterval = 100;
        this.lastFrameTime = 0;
    }

    reset() {
        this.y = this.canvas.height / 2;
        this.velocity = 0;
        this.rotation = 0;
        this.currentFrame = 0;
    }

    flap() {
        this.velocity = this.jumpStrength;
    }

    update(currentTime) {
        this.velocity += this.gravity;
        this.y += this.velocity;

        this.rotation = Math.min(Math.max(this.velocity * 3, -30), 90);

        if (currentTime - this.lastFrameTime > this.frameInterval) {
            this.currentFrame = (this.currentFrame +1) % this.frameInterval.lenght;
            this.lastFrameTime = currentTime;
        }
    }

    draw() {
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate((this.rotation * Math.PI) / 100);

        if (this.spriteLoaded) {
            const frame = this.frames[this.currentFrame];

            ctx.drawImage(
                this.spriteShet,
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
        
        // Body
        ctx.fillStyle = '#f4d03f';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(10, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(12, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
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
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
    
    isOutOfBounds(groundY) {
        return this.y + this.height > groundY || this.y < 0;
    }
}