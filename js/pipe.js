// Pipe class for Flappy Bird

class Pipe {
    constructor(x, canvasHeight, gapSize = 150) {
        this.x = x;
        this.width = 70;
        this.speed = 3;
        
        // Gap configuration
        this.gapSize = gapSize;
        this.minGapY = 100;
        this.maxGapY = canvasHeight - 100 - gapSize;
        
        // Random gap position
        this.gapY = randomRange(this.minGapY, this.maxGapY);
        
        // Pipe heights
        this.topHeight = this.gapY;
        this.bottomY = this.gapY + this.gapSize;
        this.bottomHeight = canvasHeight - this.bottomY;
        
        // Track if bird passed this pipe
        this.passed = false;
        
        // Colors
        this.pipeColor = '#4CAF50';
        this.pipeEdgeColor = '#388E3C';
        this.pipeLipColor = '#66BB6A';
    }
    
    /**
     * Update pipe position
     */
    update() {
        this.x -= this.speed;
    }
    
    /**
     * Draw pipes on canvas
     */
    draw(ctx, canvasHeight) {
        // Draw top pipe
        this.drawPipe(ctx, this.x, 0, this.width, this.topHeight, true);
        
        // Draw bottom pipe
        this.drawPipe(ctx, this.x, this.bottomY, this.width, this.bottomHeight, false);
    }
    
    /**
     * Draw a single pipe
     */
    drawPipe(ctx, x, y, width, height, isTop) {
        const lipHeight = 30;
        const lipOverhang = 8;
        
        // Main pipe body
        ctx.fillStyle = this.pipeColor;
        ctx.fillRect(x, y, width, height);
        
        // Pipe edge (3D effect)
        ctx.fillStyle = this.pipeEdgeColor;
        ctx.fillRect(x, y, 5, height);
        ctx.fillRect(x + width - 5, y, 5, height);
        
        // Pipe lip
        ctx.fillStyle = this.pipeLipColor;
        if (isTop) {
            // Lip at bottom of top pipe
            ctx.fillRect(x - lipOverhang, height - lipHeight, width + lipOverhang * 2, lipHeight);
            ctx.fillStyle = this.pipeEdgeColor;
            ctx.fillRect(x - lipOverhang, height - lipHeight, width + lipOverhang * 2, 4);
        } else {
            // Lip at top of bottom pipe
            ctx.fillRect(x - lipOverhang, y, width + lipOverhang * 2, lipHeight);
            ctx.fillStyle = this.pipeEdgeColor;
            ctx.fillRect(x - lipOverhang, y + lipHeight - 4, width + lipOverhang * 2, 4);
        }
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x + 10, y, 15, height);
    }
    
    /**
     * Check if pipe is off screen (left side)
     */
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    /**
     * Get bounding boxes for collision detection
     */
    getBounds() {
        return {
            top: {
                x: this.x,
                y: 0,
                width: this.width,
                height: this.topHeight
            },
            bottom: {
                x: this.x,
                y: this.bottomY,
                width: this.width,
                height: this.bottomHeight
            }
        };
    }
}

/**
 * Pipe Manager - handles spawning and managing pipes
 */
class PipeManager {
    constructor(canvasWidth, canvasHeight) {
        this.pipes = [];
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.spawnInterval = 1800; // milliseconds
        this.lastSpawnTime = 0;
        this.gapSize = 150;
    }
    
    /**
     * Update all pipes
     */
    update(currentTime) {
        // Spawn new pipes
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.spawn();
            this.lastSpawnTime = currentTime;
        }
        
        // Update existing pipes
        this.pipes.forEach(pipe => pipe.update());
        
        // Remove off-screen pipes
        this.pipes = this.pipes.filter(pipe => !pipe.isOffScreen());
    }
    
    /**
     * Spawn a new pipe
     */
    spawn() {
        const pipe = new Pipe(this.canvasWidth, this.canvasHeight, this.gapSize);
        this.pipes.push(pipe);
    }
    
    /**
     * Draw all pipes
     */
    draw(ctx) {
        this.pipes.forEach(pipe => pipe.draw(ctx, this.canvasHeight));
    }
    
    /**
     * Check collision with bird
     */
    checkCollision(bird) {
        const birdBounds = bird.getBounds();
        
        for (const pipe of this.pipes) {
            const pipeBounds = pipe.getBounds();
            
            if (checkCollision(birdBounds, pipeBounds.top) ||
                checkCollision(birdBounds, pipeBounds.bottom)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if bird passed a pipe (for scoring)
     */
    checkScore(birdX) {
        let scored = false;
        
        for (const pipe of this.pipes) {
            if (!pipe.passed && birdX > pipe.x + pipe.width) {
                pipe.passed = true;
                scored = true;
            }
        }
        
        return scored;
    }
    
    /**
     * Reset all pipes
     */
    reset() {
        this.pipes = [];
        this.lastSpawnTime = 0;
    }
}
