/**
 * Game State Management System
 * Centralizes game state and provides methods to update it
 */
const GameState = {
    // Game status
    isActive: true,
    
    // Grid configuration
    grid: {
        rows: 5,
        cols: 5,
        hexVisualWidth: 86.6,
        hexHeight: 100,
        rowOffset: 75, // hexHeight * 0.75
        colOffset: 86.6
    },
    
    // Player state
    player: {
        currentRow: 0,
        currentCol: 0,
        energy: 0,
        movementPoints: 1,
        currentAction: null,
        moveCounter: 0,
        turnCount: 0,
        currentLevelSenses: 0,
        hasUsedSenserBonus: false
    },
    
    // Level data
    level: {
        tileData: null,
        temporaryInventory: []
    },
    
    // Progress data (persisted)
    progress: {
        stats: { movementRange: 1, luck: 0 },
        traits: [],
        persistentInventory: [],
        xp: 0,
        sensedTypes: [],
        sensesMade: 0,
        pokesMade: 0,
        hasFoundZoe: false,
        zoeLevelsCompleted: 0,
        essence: 0,
        systemChaos: 0.5,
        systemOrder: 0.5,
        orderContributions: 0,
        levelsWithPositiveOrder: 0,
        uniqueSensedTypes: []
    },
    
    // Metrics tracking
    metrics: null,
    recentMetrics: null,
    
    /**
     * Initializes the game state
     */
    init() {
        // Load saved progress if available
        const savedProgress = JSON.parse(localStorage.getItem('playerProgress'));
        if (savedProgress) {
            this.progress = savedProgress;
        }
        
        // Initialize metrics trackers
        this.metrics = Object.create(MetricsTracker);
        this.recentMetrics = Object.create(MetricsTracker);
        
        // Calculate initial energy based on grid size
        this.resetPlayerState();
    },
    
    /**
     * Resets player state for a new level
     */
    resetPlayerState() {
        this.player.currentRow = 0;
        this.player.currentCol = 0;
        this.player.energy = 5 * (this.grid.rows + this.grid.cols - 2);
        this.player.movementPoints = this.progress.stats.movementRange;
        this.player.turnCount = 0;
        this.player.currentLevelSenses = 0;
        this.player.moveCounter = 0;
        this.player.hasUsedSenserBonus = false;
        this.player.currentAction = null;
        this.level.temporaryInventory = [];
        this.isActive = true;
    },
    
    /**
     * Saves current progress to localStorage
     */
    saveProgress() {
        localStorage.setItem('playerProgress', JSON.stringify(this.progress));
    },
    
    /**
     * Resets all progress (for testing/debugging)
     */
    resetAllProgress() {
        this.progress = {
            stats: { movementRange: 1, luck: 0 },
            traits: [],
            persistentInventory: [],
            xp: 0,
            sensedTypes: [],
            sensesMade: 0,
            pokesMade: 0,
            hasFoundZoe: false,
            zoeLevelsCompleted: 0,
            essence: 0,
            systemChaos: 0.5,
            systemOrder: 0.5,
            orderContributions: 0,
            levelsWithPositiveOrder: 0,
            uniqueSensedTypes: []
        };
        this.saveProgress();
    },
    
    /**
     * Updates grid dimensions
     * @param {number} rows - New row count
     * @param {number} cols - New column count
     */
    updateGridSize(rows, cols) {
        if (rows >= 3 && cols >= 3 && rows <= 20 && cols <= 20) {
            this.grid.rows = rows;
            this.grid.cols = cols;
            return true;
        }
        return false;
    }
};

let isGameActive = true; // Tracks if the game is active or finished
let tileData; // Declare tileData in the outer scope
/**
 * MetricsTracker - Object to track and manage game metrics
 * Handles recording and calculating various gameplay statistics
 */
const MetricsTracker = {
    // Core metrics
    turnsTaken: 0,
    sensesMade: 0,
    pokesMade: 0,
    energyUsedForMovement: 0,
    energyUsedForExploration: 0,
    movesMade: 0,
    restsTaken: 0,
    tilesExplored: 0,
    specialTilesInteracted: 0,

    // Update methods
    incrementTurns() { this.turnsTaken++; },
    incrementSenses() { this.sensesMade++; },
    incrementPokes() { this.pokesMade++; },
    addEnergyForMovement(cost) { this.energyUsedForMovement += cost; },
    addEnergyForExploration(cost) { this.energyUsedForExploration += cost; },
    incrementMoves() { this.movesMade++; },
    incrementRests() { this.restsTaken++; },
    incrementTilesExplored() { this.tilesExplored++; },
    incrementSpecialTiles() { this.specialTilesInteracted++; },

    // Reset for new levels
    reset() {
        this.turnsTaken = 0;
        this.sensesMade = 0;
        this.pokesMade = 0;
        this.energyUsedForMovement = 0;
        this.energyUsedForExploration = 0;
        this.movesMade = 0;
        this.restsTaken = 0;
        this.tilesExplored = 0;
        this.specialTilesInteracted = 0;
    },

    // Derived metrics
    getEnergyUsageRatio() {
        const totalEnergy = this.energyUsedForMovement + this.energyUsedForExploration;
        return totalEnergy > 0 ? this.energyUsedForMovement / totalEnergy : 0;
    },
    getMovementEfficiency(safestPathLength) {
        return this.movesMade > 0 ? safestPathLength / this.movesMade : 0;
    }
};

let victoryScreenContent = '';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize game state
    GameState.init();
    
    // Extract frequently used values from state for backward compatibility
    // This helps with the transition to the new state management system
    let rows = GameState.grid.rows;
    let cols = GameState.grid.cols;
    const hexVisualWidth = GameState.grid.hexVisualWidth;
    const hexHeight = GameState.grid.hexHeight;
    const rowOffset = GameState.grid.rowOffset;
    const colOffset = GameState.grid.colOffset;
    let turnCount = GameState.player.turnCount;
    let currentRow = GameState.player.currentRow;
    let currentCol = GameState.player.currentCol;
    let currentLevelSenses = GameState.player.currentLevelSenses;
    let moveCounter = GameState.player.moveCounter;
    let hasUsedsenserBonus = GameState.player.hasUsedSenserBonus;
    let currentAction = GameState.player.currentAction;
    let energy = GameState.player.energy;
    let movementPoints = GameState.player.movementPoints;
    
    // Extract progress data
    let { stats, traits, persistentInventory, xp, sensedTypes, sensesMade, pokesMade, 
          hasFoundZoe, zoeLevelsCompleted, essence, systemChaos, systemOrder, 
          orderContributions, uniquesensedTypes } = GameState.progress;
    
    let temporaryInventory = GameState.level.temporaryInventory;
    let metrics = GameState.metrics;
    let recentMetrics = GameState.recentMetrics;

    // Initial grid size and constants
    let turnCount = 0;
    let currentRow = 0;
    let currentCol = 0;
    let currentLevelSenses = 0; // For Explorer trait
    let moveCounter = 0; // For Pathfinder energy cost
    let hasUsedsenserBonus = false; // For senser free reveal
    let currentAction = null; // 'move', 'sense', 'poke', or 'stabilize'
    let energy = 5 * (rows + cols - 2); // Starting energy
    let movementPoints = 1; // Base MP per turn

    /**
     * Creates particle effects in the game background
     * @param {number} count - Number of particles to create
     */
    function createParticles(count) {
        const container = document.createElement('div');
        container.classList.add('particle-container');
        document.body.appendChild(container);
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${5 + Math.random() * 8}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(particle);
        }
    }
    createParticles(25); // Initialize particles on load

    // DOM elements
    const turnDisplay = document.getElementById('turn-counter');
    const statsDisplay = document.getElementById('stats-display');
    const traitsDisplay = document.getElementById('traits-display');
    const tempInventoryDisplay = document.getElementById('temp-inventory-display');
    const persistentInventoryDisplay = document.getElementById('persistent-inventory-display');
    const energyDisplay = document.getElementById('energy-display');

    /**
     * Highlights tiles based on the current action
     * @param {string} action - Current action ('move', 'sense', 'poke', or 'stabilize')
     */
    function highlightTiles(action) {
        const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
        document.querySelectorAll('.hex-container').forEach(container => {
            const row = parseInt(container.getAttribute('data-row'));
            const col = parseInt(container.getAttribute('data-col'));
            container.classList.remove('highlight-move', 'highlight-sense', 'highlight-poke', 'highlight-stabilize');
            if (action === 'move' && adjacentTiles.some(t => t.row === row && t.col === col)) {
                container.classList.add('highlight-move');
            } else if (action === 'sense' || action === 'poke' || action === 'stabilize') {
                if ((row === currentRow && col === currentCol) || adjacentTiles.some(t => t.row === row && t.col === col)) {
                    container.classList.add(action === 'sense' ? 'highlight-sense' : action === 'poke' ? 'highlight-poke' : 'highlight-stabilize');
                }
            }
        });
    }

    /**
     * Updates visible tiles based on player's vision range
     * Clears fog of war permanently for explored tiles
     */
    function updateVision() {
        const visionRange = traits.includes('zoeMaster') ? 3 : traits.includes('zoeInitiate') ? 2 : 1;
        const visibleTiles = getTilesInRange(currentRow, currentCol, visionRange);

        visibleTiles.forEach(tile => {
            tileData[tile.row][tile.col].explored = true;
        });

        document.querySelectorAll('.hex-container').forEach(container => {
            const row = parseInt(container.getAttribute('data-row'));
            const col = parseInt(container.getAttribute('data-col'));
            if (tileData[row][col].explored || visibleTiles.some(t => t.row === row && t.col === col)) {
                container.classList.remove('unexplored');
            } else {
                container.classList.add('unexplored');
            }
        });
    }

    /**
     * Gets all tiles within a specified range from a position
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {number} range - Vision range
     * @returns {Array} Array of tile positions within range
     */
    function getTilesInRange(row, col, range) {
        const tiles = [];
        for (let r = Math.max(0, row - range); r <= Math.min(rows - 1, row + range); r++) {
            for (let c = Math.max(0, col - range); c <= Math.min(cols - 1, col + range); c++) {
                const distance = Math.max(Math.abs(r - row), Math.abs(c - col));
                if (distance <= range) tiles.push({ row: r, col: c });
            }
        }
        return tiles;
    }

    /**
     * Creates the initial tile data structure
     * @param {number} rows - Number of rows in the grid
     * @param {number} cols - Number of columns in the grid
     * @returns {Array} 2D array of tile data
     */
    function createTileData(rows, cols) {
        const tileData = [];
        for (let row = 0; row < rows; row++) {
            tileData[row] = [];
            for (let col = 0; col < cols; col++) {
                tileData[row][col] = {
                    type: 'normal',
                    effects: [],
                    state: 'active',
                    explored: false,
                    chaos: 0.5, // Default chaos level
                    order: 0.5  // Default order level
                };
            }
        }
        return tileData;
    }

    /**
     * Gets positions that are not part of the main path
     * @param {number} rows - Number of rows in the grid
     * @param {number} cols - Number of columns in the grid
     * @returns {Array} Array of positions not on the main path
     */
    function getNonPathPositions(rows, cols) {
        const path = [];
        for (let col = 0; col < cols; col++) path.push({ row: 0, col });
        for (let row = 1; row < rows; row++) path.push({ row, col: cols - 1 });

        const nonPathPositions = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const isPath = path.some(p => p.row === row && p.col === col);
                const isStartOrGoal = (row === 0 && col === 0) || (row === rows - 1 && col === cols - 1);
                if (!isPath && !isStartOrGoal) {
                    nonPathPositions.push({ row, col });
                }
            }
        }
        return nonPathPositions;
    }

    /**
     * Places different tile types on the grid
     * @param {Array} tileData - 2D array of tile data
     * @param {number} rows - Number of rows in the grid
     * @param {number} cols - Number of columns in the grid
     */
    function placeTiles(tileData, rows, cols) {
        tileData[rows - 1][cols - 1].type = 'goal';
        let nonPathPositions = getNonPathPositions(rows, cols);
        for (let i = nonPathPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nonPathPositions[i], nonPathPositions[j]] = [nonPathPositions[j], nonPathPositions[i]];
        }

        const gridSize = Math.min(rows, cols);
        const blocksToPlace = gridSize >= 3 ? 2 * Math.floor((gridSize - 2) / 2) : 0;
        for (let i = 0; i < blocksToPlace && nonPathPositions.length > 0; i++) {
            const pos = nonPathPositions.shift();
            tileData[pos.row][pos.col].type = 'blocked';
        }

        const waterTileCount = Math.floor(blocksToPlace / 2);
        for (let i = 0; i < waterTileCount && nonPathPositions.length > 0; i++) {
            const pos = nonPathPositions.shift();
            tileData[pos.row][pos.col].type = 'water';
        }

        if (!hasFoundZoe) {
            const zoeRow = 2;
            const zoeCol = 2;
            tileData[zoeRow][zoeCol].type = 'zoe';
            nonPathPositions = nonPathPositions.filter(pos => !(pos.row === zoeRow && pos.col === zoeCol));
        }

        if (nonPathPositions.length > 0) {
            const pos = nonPathPositions.shift();
            tileData[pos.row][pos.col].type = 'key';
        }

        const energyTileCount = Math.floor(gridSize / 2);
        for (let i = 0; i < energyTileCount && nonPathPositions.length > 0; i++) {
            const pos = nonPathPositions.shift();
            tileData[pos.row][pos.col].type = 'energy';
        }
    }

    /**
     * Builds the visual hex grid based on tile data
     * @param {number} rows - Number of rows in the grid
     * @param {number} cols - Number of columns in the grid
     * @param {Array} tileData - 2D array of tile data
     */
    function buildGrid(rows, cols, tileData) {
        const grid = document.querySelector('.grid');
        if (!grid) {
            console.error('Grid element not found in HTML');
            return;
        }
        grid.innerHTML = '';
        const totalWidth = (cols - 1) * colOffset + hexVisualWidth;
        const totalHeight = (rows - 1) * rowOffset + hexHeight;
        grid.style.width = `${totalWidth}px`;
        grid.style.height = `${totalHeight}px`;
        grid.style.position = 'relative';

        for (let row = 0; row < rows; row++) {
            const hexRow = document.createElement('div');
            hexRow.classList.add('hex-row');
            hexRow.style.position = 'absolute';
            hexRow.style.top = `${row * rowOffset}px`;
            hexRow.style.left = '0';

            for (let col = 0; col < cols; col++) {
                const hexContainer = document.createElement('div');
                hexContainer.classList.add('hex-container');
                hexContainer.setAttribute('data-row', row);
                hexContainer.setAttribute('data-col', col);

                const isOddRow = row % 2 === 1;
                const rowShift = isOddRow ? hexVisualWidth / 2 : 0;
                const hexLeft = col * colOffset + rowShift;

                hexContainer.style.position = 'absolute';
                hexContainer.style.left = `${hexLeft}px`;
                hexContainer.style.top = '0';

                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', hexVisualWidth);
                svg.setAttribute('height', hexHeight);
                svg.setAttribute('viewBox', '0 0 86.6 100');
                svg.style.overflow = 'visible';
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M43.3 0 L86.6 25 L86.6 75 L43.3 100 L0 75 L0 25 Z');
                svg.appendChild(path);
                hexContainer.appendChild(svg);

                const character = document.createElement('div');
                character.classList.add('character');
                hexContainer.appendChild(character);

                const tileType = tileData[row][col].type;
                hexContainer.classList.add(tileType);

                if (!tileData[row][col].explored) {
                    hexContainer.classList.add('unexplored');
                }

                hexRow.appendChild(hexContainer);
            }
            grid.appendChild(hexRow);
        }
    }

    /**
     * Attaches event listeners to the victory screen elements
     */
    function attachVictoryScreenListeners() {
        const statsWindow = document.getElementById('stats-window');
        document.getElementById('view-stats-btn').addEventListener('click', () => {
            restoreStatsWindow();
            updateStatsWindow();
            statsWindow.style.display = 'block';
        });
        document.getElementById('next-level-btn').addEventListener('click', () => {
            statsWindow.style.display = 'none';
            isGameActive = true;
            startGame();
        });
        document.getElementById('upgrade-btn').addEventListener('click', () => {
            if (essence >= 5) {
                essence -= 5;
                stats.movementRange += 1;
                localStorage.setItem('playerProgress', JSON.stringify(progress));
                updateUI();
                alert('Movement range increased by 1!');
            } else {
                alert('Not enough Essence!');
            }
        });
    }

    /**
     * Ends the current turn and resets movement points
     */
    function endTurn() {
        if (!GameState.isActive) {
            console.log("Level complete—cannot end turn!");
            return;
        }
        
        if (GameState.player.movementPoints > 0) {
            const confirmEnd = confirm("You still have resources left. Are you sure you want to end your turn?");
            if (!confirmEnd) return;
        }
        
        GameState.player.movementPoints = GameState.progress.stats.movementRange; // Use upgraded range
        GameState.player.turnCount++;
        turnCount = GameState.player.turnCount; // Update local variable for compatibility
        
        GameState.metrics.incrementTurns();
        GameState.recentMetrics.incrementTurns();
        
        updateUI();
        highlightTiles(null);
        
        console.log(`Turn ${GameState.player.turnCount} ended. MP reset to ${GameState.player.movementPoints}.`);
    }

    /**
     * Allows player to rest to gain energy at the cost of ending turn
     */
    function rest() {
        if (!GameState.isActive) {
            console.log("Level complete—cannot rest!");
            return;
        }
        
        const confirmRest = confirm("This ends the turn and lets you rest for 10 energy points. Are you sure?");
        if (confirmRest) {
            GameState.player.energy += 10;
            energy = GameState.player.energy; // Update local variable for compatibility
            
            GameState.player.movementPoints = 0;
            movementPoints = 0; // Update local variable for compatibility
            
            GameState.metrics.incrementRests();
            GameState.recentMetrics.incrementRests();
            
            endTurn();
        }
    }

    /**
     * Updates the statistics window with current metrics
     */
    function updateStatsWindow() {
        const safeUpdate = (id, text) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            } else {
                console.warn(`Element with id '${id}' not found.`);
            }
        };
        safeUpdate('recent-turns', `Turns: ${recentMetrics.turnsTaken}`);
        safeUpdate('recent-senses', `Senses: ${recentMetrics.sensesMade}`);
        safeUpdate('recent-pokes', `Pokes: ${recentMetrics.pokesMade}`);
        const recentEnergyRatio = recentMetrics.getEnergyUsageRatio().toFixed(2);
        safeUpdate('recent-energy-ratio', `Energy Ratio: ${recentEnergyRatio}`);
        const safestPathLength = 2 * (Math.min(rows, cols) - 1);
        const recentEfficiency = recentMetrics.getMovementEfficiency(safestPathLength).toFixed(2);
        safeUpdate('recent-efficiency', `Efficiency: ${recentEfficiency}`);
        safeUpdate('general-turns', `Total Turns: ${progress.totalTurns || 0}`);
        safeUpdate('general-senses', `Total Senses: ${progress.sensesMade || 0}`);
        safeUpdate('general-pokes', `Total Pokes: ${progress.pokesMade || 0}`);
        safeUpdate('general-energy-ratio', `Energy Ratio: N/A`);
        safeUpdate('general-efficiency', `Efficiency: N/A`);
    }

    document.getElementById('stats-btn').addEventListener('click', () => {
        restoreStatsWindow();
        updateStatsWindow();
        document.getElementById('stats-window').style.display = 'block';
    });

    document.getElementById('close-stats-btn').addEventListener('click', () => {
        document.getElementById('stats-window').style.display = 'none';
    });

    /**
     * Displays the game over screen when player runs out of energy
     */
    function showLoseScreen() {
        const statsWindow = document.getElementById('stats-window');
        if (statsWindow) {
            statsWindow.innerHTML = `
                <h2>Energy Depleted!</h2>
                <p>You ran out of energy before reaching the goal.</p>
                <p>Turns: ${turnCount}</p>
                <p>Senses Made: ${progress.sensesMade}</p>
                <p>Pokes Made: ${progress.pokesMade}</p>
                <button id="restart-btn">Restart Level</button>
                <button id="view-stats-btn">View Stats</button>
            `;
            statsWindow.style.display = 'block';
            document.getElementById('restart-btn').addEventListener('click', () => {
                statsWindow.style.display = 'none';
                isGameActive = true;
                startGame();
            });
            document.getElementById('view-stats-btn').addEventListener('click', () => {
                restoreStatsWindow();
                updateStatsWindow();
                document.getElementById('stats-window').style.display = 'block';
            });
        }
        isGameActive = false;
    }

    /**
     * Restores the stats window to its default state
     */
    function restoreStatsWindow() {
        const statsWindow = document.getElementById('stats-window');
        let buttonText = isGameActive ? "Close" : "Back to Victory Screen";
        statsWindow.innerHTML = `
            <div class="stats-columns">
                <div class="column recent-knowledge">
                    <h2>Recent Knowledge</h2>
                    <p id="recent-turns">Turns: 0</p>
                    <p id="recent-senses">Senses: 0</p>
                    <p id="recent-pokes">Pokes: 0</p>
                    <p id="recent-energy-ratio">Energy Ratio: 0.00</p>
                    <p id="recent-efficiency">Efficiency: 0.00</p>
                </div>
                <div class="column general-stats">
                    <h2>General Stats</h2>
                    <p id="general-turns">Total Turns: 0</p>
                    <p id="general-senses">Total Senses: 0</p>
                    <p id="general-pokes">Total Pokes: 0</p>
                    <p id="general-energy-ratio">Energy Ratio: N/A</p>
                    <p id="general-efficiency">Efficiency: N/A</p>
                </div>
            </div>
            <button id="close-stats-btn">${buttonText}</button>
        `;
        document.getElementById('close-stats-btn').addEventListener('click', () => {
            if (isGameActive) {
                statsWindow.style.display = 'none';
            } else {
                if (victoryScreenContent) {
                    statsWindow.innerHTML = victoryScreenContent;
                    statsWindow.style.display = 'block';
                    attachVictoryScreenListeners();
                } else {
                    statsWindow.style.display = 'none';
                }
            }
        });
    }

    /**
     * Initializes or restarts the game with current settings
     */
    function startGame() {
        console.log("Starting game...");
        
        // Reset metrics
        GameState.metrics.reset();
        GameState.recentMetrics.reset();
        
        // Reset player state
        GameState.resetPlayerState();
        
        // Update local variables for compatibility
        rows = GameState.grid.rows;
        cols = GameState.grid.cols;
        turnCount = GameState.player.turnCount;
        currentRow = GameState.player.currentRow;
        currentCol = GameState.player.currentCol;
        currentLevelSenses = GameState.player.currentLevelSenses;
        moveCounter = GameState.player.moveCounter;
        hasUsedsenserBonus = GameState.player.hasUsedSenserBonus;
        currentAction = GameState.player.currentAction;
        energy = GameState.player.energy;
        movementPoints = GameState.player.movementPoints;
        temporaryInventory = GameState.level.temporaryInventory;
        
        // Create and initialize tile data
        GameState.level.tileData = createTileData(rows, cols);
        tileData = GameState.level.tileData; // Update global reference
        
        // Place tiles and build grid
        placeTiles(tileData, rows, cols);
        buildGrid(rows, cols, tileData);

        const hexContainers = document.querySelectorAll('.hex-container');
        hexContainers.forEach(container => {
            container.addEventListener('click', () => {
                if (!isGameActive) return;
                const clickedRow = parseInt(container.getAttribute('data-row'));
                const clickedCol = parseInt(container.getAttribute('data-col'));
                const tile = tileData[clickedRow][clickedCol];
                const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
                const isAdjacent = adjacentTiles.some(t => t.row === clickedRow && t.col === clickedCol);
                const isCurrentTile = (clickedRow === currentRow && clickedCol === currentCol);

                if (currentAction === 'move' && isAdjacent && tile.type !== 'blocked' && tile.type !== 'water') {
                    if (movementPoints < 1) {
                        const feedbackMessage = document.getElementById('feedback-message');
                        if (feedbackMessage) {
                            feedbackMessage.textContent = "No movement points left!";
                            feedbackMessage.style.display = 'block';
                            setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
                        }
                        return;
                    }
                    if (energy <= 0) {
                        showLoseScreen();
                        return;
                    }

                    metrics.incrementMoves();
                    recentMetrics.incrementMoves();
                    const energyCost = traits.includes('pathfinder') && moveCounter % 2 !== 0 ? 0 : 1;
                    metrics.addEnergyForMovement(energyCost);
                    recentMetrics.addEnergyForMovement(energyCost);
                    moveCounter++;
                    const currentHex = document.querySelector(`.hex-container[data-row="${currentRow}"][data-col="${currentCol}"]`);
                    if (currentHex) currentHex.querySelector('.character').style.display = 'none';
                    currentRow = clickedRow;
                    currentCol = clickedCol;
                    container.querySelector('.character').style.display = 'block';

                    if (!traits.includes('pathfinder') || moveCounter % 2 === 0) {
                        energy -= 1;
                    }
                    movementPoints -= 1;

                    if (tile.type === 'zoe' || tile.type === 'key' || tile.type === 'energy') {
                        metrics.incrementSpecialTiles();
                        recentMetrics.incrementSpecialTiles();
                    }
                    if (!tile.explored) {
                        metrics.incrementTilesExplored();
                        recentMetrics.incrementTilesExplored();
                        tile.explored = true;
                    }

                    if (tile.type === 'zoe') {
                        temporaryInventory.push('zoe');
                        tile.type = 'normal';
                        container.classList.remove('zoe');
                        const goalTile = document.querySelector(`.hex-container[data-row="${rows - 1}"][data-col="${cols - 1}"]`);
                        if (goalTile) goalTile.classList.add('goal-visible');
                        const feedbackMessage = document.getElementById('feedback-message');
                        if (feedbackMessage) {
                            feedbackMessage.textContent = "You've grasped the spark of life, igniting a faint sense of purpose.";
                            feedbackMessage.style.display = 'block';
                            setTimeout(() => { feedbackMessage.style.display = 'none'; }, 3000);
                        }
                    }
                    if (tile.type === 'key') {
                        temporaryInventory.push('key');
                        tile.type = 'normal';
                        container.classList.remove('key');
                    }
                    if (tile.type === 'energy') {
                        let energyGain = 5;
                        if (traits.includes('explorer')) energyGain += 1;
                        energy += energyGain;
                        tile.type = 'normal';
                        container.classList.remove('energy');
                    }

                    updateVision();
                    updateUI();
                    highlightTiles(currentAction);

                    if (energy <= 0) {
                        showLoseScreen();
                        return;
                    }
                } else if (currentAction === 'sense' && (isCurrentTile || isAdjacent)) {
                    const energyCost = traits.includes('zoeAdept') ? (isCurrentTile ? 2 : 1) : (isCurrentTile ? 4 : 2);
                    if (energy < energyCost) {
                        showLoseScreen();
                        return;
                    }

                    metrics.incrementSenses();
                    recentMetrics.incrementSenses();
                    metrics.addEnergyForExploration(energyCost);
                    recentMetrics.addEnergyForExploration(energyCost);
                    if (!tile.explored) {
                        metrics.incrementTilesExplored();
                        recentMetrics.incrementTilesExplored();
                        tile.explored = true;
                    }

                    energy -= energyCost;
                    progress.sensedTypes.push(tile.type);
                    progress.sensesMade++;
                    currentLevelSenses++;
                    if (!uniquesensedTypes.includes(tile.type)) {
                        uniquesensedTypes.push(tile.type);
                    }
                    const feedbackMessage = document.getElementById('feedback-message');
                    if (feedbackMessage) {
                        feedbackMessage.textContent = `Sensed a ${tile.type} tile!`;
                        feedbackMessage.style.display = 'block';
                        if (traits.includes('senser') && !hasUsedsenserBonus && !isCurrentTile) {
                            hasUsedsenserBonus = true;
                            const adjacent = getAdjacentTiles(currentRow, currentCol);
                            const randomAdj = adjacent[Math.floor(Math.random() * adjacent.length)];
                            const adjTile = tileData[randomAdj.row][randomAdj.col];
                            progress.sensedTypes.push(adjTile.type);
                            if (!uniquesensedTypes.includes(adjTile.type)) {
                                uniquesensedTypes.push(adjTile.type);
                            }
                            currentLevelSenses++;
                            feedbackMessage.textContent += ` Bonus: Sensed an adjacent ${adjTile.type} tile for free!`;
                        }
                        setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
                    }
                    updateUI();

                    if (energy <= 0) {
                        showLoseScreen();
                        return;
                    }
                } else if (currentAction === 'poke' && (isCurrentTile || isAdjacent)) {
                    const energyCost = traits.includes('zoeAdept') ? (isCurrentTile ? 2 : 1) : (isCurrentTile ? 4 : 2);
                    if (energy < energyCost) {
                        showLoseScreen();
                        return;
                    }
                    energy -= energyCost;
                    progress.pokesMade++;
                    const feedbackMessage = document.getElementById('feedback-message');
                    if (feedbackMessage) {
                        feedbackMessage.textContent = `Poked and revealed a ${tile.type} tile!`;
                        feedbackMessage.style.display = 'block';
                        setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
                    }
                    updateUI();

                    if (energy <= 0) {
                        showLoseScreen();
                        return;
                    }

                    metrics.incrementPokes();
                    recentMetrics.incrementPokes();
                    metrics.addEnergyForExploration(energyCost);
                    recentMetrics.addEnergyForExploration(energyCost);
                    if (!tile.explored) {
                        metrics.incrementTilesExplored();
                        recentMetrics.incrementTilesExplored();
                        tile.explored = true;
                    }
                } else if (currentAction === 'stabilize' && (isCurrentTile || isAdjacent)) {
                    const energyCost = 3;
                    if (energy < energyCost) {
                        showLoseScreen();
                        return;
                    }
                    energy -= energyCost;
                    tile.chaos = Math.max(0, tile.chaos - 0.2);
                    tile.order = 1 - tile.chaos;
                    progress.essence += 1;
                    const feedbackMessage = document.getElementById('feedback-message');
                    if (feedbackMessage) {
                        feedbackMessage.textContent = `Stabilized tile! Chaos: ${(tile.chaos * 100).toFixed(0)}%, Order: ${(tile.order * 100).toFixed(0)}%. Gained 1 Essence.`;
                        feedbackMessage.style.display = 'block';
                        setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
                    }
                    updateUI();
                } else {
                    const feedbackMessage = document.getElementById('feedback-message');
                    if (feedbackMessage) {
                        feedbackMessage.textContent = currentAction === 'move' ?
                            "You can only move to adjacent, non-blocked tiles!" :
                            "You can only sense, poke, or stabilize adjacent tiles or your current tile!";
                        feedbackMessage.style.display = 'block';
                        setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
                    }
                }

                // Victory condition
                if (currentRow === rows - 1 && currentCol === cols - 1) {
                    if (!progress.hasFoundZoe && !temporaryInventory.includes('zoe')) {
                        const feedbackMessage = document.getElementById('feedback-message');
                        if (feedbackMessage) {
                            feedbackMessage.textContent = "You need Zoe to proceed!";
                            feedbackMessage.style.display = 'block';
                            setTimeout(() => { feedbackMessage.style.display = 'none'; }, 3000);
                        }
                    } else if (energy > 0) {
                        const gridSize = Math.min(rows, cols);
                        const pathfinderTurnLimit = gridSize * 2;
                        let totalChaos = 0;
                        for (let r = 0; r < rows; r++) {
                            for (let c = 0; c < cols; c++) {
                                totalChaos += tileData[r][c].chaos;
                            }
                        }
                        const avgChaos = totalChaos / (rows * cols);
                        progress.systemChaos = avgChaos;
                        progress.systemOrder = 1 - avgChaos;
                        
                        const orderContribution = progress.systemOrder - 0.5;
                        progress.orderContributions += orderContribution;

                        if (progress.systemOrder > 0.5) {
                            progress.levelsWithPositiveOrder = (progress.levelsWithPositiveOrder || 0) + 1;
                            if (progress.levelsWithPositiveOrder >= 5 && !traits.includes('orderKeeper')) {
                                traits.push('orderKeeper');
                                alert('Earned Order Keeper trait for completing 5 levels with >50% order!');
                            }
                        }
                        
                        if (currentLevelSenses >= 10 && !traits.includes('senser')) {
                            traits.push('senser');
                        }
                        if (turnCount < pathfinderTurnLimit && !traits.includes('pathfinder')) {
                            traits.push('pathfinder');
                        }
                        if (uniquesensedTypes.length >= 5 && !traits.includes('explorer')) {
                            traits.push('explorer');
                        }

                        let xpGain = 10 + energy;
                        if (!progress.hasFoundZoe && temporaryInventory.includes('zoe')) {
                            progress.hasFoundZoe = true;
                            progress.zoeLevelsCompleted = 1;
                            if (!traits.includes('zoeInitiate')) {
                                traits.push('zoeInitiate');
                            }
                        } else if (progress.hasFoundZoe) {
                            progress.zoeLevelsCompleted += 1;
                            if (progress.zoeLevelsCompleted === 4 && !traits.includes('zoeAdept')) {
                                traits.push('zoeAdept');
                            } else if (progress.zoeLevelsCompleted === 7 && !traits.includes('zoeMaster')) {
                                traits.push('zoeMaster');
                            }
                        }
                        if (temporaryInventory.includes('key') && !traits.includes('Keymaster')) {
                            traits.push('Keymaster');
                            xpGain += 5;
                        }
                        progress.xp += xpGain;
                        xp = progress.xp;
                        progress.traits = traits;
                        progress.uniquesensedTypes = uniquesensedTypes;
                        progress.sensesMade += metrics.sensesMade;
                        progress.pokesMade += metrics.pokesMade;
                        progress.totalTurns = (progress.totalTurns || 0) + metrics.turnsTaken;
                        localStorage.setItem('playerProgress', JSON.stringify(progress));

                        updateUI();

                        const statsWindow = document.getElementById('stats-window');
                        if (statsWindow) {
                            const typeCounts = {};
                            progress.sensedTypes.forEach(type => {
                                typeCounts[type] = (typeCounts[type] || 0) + 1;
                            });
                            const sensedTypesText = Object.entries(typeCounts)
                                .map(([type, count]) => `${type}: ${count}`)
                                .join(', ');
                            const safestPathLength = 2 * (Math.min(rows, cols) - 1);
                            const energyRatio = metrics.getEnergyUsageRatio().toFixed(2);
                            const efficiency = metrics.getMovementEfficiency(safestPathLength).toFixed(2);
                            victoryScreenContent = `
                                <h2>Level Complete!</h2>
                                <p>Essence: ${progress.essence}</p>
                                <p>Turns: ${turnCount}</p>
                                <p>Energy Remaining: ${energy}</p>
                                <p>Senses Made: ${progress.sensesMade}</p>
                                <p>Pokes Made: ${progress.pokesMade}</p>
                                <p>Energy Usage Ratio (Move/Total): ${energyRatio}</p>
                                <p>Movement Efficiency (Safest/Moves): ${efficiency}</p>
                                <p>Sensed Types: ${sensedTypesText || 'None'}</p>
                                <button id="next-level-btn">Next Level</button>
                                <button id="upgrade-btn">Spend 5 Essence: +1 Movement</button>
                                <button id="view-stats-btn">View Stats</button>
                            `;
                            statsWindow.innerHTML = victoryScreenContent;
                            statsWindow.style.display = 'block';
                            attachVictoryScreenListeners();
                            isGameActive = false;
                        }
                    }
                }
            });
        });

        document.querySelectorAll('.character').forEach(char => char.style.display = 'none');
        const startingHex = document.querySelector('.hex-container[data-row="0"][data-col="0"]');
        if (startingHex) {
            const character = startingHex.querySelector('.character');
            if (character) character.style.display = 'block';
        }

        if (progress.hasFoundZoe) {
            const goalTile = document.querySelector(`.hex-container[data-row="${rows - 1}"][data-col="${cols - 1}"]`);
            if (goalTile) goalTile.classList.add('goal-visible');
        }

        currentRow = 0;
        currentCol = 0;
        energy = 5 * (rows + cols - 2);
        temporaryInventory = [];
        turnCount = 0;
        currentLevelSenses = 0;
        moveCounter = 0;
        hasUsedsenserBonus = false;
        currentAction = null;
        movementPoints = stats.movementRange; // Start with upgraded range;
        highlightTiles(null);
        updateVision();
        updateUI();
        isGameActive = true;
        document.getElementById('stats-window').style.display = 'none';
    }

    /**
     * Updates all UI elements with current game state
     */
    function updateUI() {
        if (turnDisplay) turnDisplay.textContent = `Turns: ${turnCount}`;
        if (statsDisplay) statsDisplay.textContent = `Moves: ${stats.movementRange} | Luck: ${stats.luck} | XP: ${xp} | Essence: ${progress.essence}`;
        if (traitsDisplay) traitsDisplay.textContent = `Traits: ${traits.length > 0 ? traits.join(', ') : 'None'}`;
        if (tempInventoryDisplay) tempInventoryDisplay.textContent = `Level Items: ${temporaryInventory.length > 0 ? temporaryInventory.join(', ') : 'None'}`;
        if (persistentInventoryDisplay) persistentInventoryDisplay.textContent = `Persistent Items: ${persistentInventory.length > 0 ? persistentInventory.join(', ') : 'None'}`;
        if (energyDisplay) energyDisplay.textContent = `Energy: ${energy} | MP: ${movementPoints}`;
        const systemBalance = document.getElementById('system-balance');
        if (systemBalance) {
            systemBalance.textContent = `System: ${(progress.systemChaos * 100).toFixed(0)}% Chaos / ${(progress.systemOrder * 100).toFixed(0)}% Order`;
        }
    }

    /**
     * Gets all adjacent tiles to a given position
     * @param {number} row - Current row
     * @param {number} col - Current column
     * @returns {Array} Array of adjacent tile positions
     */
    function getAdjacentTiles(row, col) {
        const isOddRow = row % 2 === 1;
        const adjacent = [
            { row: row - 1, col: col },
            { row: row + 1, col: col },
            { row: row, col: col - 1 },
            { row: row, col: col + 1 },
            { row: row - 1, col: isOddRow ? col + 1 : col - 1 },
            { row: row + 1, col: isOddRow ? col + 1 : col - 1 }
        ];
        return adjacent.filter(tile => tile.row >= 0 && tile.row < rows && tile.col >= 0 && tile.col < cols);
    }

    document.getElementById('move-btn').addEventListener('click', () => {
        currentAction = 'move';
        highlightTiles('move');
    });

    document.getElementById('sense-btn').addEventListener('click', () => {
        currentAction = 'sense';
        highlightTiles('sense');
    });

    document.getElementById('stabilize-btn').addEventListener('click', () => {
        currentAction = 'stabilize';
        highlightTiles('stabilize');
    });

    document.getElementById('poke-btn').addEventListener('click', () => {
        currentAction = 'poke';
        highlightTiles('poke');
    });

    document.getElementById('end-turn-btn').addEventListener('click', endTurn);

    document.getElementById('rest-btn').addEventListener('click', rest);

    startGame();

    const statsWindow = document.getElementById('stats-window');
    statsWindow.addEventListener('click', (e) => {
        if (e.target.id === 'next-level-btn') {
            statsWindow.style.display = 'none';
            isGameActive = true;
            startGame();
        }
    });

    const resizeBtn = document.getElementById('resize-btn');
    if (resizeBtn) {
        resizeBtn.addEventListener('click', () => {
            const newRows = parseInt(document.getElementById('rows-input').value);
            const newCols = parseInt(document.getElementById('cols-input').value);
            
            if (GameState.updateGridSize(newRows, newCols)) {
                // Update local variables for compatibility
                rows = GameState.grid.rows;
                cols = GameState.grid.cols;
                
                startGame();
            } else {
                alert('Please choose rows and columns between 3 and 20.');
            }
        });
    }

    const resetStatsBtn = document.getElementById('reset-stats-btn');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => {
            // Reset all progress
            GameState.resetAllProgress();
            
            // Update local variables for compatibility
            ({ stats, traits, persistentInventory, xp, sensedTypes, sensesMade, pokesMade, 
               hasFoundZoe, zoeLevelsCompleted, essence, systemChaos, systemOrder, 
               orderContributions, uniquesensedTypes } = GameState.progress);
            
            startGame();
        });
    }
});