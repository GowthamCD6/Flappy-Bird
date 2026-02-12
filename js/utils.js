// utility functions for the game

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
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

// ...existing code...

function drawSettings(ctx, canvas) {
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const panelWidth = 200;
    const panelHeight = 350;
    const panelX = (canvas.width - panelWidth) / 2;
    const panelY = (canvas.height - panelHeight) / 2;

    // Draw settings panel background
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 10);
    ctx.fill();
    
    // Draw panel border
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.beginPath();
    drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 10);
    ctx.stroke();

    const menuItems = ['MENU', 'PLAY', 'RATE', 'SCORE', 'SMOKE', 'START'];
    const itemHeight = 40;
    const itemSpacing = 10;
    const startY = panelY + 40;

    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';

    menuItems.forEach((item, index) => {
        const itemY = startY + (index * (itemHeight + itemSpacing));

        // Draw item background
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        drawRoundedRect(ctx, panelX + 20, itemY, panelWidth - 40, itemHeight, 5);
        ctx.fill();

        // Draw item border
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        drawRoundedRect(ctx, panelX + 20, itemY, panelWidth - 40, itemHeight, 5);
        ctx.stroke();

        // Draw item text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(item, panelX + panelWidth / 2, itemY + itemHeight / 2 + 6);
    });
}