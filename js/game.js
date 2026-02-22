class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    this.canvas.width = 400;
    this.canvas.height = 600;
    this.resizeCanvas();
    this.spriteLoaded = false;

    this.spriteSheet = new Image();
    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
      console.log("Sprite sheet loaded!");
    };
    this.spriteSheet.onerror = () => {
      console.error("Failed to load sprite sheet");
    };
    this.spriteSheet.src = "assets/images/flappybirdassets.png";

    this.backgroundSprite = {
      x: 0,
      y: 0,
      width: 144,
      height: 256,
    };

    this.bgX = 0;
    this.bgSpeed = 0.5;

    this.bird = new Bird(this.canvas);
    this.pipeManager = new PipeManager(this.canvas);

    this.gameState = "start";
    this.showSettings = false;
    this.isPaused = false;
    this.firstInputReceived = false;
    this.score = 0;
    this.highScore = getHighScore();

    this.gameOverTimeoutId = null;

    // Player coins (currency)
    this.playerCoins = this.loadPlayerCoins();
    
    // Owned items from shop (quantities)
    this.ownedItems = this.loadOwnedItems();
    
    // Shop prices (coins to buy one use)
    this.shopPrices = {
      shield: 20,
      power: 15,
      antibomb: 10
    };

    // Screen shake effect
    this.screenShake = {
      intensity: 0,
      duration: 0,
      startTime: 0
    };

    this.groundY = this.canvas.height - 80;
    this.groundX = 0;

    this.bindEvents();

    coinSystem.init("coinDisplay");

    // Sprite number data for canvas drawing
    this.numberSprites = [
      { x: 288, y: 100, w: 7, h: 10 },  // 0
      { x: 291, y: 118, w: 5, h: 10 },  // 1
      { x: 289, y: 134, w: 7, h: 10 },  // 2
      { x: 289, y: 150, w: 7, h: 10 },  // 3
      { x: 287, y: 173, w: 7, h: 10 },  // 4
      { x: 287, y: 185, w: 7, h: 10 },  // 5
      { x: 165, y: 245, w: 7, h: 10 },  // 6
      { x: 175, y: 245, w: 7, h: 10 },  // 7
      { x: 185, y: 245, w: 7, h: 10 },  // 8
      { x: 195, y: 245, w: 7, h: 10 }   // 9
    ];

    // In-game score element
    this.inGameScoreElement = document.getElementById("inGameScore");
    coinSystem.reset();

    shieldSystem.init(this.bird, this.canvas);

    rocketSystem.init(this.bird, this.canvas);

    gravitySystem.init(this.canvas);
    gravitySystem.setGroundY(this.groundY);

    powerUpSystem.init(this.bird, this.canvas);

    portalSystem.init(this.bird, this.canvas);

    spaceWorldSystem.init(this.bird, this.canvas, (amount) => this.addCoins(amount));

    const powersContainer = document.getElementById("powersContainer");
    if (powersContainer) powersContainer.classList.add("hidden");

    this.lastTime = 0;

    this.setupShieldButton();
    this.setupGravityButton();
    
    // Update coins display on start
    this.updateStartScreenCoins();
    
    this.gameLoop(0);
  }

  bindEvents() {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.handleInput();
      } else if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        this.togglePause();
      } else if (e.code === "KeyQ") {
        e.preventDefault();
        this.activatePower(performance.now());
      } else if (e.code === "KeyE") {
        e.preventDefault();
        this.activateShield();
      } else if (e.code === "KeyG") {
        e.preventDefault();
        this.activateGravityPower();
      }
    });

    this.canvas.addEventListener("click", () => this.handleInput());

    // Touch support for mobile
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.handleInput();
    }, { passive: false });

    // Resize handler for orientation changes
    window.addEventListener("resize", () => this.resizeCanvas());
    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.resizeCanvas(), 100);
    });

    document.addEventListener(
      "pointerdown",
      (e) => {
        const target = e.target;
        const toggleBtn =
          target instanceof Element ? target.closest("#toggleBtn") : null;
        if (!toggleBtn) return;

        e.preventDefault();
        e.stopPropagation();
        this.togglePause();
      },
      { capture: true },
    );

    const restartBtn = document.getElementById("restartBtn");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.restart();
      });
      restartBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.restart();
      }, { passive: false });
    }

    const settingsBtn = document.getElementById("settingsBtn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        this.toggleSettings();
      });
    }
    const startBtn = document.getElementById("startBtn");
    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleInput();
      });
      startBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleInput();
      }, { passive: false });
    }

    const shopBtn = document.getElementById("shopBtn");
    if (shopBtn) {
      shopBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openShop();
      });
      shopBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openShop();
      }, { passive: false });
    }

    const closeShopBtn = document.getElementById("closeShopBtn");
    if (closeShopBtn) {
      closeShopBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeShop();
      });
      closeShopBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeShop();
      }, { passive: false });
    }

    // Setup shop item click handlers
    this.setupShopItems();

    const powerBtn = document.getElementById("powerBtn");
    if (powerBtn) {
      powerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.activatePower(performance.now());
      });
      powerBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.activatePower(performance.now());
      }, { passive: false });
    }

    const shieldBtn = document.getElementById("shieldBtn");
    if (shieldBtn) {
      shieldBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.activateShield();
      });
      shieldBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.activateShield();
      }, { passive: false });
    }
  }

  handleInput() {
    if (this.showSettings) {
      this.showSettings = false;
      return;
    }

    if (this.gameState === "gameOver" || this.gameState === "dying" || this.gameState === "blasting") {
      return;
    }

    if (this.isPaused) {
      return;
    }

    if (this.gameState === "start") {
      this.startGame();
    } else if (this.gameState === "ready") {
      this.beginPlay();
    } else if (this.gameState === "playing") {
      // Don't allow flap during portal suck-in animation
      if (portalSystem.isSuckingIn && portalSystem.isSuckingIn()) {
        return;
      }
      this.firstInputReceived = true;
      
      // Break autopilot on user input
      if (portalSystem.isAutopilotActive && portalSystem.isAutopilotActive()) {
        portalSystem.breakAutopilot();
      }
      
      // In space world, use floating controls instead of flap
      if (!spaceWorldSystem.isActive) {
        this.bird.flap();
      }
    }
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  // Load player coins from localStorage
  loadPlayerCoins() {
    const saved = localStorage.getItem('flappybird_coins');
    return saved ? parseInt(saved) : 0;
  }

  // Save player coins to localStorage (debounced to avoid performance issues)
  savePlayerCoins() {
    // Clear any pending save
    if (this.coinSaveTimeout) {
      clearTimeout(this.coinSaveTimeout);
    }
    // Debounce the save - only save after 500ms of no changes
    this.coinSaveTimeout = setTimeout(() => {
      localStorage.setItem('flappybird_coins', this.playerCoins.toString());
    }, 500);
  }
  
  // Force save coins immediately (call on game over, etc.)
  forceSaveCoins() {
    if (this.coinSaveTimeout) {
      clearTimeout(this.coinSaveTimeout);
    }
    localStorage.setItem('flappybird_coins', this.playerCoins.toString());
  }

  // Load owned items from localStorage (quantities)
  loadOwnedItems() {
    const saved = localStorage.getItem('flappybird_owned');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old boolean format to quantity format
      for (const key in parsed) {
        if (parsed[key] === true) parsed[key] = 1;
      }
      return parsed;
    }
    return { shield: 0, power: 0, antibomb: 0 };
  }

  // Save owned items to localStorage
  saveOwnedItems() {
    localStorage.setItem('flappybird_owned', JSON.stringify(this.ownedItems));
  }

  // Add coins (called when scoring)
  addCoins(amount) {
    this.playerCoins += amount;
    this.savePlayerCoins(); // Debounced save
    this.updateInGameCoins();
  }

  openShop() {
    const shopScreen = document.getElementById("shopScreen");
    if (shopScreen) {
      shopScreen.classList.remove("hidden");
      this.updateShopDisplay();
    }
  }

  updateShopDisplay() {
    // Update coins display
    const coinsAmount = document.getElementById("shopCoinsAmount");
    if (coinsAmount) {
      coinsAmount.textContent = this.playerCoins;
    }

    // Update owned items display with quantities on the card
    const shopItems = document.querySelectorAll('.shop-item[data-item]');
    shopItems.forEach(item => {
      const itemName = item.getAttribute('data-item');
      const qty = this.ownedItems[itemName] || 0;
      // Place qty badge on the card (parent .shop-item-card)
      const card = item.closest('.shop-item-card');
      if (!card) return;
      let badge = card.querySelector('.qty-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'qty-badge';
        card.appendChild(badge);
      }
      badge.textContent = qty;
      badge.style.display = qty > 0 ? '' : 'none';
    });
  }

  closeShop() {
    const shopScreen = document.getElementById("shopScreen");
    if (shopScreen) {
      shopScreen.classList.add("hidden");
    }
    // Hide any message
    const message = document.getElementById("shopMessage");
    if (message) message.classList.add("hidden");
  }

  purchaseItem(itemName, price) {
    const message = document.getElementById("shopMessage");

    // Check if enough coins
    if (this.playerCoins < price) {
      this.showShopMessage("Not enough coins!", "error");
      return false;
    }

    // Purchase successful - increment quantity
    this.playerCoins -= price;
    if (!this.ownedItems[itemName]) this.ownedItems[itemName] = 0;
    this.ownedItems[itemName]++;
    this.savePlayerCoins();
    this.saveOwnedItems();
    this.updateShopDisplay();
    this.showShopMessage(`Purchased! (x${this.ownedItems[itemName]})`, "success");
    return true;
  }

  showShopMessage(text, type) {
    const message = document.getElementById("shopMessage");
    if (message) {
      message.textContent = text;
      message.className = "shop-message " + type;
      // Reset animation
      message.style.animation = 'none';
      message.offsetHeight; // Trigger reflow
      message.style.animation = null;
      
      // Hide after animation
      setTimeout(() => {
        message.classList.add("hidden");
      }, 2000);
    }
  }

  setupShopItems() {
    const shopCards = document.querySelectorAll('.shop-item-card');
    shopCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const item = card.querySelector('.shop-item[data-item]');
        if (!item) return;
        const itemName = item.getAttribute('data-item');
        const price = parseInt(item.getAttribute('data-price'));
        this.purchaseItem(itemName, price);
      });
    });
  }

  activatePower(currentTime) {
    if (this.gameState !== "playing") return;
    if (powerUpSystem.isActive) return;

    // Check if player has power quantity
    const qty = this.ownedItems.power || 0;
    if (qty <= 0) {
      console.log("No Power available! Buy from shop.");
      return;
    }

    const activated = powerUpSystem.activate(currentTime);
    if (activated) {
      // Decrement quantity
      this.ownedItems.power--;
      this.saveOwnedItems();
      this.updatePowerQuantities();
      const powerBtn = document.getElementById("powerBtn");
      if (powerBtn) powerBtn.classList.add("power-used");
    }
  }

  setupShieldButton() {
    this.updateShieldButton();
  }

  resizeCanvas() {
    const container = document.querySelector('.game-container');
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    
    const gameAspect = 400 / 600;
    let displayHeight = vh; 
    let displayWidth = displayHeight * gameAspect;
    
    if (displayWidth > vw) {
      displayWidth = vw;
      displayHeight = displayWidth / gameAspect;
    }
    
    if (container) {
      container.style.width = displayWidth + 'px';
      container.style.height = displayHeight + 'px';
    }
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
  }

  activateShield() {
    if (this.gameState !== "playing") return;
    if (!shieldSystem.isReady()) return;

    // Check if player has shield quantity
    const qty = this.ownedItems.shield || 0;
    if (qty <= 0) {
      console.log("No Shield available! Buy from shop.");
      return;
    }

    const activated = shieldSystem.activate();
    if (activated) {
      // Decrement quantity
      this.ownedItems.shield--;
      this.saveOwnedItems();
      this.updatePowerQuantities();
      console.log("Shield activated! Protection for 3 pipe hits.");
      this.updateShieldButton();
    }
  }

  activateGravityPower() {
    if (this.gameState !== "playing") return;
    
    const gravityBtn = document.getElementById("gravityBtn");
    if (gravityBtn && gravityBtn.classList.contains("gravity-used")) return;

    // Check if player has anti-rocket quantity
    const qty = this.ownedItems.antibomb || 0;
    if (qty <= 0) {
      console.log("No Anti-Rocket available! Buy from shop.");
      return;
    }

    const activated = gravitySystem.activate();
    if (activated && gravityBtn) {
      // Decrement quantity
      this.ownedItems.antibomb--;
      this.saveOwnedItems();
      this.updatePowerQuantities();
      gravityBtn.classList.add("gravity-used");
      console.log("Gravity power activated! Rockets falling down.");
    }
  }

  setupGravityButton() {
    const gravityBtn = document.getElementById("gravityBtn");
    if (gravityBtn) {
      gravityBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.activateGravityPower();
      });
      gravityBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.activateGravityPower();
      }, { passive: false });
    }
  }

  updateShieldButton() {
    const shieldBtn = document.getElementById("shieldBtn");
    if (!shieldBtn) return;

    if (shieldSystem.isReady()) {
      shieldBtn.classList.remove("shield-used", "shield-cooldown");
      shieldBtn.classList.add("shield-ready");
      shieldBtn.title = "Activate Shield";
    } else if (shieldSystem.isProtecting()) {
      shieldBtn.classList.remove("shield-ready", "shield-cooldown");
      shieldBtn.classList.add("shield-used");
      shieldBtn.title = `Shield Active! ${shieldSystem.getShieldHealth()}/3 hits remaining`;
    } else {
      shieldBtn.classList.remove("shield-ready", "shield-used");
      shieldBtn.classList.add("shield-cooldown");
      const cooldownPercent = Math.round(
        shieldSystem.getCooldownProgress() * 100,
      );
      shieldBtn.title = `Shield Cooldown - ${cooldownPercent}% ready`;
    }
  }

  // Update power quantity labels during gameplay
  updatePowerQuantities() {
    const powerQty = document.getElementById("powerQty");
    const shieldQty = document.getElementById("shieldQty");
    const gravityQty = document.getElementById("gravityQty");
    
    if (powerQty) powerQty.textContent = this.ownedItems.power || 0;
    if (shieldQty) shieldQty.textContent = this.ownedItems.shield || 0;
    if (gravityQty) gravityQty.textContent = this.ownedItems.antibomb || 0;
  }

  startGame() {
    this.clearGameOverTimeout();
    this.gameState = "ready";
    this.firstInputReceived = false;

    const startScreen = document.getElementById("startScreen");
    if (startScreen) startScreen.classList.add("hidden");

    const getReadyScreen = document.getElementById("getReadyScreen");
    if (getReadyScreen) getReadyScreen.classList.remove("hidden");
  }

  beginPlay() {
    this.clearGameOverTimeout();
    this.gameState = "playing";
    this.firstInputReceived = true;
    this.isPaused = false;

    const getReadyScreen = document.getElementById("getReadyScreen");
    if (getReadyScreen) getReadyScreen.classList.add("hidden");

    const gameControls = document.getElementById("gameControls");
    if (gameControls) gameControls.classList.remove("hidden");

    const powersContainer = document.getElementById("powersContainer");
    if (powersContainer) powersContainer.classList.remove("hidden");
    
    // Show current power quantities
    this.updatePowerQuantities();

    // Show in-game score
    if (this.inGameScoreElement) {
      this.inGameScoreElement.classList.remove("hidden");
      this.updateInGameScore();
    }

    // Show in-game coins display
    const inGameCoins = document.getElementById("inGameCoins");
    if (inGameCoins) {
      inGameCoins.classList.remove("hidden");
      this.updateInGameCoins();
    }

    const powerBtn = document.getElementById("powerBtn");
    if (powerBtn) powerBtn.classList.remove("power-used");

    const gravityBtn = document.getElementById("gravityBtn");
    if (gravityBtn) gravityBtn.classList.remove("gravity-used");

    this.updateShieldButton();

    this.syncToggleButton();

    this.bird.flap();
  }

  // Update in-game coins display
  updateInGameCoins() {
    const coinsElement = document.getElementById("inGameCoinsAmount");
    if (coinsElement) {
      coinsElement.textContent = this.playerCoins;
    }
  }

  restart() {
    this.returnToHome();
  }

  pauseGame() {
    if (this.gameState === "playing" && !this.isPaused) {
      this.isPaused = true;
      console.log("Game paused");
    }
  }

  resumeGame() {
    if (this.gameState === "playing" && this.isPaused) {
      this.isPaused = false;
      this.syncToggleButton();
    }
  }

  syncToggleButton() {
    const toggleBtn = document.getElementById("toggleBtn");
    if (!toggleBtn) return;

    toggleBtn.classList.toggle("play-button-sprite", this.isPaused);
    toggleBtn.classList.toggle("pass-sprite", !this.isPaused);
    toggleBtn.title = this.isPaused ? "Resume Game" : "Pause Game";
  }

  togglePause() {
    if (this.gameState !== "playing") return;

    this.isPaused = !this.isPaused;
    this.syncToggleButton();
  }

  gameOver() {
    // Start dying animation instead of immediately showing game over
    if (this.gameState !== "dying" && this.gameState !== "blasting") {
      this.gameState = "dying";
      this.bird.die();
      this.isPaused = false;
      
      // Trigger screen shake
      this.screenShake = {
        intensity: 8,
        duration: 300,
        startTime: Date.now()
      };

      this.syncToggleButton();

      const gameControls = document.getElementById("gameControls");
      if (gameControls) gameControls.classList.add("hidden");

      const powersContainer = document.getElementById("powersContainer");
      if (powersContainer) powersContainer.classList.add("hidden");

      powerUpSystem.deactivate();
      this.pipeManager.updateSpeed(2);
    }
  }

  gameOverByRocket() {
    // Start blast animation then dying
    if (this.gameState !== "dying" && this.gameState !== "blasting") {
      this.gameState = "blasting";
      this.bird.dieByRocket();
      this.isPaused = false;
      
      // Stronger screen shake for rocket explosion
      this.screenShake = {
        intensity: 15,
        duration: 400,
        startTime: Date.now()
      };

      this.syncToggleButton();

      const gameControls = document.getElementById("gameControls");
      if (gameControls) gameControls.classList.add("hidden");

      const powersContainer = document.getElementById("powersContainer");
      if (powersContainer) powersContainer.classList.add("hidden");

      powerUpSystem.deactivate();
      this.pipeManager.updateSpeed(2);
    }
  }

  showGameOverScreen() {
    this.gameState = "gameOver";

    // Force save coins when game ends
    this.forceSaveCoins();

    const newBestSprite = document.getElementById("newBestSprite");
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHighScore(this.score);
      // Show NEW sprite for new best score
      if (newBestSprite) newBestSprite.classList.remove("hidden");
    } else {
      // Hide NEW sprite if not a new best
      if (newBestSprite) newBestSprite.classList.add("hidden");
    }

    // Update score displays with sprite numbers
    this.updateSpriteScore("finalScore", this.score);
    this.updateSpriteScore("bestScore", this.highScore);

    // Hide in-game score
    if (this.inGameScoreElement) {
      this.inGameScoreElement.classList.add("hidden");
    }

    // Hide in-game coins display
    const inGameCoins = document.getElementById("inGameCoins");
    if (inGameCoins) {
      inGameCoins.classList.add("hidden");
    }

    coinSystem.updateCoin(this.score);
    coinSystem.show();

    document.getElementById("gameOverScreen").classList.remove("hidden");
  }

  // Generate HTML for sprite number display
  generateSpriteNumberHTML(num) {
    const digits = String(num).split('');
    return digits.map(d => {
      const digit = parseInt(d);
      return `<span class="num-digit num-${digit}"></span>`;
    }).join('');
  }

  // Update an element with sprite number display
  updateSpriteScore(elementId, score) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = this.generateSpriteNumberHTML(score);
    }
  }

  // Update in-game score display
  updateInGameScore() {
    if (this.inGameScoreElement) {
      this.inGameScoreElement.innerHTML = this.generateSpriteNumberHTML(this.score);
    }
  }

  clearGameOverTimeout() {
    if (this.gameOverTimeoutId != null) {
      clearTimeout(this.gameOverTimeoutId);
      this.gameOverTimeoutId = null;
    }
  }

  returnToHome() {
    this.clearGameOverTimeout();

    this.score = 0;
    this.firstInputReceived = false;
    this.isPaused = false;
    this.bird.reset();
    this.pipeManager.reset();
    this.bgX = 0;
    this.groundX = 0;
    
    // Reset screen shake
    this.screenShake = { intensity: 0, duration: 0, startTime: 0 };

    coinSystem.reset();

    powerUpSystem.reset();
    this.pipeManager.updateSpeed(2);

    shieldSystem.reset();

    rocketSystem.reset();

    gravitySystem.reset();

    portalSystem.reset();

    spaceWorldSystem.reset();

    const powerBtnContainer = document.getElementById("powerBtnContainer");
    if (powerBtnContainer) powerBtnContainer.classList.add("hidden");

    const shieldBtnContainer = document.getElementById("shieldBtnContainer");
    if (shieldBtnContainer) shieldBtnContainer.classList.add("hidden");

    const gravityBtnContainer = document.getElementById("gravityBtnContainer");
    if (gravityBtnContainer) gravityBtnContainer.classList.add("hidden");

    const powerBtn = document.getElementById("powerBtn");
    if (powerBtn) powerBtn.classList.remove("power-used");

    const gravityBtn = document.getElementById("gravityBtn");
    if (gravityBtn) gravityBtn.classList.remove("gravity-used");

    this.gameState = "start";

    // Hide in-game score
    if (this.inGameScoreElement) {
      this.inGameScoreElement.classList.add("hidden");
    }

    // Hide in-game coins display
    const inGameCoins = document.getElementById("inGameCoins");
    if (inGameCoins) {
      inGameCoins.classList.add("hidden");
    }

    const gameControls = document.getElementById("gameControls");
    if (gameControls) gameControls.classList.add("hidden");

    this.syncToggleButton();

    const startScreen = document.getElementById("startScreen");
    if (startScreen) startScreen.classList.remove("hidden");

    // Update coins display on start screen
    this.updateStartScreenCoins();

    const getReadyScreen = document.getElementById("getReadyScreen");
    if (getReadyScreen) getReadyScreen.classList.add("hidden");

    const gameOverScreen = document.getElementById("gameOverScreen");
    if (gameOverScreen) gameOverScreen.classList.add("hidden");
  }

  updateStartScreenCoins() {
    const coinsElement = document.getElementById("startCoinsAmount");
    if (coinsElement) {
      coinsElement.textContent = this.playerCoins;
    }
  }

  update(currentTime) {
    if (this.gameState === "playing" && !this.isPaused) {
      this.bgX -= this.bgSpeed;
      if (this.bgX <= -this.backgroundSprite.width) {
        this.bgX = 0;
      }
    }

    if (this.gameState === "start" || this.gameState === "ready") {
      this.bird.updateAutoFly(currentTime);
    } else if (this.gameState === "playing" && !this.isPaused) {
      if (!this.firstInputReceived) {
        this.bird.updateAutoFly(currentTime);
      } else {
        // In space world, use floating movement instead of gravity-based
        if (portalSystem.isInNewWorld() && spaceWorldSystem.isActive) {
          // Space world floating update - no gravity flapping
          this.bird.updateAnimation(currentTime);
          spaceWorldSystem.update(currentTime);
        } else if (portalSystem.isAutopilotActive && portalSystem.isAutopilotActive()) {
          // Autopilot mode - only update animation, position handled by autopilot
          this.bird.updateAnimation(currentTime);
        } else {
          this.bird.update(currentTime);
          
          // Activate space world when entering new world
          if (portalSystem.isInNewWorld() && !spaceWorldSystem.isActive) {
            spaceWorldSystem.activate();
          }
        }
        
        // Deactivate space world when leaving
        if (!portalSystem.isInNewWorld() && spaceWorldSystem.isActive) {
          spaceWorldSystem.deactivate();
        }
      }

      // Only update pipes if not in portal new world
      if (this.firstInputReceived && portalSystem.shouldSpawnPipes()) {
        this.pipeManager.update(currentTime);
      }

      if (this.firstInputReceived) {
        powerUpSystem.update(currentTime);

        shieldSystem.update();

        this.updateShieldButton();

        this.pipeManager.updateSpeed(powerUpSystem.getPipeSpeed());

        // Only check pipe collisions if pipes are active (not in new world)
        if (portalSystem.shouldSpawnPipes()) {
          // Skip collision if invincible (powerup or portal grace period)
          const isInvincible = powerUpSystem.isInvincible() || portalSystem.checkInvincibility();
          if (isInvincible) {
          } else {
            if (this.pipeManager.checkCollision(this.bird)) {
              if (shieldSystem.onPipeHit()) {
                const destroyedPipe = this.pipeManager.destroyCollidingPipe(this.bird);
                if (destroyedPipe) {
                  shieldSystem.spawnPipeBreakParticles(destroyedPipe);
                }
                console.log("Shield protected the bird! Pipe destroyed!");
                this.updateShieldButton();
              } else {
                this.gameOver();
                return;
              }
            }
          }

          if (this.pipeManager.checkScore(this.bird)) {
            this.score += portalSystem.getScoreMultiplier();
            this.updateInGameScore();
            // Earn coins when scoring (5 coins per point, multiplied in portal)
            // Earn 3 coins per score (multiplied in portal)
            this.addCoins(3 * portalSystem.getScoreMultiplier());
          }
        }

        // Check ground collision (skip if being sucked into portal, transitioning, or invincible)
        const isBeingSuckedIn = portalSystem.isSuckingIn && portalSystem.isSuckingIn();
        const isPortalTransitioning = portalSystem.isTransitioning && portalSystem.isTransitioning();
        const isGroundInvincible = powerUpSystem.isInvincible() || portalSystem.checkInvincibility();
        if (!isGroundInvincible && !isBeingSuckedIn && !isPortalTransitioning) {
          if (this.bird.isOutOfBounds(this.groundY)) {
            this.gameOver();
            return;
          }
        }

        // Portal system
        if (portalSystem.canTrigger(this.score)) {
          portalSystem.trigger();
          this.pipeManager.reset(); // Clear pipes when portal appears
        }
        portalSystem.update();

        // Update autopilot if active (during invincibility period)
        if (portalSystem.updateAutopilot) {
          portalSystem.updateAutopilot();
        }

        // Handle portal screen shake
        if (portalSystem.needsScreenShake) {
          this.screenShake = {
            intensity: portalSystem.screenShakeIntensity,
            duration: portalSystem.screenShakeDuration,
            startTime: Date.now()
          };
          portalSystem.needsScreenShake = false;
        }

        // Clear pipes when entering/exiting portal
        if (portalSystem.needsClearPipes) {
          this.pipeManager.reset();
          portalSystem.needsClearPipes = false;
        }

        rocketSystem.update(this.score);

        gravitySystem.update();

        // Check rocket collision (skip if invincible, being sucked into portal, or transitioning)
        const isBeingSuckedInRocket = portalSystem.isSuckingIn && portalSystem.isSuckingIn();
        const isPortalTransitioningRocket = portalSystem.isTransitioning && portalSystem.isTransitioning();
        const isRocketInvincible = powerUpSystem.isInvincible() || portalSystem.checkInvincibility();
        if (!isRocketInvincible && !isBeingSuckedInRocket && !isPortalTransitioningRocket) {
          if (rocketSystem.checkCollision(this.bird)) {
            this.gameOverByRocket();
            return;
          }
        }
      }

      this.groundX -= 3;
      if (this.groundX <= -20) {
        this.groundX = 0;
      }
    }

    // Handle blasting state - show explosion before falling
    if (this.gameState === "blasting") {
      const blastComplete = this.bird.updateBlast();
      
      // Update explosions while blasting
      rocketSystem.updateExplosions();
      
      // When blast is done, transition to dying state
      if (blastComplete) {
        this.gameState = "dying";
      }
    }

    // Handle dying state - bird falls to ground
    if (this.gameState === "dying") {
      this.bird.updateDying(this.groundY);
      
      // Update explosions while dying
      rocketSystem.updateExplosions();
      
      // Check if bird has fallen out of screen
      if (this.bird.hasFallenOut()) {
        this.showGameOverScreen();
      }
    }

    if (this.gameState === "gameOver") {
      rocketSystem.updateExplosions();
    }
  }

  drawBackground() {
    const ctx = this.ctx;

    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.spriteLoaded && this.spriteSheet) {
      
      const cropY = 60;
      const cropHeight = 150;
      
      const bgWidth = this.backgroundSprite.width;
      
      const scale = 2.7;
      const scaledWidth = bgWidth * scale;
      const scaledHeight = cropHeight * scale;

      const bgY = this.groundY - scaledHeight;

      const tilesNeeded = Math.ceil(this.canvas.width / scaledWidth) + 2;

      for (let i = 0; i < tilesNeeded; i++) {
        const xPos = this.bgX * scale + i * scaledWidth;

        ctx.drawImage(
          this.spriteSheet,
          this.backgroundSprite.x,
          this.backgroundSprite.y + cropY,
          this.backgroundSprite.width,
          cropHeight,
          xPos,
          bgY,
          scaledWidth,
          scaledHeight,
        );
      }
    }
  }

  drawGround() {
    const ctx = this.ctx;

  ctx.imageSmoothingEnabled = false;
  ctx.wekitImageSmoothingEnabled=false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.masImageSmooothingEnaled = false;

    if (this.spriteLoaded && this.spriteSheet) {
      const groundSprite = {
        x: 146,
        y: 0,
        width: 154,
        height: 56,
      };

      const groundHeight = 80;
      const spriteWidth = groundSprite.width;
      const tilesNeeded = Math.ceil(this.canvas.width / spriteWidth) + 1;

      for (let i = 0; i < tilesNeeded; i++) {
        const xPos = Math.round(this.groundX + i * spriteWidth);

        ctx.drawImage(
          this.spriteSheet,
          groundSprite.x,
          groundSprite.y,
          groundSprite.width,
          groundSprite.height,
          xPos,
          Math.round(this.groundY),
          Math.round(spriteWidth),
          groundHeight,
        );
      }
    } else {
      ctx.fillStyle = "#DEB887";
      ctx.fillRect(
        0,
        this.groundY,
        this.canvas.width,
        this.canvas.height - this.groundY,
      );

      ctx.fillStyle = "#8B4513";
      ctx.fillRect(0, this.groundY, this.canvas.width, 15);

      ctx.fillStyle = "#D2691E";
      for (let i = this.groundX; i < this.canvas.width + 20; i += 20) {
        ctx.fillRect(
          i,
          this.groundY + 15,
          10,
          this.canvas.height - this.groundY - 15,
        );
      }
    }
  }

  draw() {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply screen shake
    let shakeX = 0, shakeY = 0;
    if (this.screenShake.intensity > 0) {
      const elapsed = Date.now() - this.screenShake.startTime;
      if (elapsed < this.screenShake.duration) {
        const progress = 1 - (elapsed / this.screenShake.duration);
        const currentIntensity = this.screenShake.intensity * progress;
        shakeX = (Math.random() - 0.5) * currentIntensity * 2;
        shakeY = (Math.random() - 0.5) * currentIntensity * 2;
      } else {
        this.screenShake.intensity = 0;
      }
    }
    
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Draw world background based on portal state
    if (portalSystem.isInNewWorld()) {
      portalSystem.drawNewWorldBackground(ctx);
    } else {
      this.drawBackground();
    }

    // Only draw pipes if not in new world
    if (portalSystem.shouldSpawnPipes()) {
      this.pipeManager.draw();
    }

    // Draw ground based on world
    if (portalSystem.isInNewWorld()) {
      portalSystem.drawNewWorldGround(ctx, this.groundY);
    } else {
      this.drawGround();
    }

    this.bird.draw();
    
    // Draw blast effect on top of bird
    if (this.gameState === "blasting" || this.bird.showBlast) {
      this.bird.drawBlast();
    }

    powerUpSystem.draw();

    shieldSystem.draw();

    rocketSystem.draw();

    gravitySystem.draw();

    portalSystem.draw();

    // Draw space world coins
    if (spaceWorldSystem.isActive) {
      spaceWorldSystem.draw(ctx);
    }

    // Score is now displayed using HTML sprite elements

    if (this.isPaused && this.gameState === "playing") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.strokeText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
      ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);

      ctx.font = "bold 18px Arial";
      ctx.strokeText(
        "Click Play to Resume",
        this.canvas.width / 2,
        this.canvas.height / 2 + 40,
      );
      ctx.fillText(
        "Click Play to Resume",
        this.canvas.width / 2,
        this.canvas.height / 2 + 40,
      );
    }

    if (this.showSettings) {
      drawSettings(ctx, this.canvas);
    }
    
    ctx.restore(); // End screen shake transform
    
    // Draw hit flash effect (on top of everything)
    if (this.bird.hitFlashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.bird.hitFlashAlpha * 0.5;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    }
  }

  gameLoop(currentTime) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(currentTime);
    this.draw();

    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

function getHighScore() {
  const score = localStorage.getItem("flappyBirdHighScore");
  return score ? parseInt(score) : 0;
}

function saveHighScore(score) {
  localStorage.setItem("flappyBirdHighScore", score.toString());
}

function drawSettings(ctx, canvas) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "bold 24px Aprial";
  ctx.textAlign = "center";
  ctx.fillText("setting", canvas.width / 2, canvas.height / 2);
}

window.addEventListener("load", () => {
  new Game();
});