class CoinSystem {
    constructor() {
        this.coinElement = null;
        this.currentCoin = null;
    }

    /**
     * @param {string} elementId
    */
    init(elementId) {
        this.coinElement = document.getElementById(elementId);
        if (!this.coinElement) {
            console.error(`Coin element with ID '${elementId}' not found`);
        } else {
            console.log('Coin system initialized');
        }
    }

    /**
     * @param {number} score
     */
    updateCoin(score) {
        let coinType = this.getCoinType(score);
        
        if (this.currentCoin !== coinType) {
            this.currentCoin = coinType;
            this.displayCoin(coinType);
        }
    }

    /**
     * @param {number} score
     * @returns {string}
     */
    getCoinType(score) {
        if (score <= 10) {
            return 'bronze';
        } else if (score > 10 && score <= 20) {
            return 'silver';
        } else {
            return 'gold';
        }
    }

    /**
     * @param {string} coinType
     */
    displayCoin(coinType) {
        if (!this.coinElement) return;

        this.coinElement.classList.remove('bronze-coin', 'silver-coin', 'gold-coin', 'coin-hidden');
        
        this.coinElement.classList.add(`${coinType}-coin`);
    }

    reset() {
        this.currentCoin = null;
        if (this.coinElement) {
            this.coinElement.classList.remove('bronze-coin', 'silver-coin', 'gold-coin');
            this.coinElement.classList.add('coin-hidden');
        }
    }

    show() {
        if (this.coinElement) {
            this.coinElement.classList.remove('coin-hidden');
        }
    }

    hide() {
        if (this.coinElement) {
            this.coinElement.classList.add('coin-hidden');
        }
    }
}

const coinSystem = new CoinSystem();