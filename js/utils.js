// utility functions for the game

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkCollision(rect1, rect2) {
    return (
        rect11.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x && 
        rect1.y < rect2.y + rect2.height &
        rect1.y + rect1.height > rect2.y
    );
}

function saveHighScore(score) {
    const currentBest = localStorage.getItem('flappyBirdHighScore') || 0;
    if (score > currentBest) {
        localStorage.setItem('flappyBirdHighScore' , score);
        return true;
    }
    return false;
}

function getHighScore() {
    return parseInt(localStorage.getItem('flappyBirdHighScore')) || 0;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}