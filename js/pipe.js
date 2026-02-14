class Pipe {
    constructor(canvas, x, spriteSheet, spriteLoaded) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.spriteSheet = spriteSheet;
        this.spriteLoaded = spriteLoaded;

        this.width = 70;
        this.gap = 160;
        this.x = x;
        this.speed = 2;

        this.topPipeSprite = {
            x: 330,
            y: 0,
            width: 26,
            height: 121
        };

        this.bottomPipeSprite = {
            x: 302,
            y: 0,
            width: 26,
            height: 135
        };

        const minTop = 80;
        const maxTop = canvas.height - this.gap - 180;
        this.topHeight = getRandomInt(minTop, maxTop);
        this.bottomY = this.topHeight + this.gap;

        this.passed = false;
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        const ctx = this.ctx;

        if (this.spriteLoaded && this.spriteSheet) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.topHeight);
            ctx.scale(1, -1);

            ctx.drawImage(
                this.spriteSheet,
                this.topPipeSprite.x,
                this.topPipeSprite.y,
                this.topPipeSprite.width,
                this.topPipeSprite.height,
                -this.width / 2,
                0,
                this.width,
                this.topHeight
            );
            ctx.restore();

            const bottomHeight = this.canvas.height - this.bottomY;
            ctx.drawImage(
                this.spriteSheet,
                this.bottomPipeSprite.x,
                this.bottomPipeSprite.y,
                this.bottomPipeSprite.width,
                this.bottomPipeSprite.height,
                this.x,
                this.bottomY,
                this.width,
                bottomHeight
            );
        } else {
            this.drawFallbackPipes();
        }
    }

    drawFallbackPipes() {
        const ctx = this.ctx;

        const pipeColor = '#73BF2E';
        const pipeDarkColor = '#558B2F';
        const pipeCapColor = '#8BC34A';

        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, 0, this.width, this.topHeight);

        ctx.fillStyle = pipeDarkColor;
        ctx.fillRect(this.x, 0, 8, this.topHeight);

        ctx.fillStyle = pipeCapColor;
        ctx.fillRect(this.x - 5, this.topHeight - 30, this.width + 10, 30);
        ctx.fillStyle = pipeDarkColor;
        ctx.fillRect(this.x - 5, this.topHeight - 30, 8, 30);

        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, this.bottomY, this.width, this.canvas.height - this.bottomY);

        ctx.fillStyle = pipeDarkColor;
        ctx.fillRect(this.x, this.bottomY, 8, this.canvas.height - this.bottomY);

        ctx.fillStyle = pipeCapColor;
        ctx.fillRect(this.x - 5, this.bottomY, this.width + 10, 30);
        ctx.fillStyle = pipeDarkColor;
        ctx.fillRect(this.x - 5, this.bottomY, 8, 30);
    }

    getTopBounds() {
        return {
            x: this.x,
            y: 0,
            width: this.width,
            height: this.topHeight
        };
    }

    getBottomBounds() {
        return {
            x: this.x,
            y: this.bottomY,
            width: this.width,
            height: this.canvas.height - this.bottomY
        };
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

class PipeManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.pipes = [];
        this.spawnInterval = 1800;
        this.lastSpawnTime = 0;

        this.spriteLoaded = false;
        this.spriteSheet = new Image();
        this.spriteSheet.onload = () => {
            this.spriteLoaded = true;
            console.log('Pipe sprite loaded!');
        };
        this.spriteSheet.onerror = () => {
            console.error('Failed to load pipe sprite');
        };
        this.spriteSheet.src = 'assets/images/flappybirdassets.png';
    }

    reset() {
        this.pipes = [];
        this.lastSpawnTime = 0;
    }

    update(currentTime) {
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.pipes.push(new Pipe(
                this.canvas,
                this.canvas.width,
                this.spriteSheet,
                this.spriteLoaded
            ));
            this.lastSpawnTime = currentTime;
        }

        this.pipes.forEach(pipe => {
            pipe.spriteLoaded = this.spriteLoaded;
            pipe.update();
        });

        this.pipes = this.pipes.filter(pipe => !pipe.isOffScreen());
    }

    draw() {
        this.pipes.forEach(pipe => pipe.draw());
    }

    checkCollision(bird) {
        const birdBounds = bird.getBounds();

        for (let pipe of this.pipes) {
            if (checkCollision(birdBounds, pipe.getTopBounds()) ||
                checkCollision(birdBounds, pipe.getBottomBounds())) {
                return true;
            }
        }
        return false;
    }

    checkScore(bird) {
        let scored = false;

        this.pipes.forEach(pipe => {
            if (!pipe.passed && pipe.x + pipe.width < bird.x) {
                pipe.passed = true;
                scored = true;
            }
        });

        return scored;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}
