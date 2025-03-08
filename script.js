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
    
    // Resource system
    resources: {
        energy: 0,      // Used for movement and basic actions
        essence: 0,     // Used for stabilization and evolution
        knowledge: 0,   // Used to unlock new abilities
        stability: 50   // Affects success rate of actions (0-100 scale)
    },
    
    // Resource limits and rates
    resourceLimits: {
        energy: 100,
        essence: 1000,
        knowledge: 500,
        stability: 100
    },
    
    // Resource generation/consumption rates
    resourceRates: {
        energyPerRest: 10,
        essencePerStabilize: 1,
        knowledgePerSense: 2,
        stabilityDecayPerTurn: 1,
        stabilityGainPerStabilize: 5
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
        uniqueSensedTypes: [],
        totalResources: {
            energyGained: 0,
            essenceGained: 0,
            knowledgeGained: 0
        }
    },
    
    // World evolution system
    worldEvolution: {
        age: 0,                  // Increases with each level completed
        globalChaos: 0.8,        // Starting at 80% chaos
        globalOrder: 0.2,        // Starting at 20% order
        stabilityThreshold: 0.4, // Minimum order needed for certain features
        complexityThreshold: 0.6, // Higher order enables more complex features
        tileVariance: 0.2        // How much individual tiles can vary from global state
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
            
            // If we have saved world evolution data, load it
            if (savedProgress.worldEvolution) {
                this.worldEvolution = savedProgress.worldEvolution;
            }
            
            // Initialize resources from saved progress if available
            if (savedProgress.resources) {
                this.resources = savedProgress.resources;
            }
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
        
        // Reset resources for new level
        this.resources.energy = Math.min(this.player.energy * 2, this.resourceLimits.energy);
        // Don't reset essence and knowledge as they persist between levels
        this.resources.stability = 50; // Reset to neutral stability
    },
    
    /**
     * Updates a resource value
     * @param {string} type - Resource type ('energy', 'essence', 'knowledge', 'stability')
     * @param {number} amount - Amount to change (positive or negative)
     * @returns {Object} Updated resource information
     */
    updateResource(type, amount) {
        // Update the resource
        this.resources[type] += amount;
        
        // Enforce limits
        if (type === 'stability') {
            this.resources.stability = Math.max(0, Math.min(this.resourceLimits.stability, this.resources.stability));
        } else {
            this.resources[type] = Math.max(0, Math.min(this.resourceLimits[type], this.resources[type]));
            
            // Track total resources gained (only for positive changes)
            if (amount > 0 && this.progress.totalResources[`${type}Gained`] !== undefined) {
                this.progress.totalResources[`${type}Gained`] += amount;
            }
        }
        
        // For energy, also update the player.energy for backward compatibility
        if (type === 'energy') {
            this.player.energy = this.resources.energy;
        }
        
        // For essence, also update progress.essence for backward compatibility
        if (type === 'essence') {
            this.progress.essence = this.resources.essence;
        }
        
        return {
            type,
            value: this.resources[type],
            change: amount,
            limit: this.resourceLimits[type]
        };
    },
    
    /**
     * Applies stability effects to an action's success chance
     * @param {string} actionType - Type of action ('sense', 'poke', 'stabilize')
     * @param {number} baseChance - Base success chance (0-1)
     * @returns {number} Modified success chance
     */
    applyStabilityToChance(actionType, baseChance) {
        const stability = this.resources.stability;
        let modifier = 0;
        
        // Different actions are affected differently by stability
        switch (actionType) {
            case 'sense':
                // Sensing is easier with higher stability
                modifier = (stability - 50) / 100; // -0.5 to +0.5
                break;
            case 'poke':
                // Poking is more effective with lower stability (more chaos)
                modifier = (50 - stability) / 100; // +0.5 to -0.5
                break;
            case 'stabilize':
                // Stabilizing is easier with higher stability
                modifier = (stability - 50) / 100; // -0.5 to +0.5
                break;
            default:
                modifier = 0;
        }
        
        // Apply the modifier
        const modifiedChance = baseChance + (modifier * 0.3); // Scale the effect
        
        // Ensure the chance stays within 0-1 range
        return Math.max(0.1, Math.min(0.95, modifiedChance));
    },
    
    /**
     * Saves current progress to localStorage
     */
    saveProgress() {
        // Include world evolution data and resources in the saved progress
        this.progress.worldEvolution = this.worldEvolution;
        this.progress.resources = this.resources;
        localStorage.setItem('playerProgress', JSON.stringify(this.progress));
    },
    
    /**
     * Updates progress after completing a level
     * @param {number} xpGain - XP gained from completing the level
     * @param {boolean} foundZoe - Whether Zoe was found in this level
     * @param {boolean} foundKey - Whether a key was found in this level
     * @returns {Object} Updated traits and other information
     */
    completeLevelProgress(xpGain, foundZoe, foundKey) {
        // Update XP
        this.progress.xp += xpGain;
        
        // Handle Zoe discovery
        if (!this.progress.hasFoundZoe && foundZoe) {
            this.progress.hasFoundZoe = true;
            this.progress.zoeLevelsCompleted = 1;
            if (!this.progress.traits.includes('zoeInitiate')) {
                this.progress.traits.push('zoeInitiate');
            }
        } else if (this.progress.hasFoundZoe) {
            this.progress.zoeLevelsCompleted += 1;
            if (this.progress.zoeLevelsCompleted === 4 && !this.progress.traits.includes('zoeAdept')) {
                this.progress.traits.push('zoeAdept');
            } else if (this.progress.zoeLevelsCompleted === 7 && !this.progress.traits.includes('zoeMaster')) {
                this.progress.traits.push('zoeMaster');
            }
        }
        
        // Handle key discovery
        if (foundKey && !this.progress.traits.includes('Keymaster')) {
            this.progress.traits.push('Keymaster');
        }
        
        // Update metrics
        this.progress.sensesMade += this.metrics.sensesMade;
        this.progress.pokesMade += this.metrics.pokesMade;
        this.progress.totalTurns = (this.progress.totalTurns || 0) + this.metrics.turnsTaken;
        
        // Evolve the world
        const worldEvolutionResult = this.evolveWorld();
        
        // Save progress
        this.saveProgress();
        
        return {
            traits: this.progress.traits,
            xp: this.progress.xp,
            essence: this.resources.essence,
            knowledge: this.resources.knowledge,
            worldAge: worldEvolutionResult.newAge,
            globalOrder: worldEvolutionResult.globalOrder,
            globalChaos: worldEvolutionResult.globalChaos
        };
    },
    
    /**
     * Evolves the world state after completing a level
     * @returns {Object} Updated world state information
     */
    evolveWorld() {
        // Increase world age
        this.worldEvolution.age++;
        
        // Calculate new global balance based on player actions
        const orderContribution = this.progress.orderContributions;
        const stabilizationFactor = 0.05 * Math.min(1, this.metrics.tilesExplored / (this.grid.rows * this.grid.cols));
        
        // World evolves toward order but with diminishing returns
        this.worldEvolution.globalOrder = Math.min(0.9, this.worldEvolution.globalOrder + 
            (stabilizationFactor * orderContribution) / (this.worldEvolution.age * 0.5 + 1));
        this.worldEvolution.globalChaos = 1 - this.worldEvolution.globalOrder;
        
        // Adjust thresholds based on world age
        if (this.worldEvolution.age > 5) {
            this.worldEvolution.stabilityThreshold = Math.min(0.6, this.worldEvolution.stabilityThreshold + 0.02);
            this.worldEvolution.complexityThreshold = Math.max(0.4, this.worldEvolution.complexityThreshold - 0.02);
        }
        
        return {
            newAge: this.worldEvolution.age,
            globalOrder: this.worldEvolution.globalOrder,
            globalChaos: this.worldEvolution.globalChaos,
            stabilityThreshold: this.worldEvolution.stabilityThreshold,
            complexityThreshold: this.worldEvolution.complexityThreshold
        };
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
            uniqueSensedTypes: [],
            totalResources: {
                energyGained: 0,
                essenceGained: 0,
                knowledgeGained: 0
            }
        };
        
        // Reset world evolution
        this.worldEvolution = {
            age: 0,
            globalChaos: 0.8,
            globalOrder: 0.2,
            stabilityThreshold: 0.4,
            complexityThreshold: 0.6,
            tileVariance: 0.2
        };
        
        // Reset resources
        this.resources = {
            energy: 0,
            essence: 0,
            knowledge: 0,
            stability: 50
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
    },
    
    /**
     * Updates the system chaos/order balance based on the current level
     * @param {Array} tileData - 2D array of tile data
     * @returns {Object} Updated system balance information
     */
    updateSystemBalance(tileData) {
        let totalChaos = 0;
        const rows = this.grid.rows;
        const cols = this.grid.cols;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                totalChaos += tileData[r][c].chaos;
            }
        }
        
        const avgChaos = totalChaos / (rows * cols);
        this.progress.systemChaos = avgChaos;
        this.progress.systemOrder = 1 - avgChaos;
        
        const orderContribution = this.progress.systemOrder - 0.5;
        this.progress.orderContributions += orderContribution;
        
        if (this.progress.systemOrder > 0.5) {
            this.progress.levelsWithPositiveOrder = (this.progress.levelsWithPositiveOrder || 0) + 1;
            
            // Check for orderKeeper trait
            if (this.progress.levelsWithPositiveOrder >= 5 && !this.progress.traits.includes('orderKeeper')) {
                this.progress.traits.push('orderKeeper');
                return { newTrait: 'orderKeeper' };
            }
        }
        
        return {
            systemChaos: this.progress.systemChaos,
            systemOrder: this.progress.systemOrder,
            levelsWithPositiveOrder: this.progress.levelsWithPositiveOrder
        };
    },
    
    /**
     * Determines the type of a tile based on its chaos level and world age
     * @param {number} chaos - Chaos level of the tile (0-1)
     * @returns {string} The type of the tile
     */
    determineTileType(chaos) {
        const worldAge = this.worldEvolution.age;
        
        // Early game has more basic tile types
        if (worldAge < 3) {
            if (chaos > 0.7) {
                return Math.random() < 0.7 ? 'blocked' : 'water';
            } else if (chaos < 0.3) {
                return Math.random() < 0.7 ? 'normal' : 'energy';
            } else {
                return 'normal';
            }
        }
        // Mid game introduces more variety
        else if (worldAge < 7) {
            if (chaos > 0.8) {
                return 'blocked';
            } else if (chaos > 0.6) {
                return Math.random() < 0.6 ? 'water' : 'normal';
            } else if (chaos > 0.4) {
                return 'normal';
            } else if (chaos > 0.2) {
                return Math.random() < 0.7 ? 'normal' : 'energy';
            } else {
                return 'energy';
            }
        }
        // Late game has full variety
        else {
            if (chaos > 0.8) {
                return 'blocked';
            } else if (chaos > 0.6) {
                return Math.random() < 0.5 ? 'water' : 'normal';
            } else if (chaos > 0.4) {
                return 'normal';
            } else if (chaos > 0.2) {
                return Math.random() < 0.5 ? 'normal' : 'energy';
            } else {
                return 'energy';
            }
        }
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
        const globalChaos = GameState.worldEvolution.globalChaos;
        const variance = GameState.worldEvolution.tileVariance;
        
        for (let row = 0; row < rows; row++) {
            tileData[row] = [];
            for (let col = 0; col < cols; col++) {
                // Calculate chaos level with some variance
                // More variance at the edges of the grid (representing frontier areas)
                const edgeFactor = Math.max(
                    Math.abs(row / rows - 0.5) * 2,
                    Math.abs(col / cols - 0.5) * 2
                );
                const extraVariance = edgeFactor * variance * 0.5;
                
                // Generate chaos value with variance
                let chaos = globalChaos + (Math.random() * 2 - 1) * (variance + extraVariance);
                
                // Ensure chaos stays within 0-1 range
                chaos = Math.max(0.1, Math.min(0.9, chaos));
                
                // Create special pockets of order/chaos
                if (Math.random() < 0.1) {
                    // 10% chance of a special pocket
                    if (Math.random() < 0.5) {
                        // Order pocket
                        chaos = Math.max(0.1, chaos - 0.3);
                    } else {
                        // Chaos pocket
                        chaos = Math.min(0.9, chaos + 0.3);
                    }
                }
                
                tileData[row][col] = {
                    type: 'normal', // Will be set in placeTiles
                    effects: [],
                    state: 'active',
                    explored: false,
                    chaos: chaos,
                    order: 1 - chaos
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
        // Always set the goal tile
        tileData[rows - 1][cols - 1].type = 'goal';
        
        // Get non-path positions
        let nonPathPositions = getNonPathPositions(rows, cols);
        
        // Shuffle non-path positions
        for (let i = nonPathPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nonPathPositions[i], nonPathPositions[j]] = [nonPathPositions[j], nonPathPositions[i]];
        }
        
        // Place Zoe if not found yet
        if (!GameState.progress.hasFoundZoe) {
            const zoeRow = 2;
            const zoeCol = 2;
            tileData[zoeRow][zoeCol].type = 'zoe';
            nonPathPositions = nonPathPositions.filter(pos => !(pos.row === zoeRow && pos.col === zoeCol));
        }
        
        // Place a key
        if (nonPathPositions.length > 0) {
            const keyPos = nonPathPositions.shift();
            tileData[keyPos.row][keyPos.col].type = 'key';
        }
        
        // Determine tile types based on chaos levels
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Skip already assigned tiles (goal, zoe, key)
                if (tileData[row][col].type !== 'normal') {
                    continue;
                }
                
                // Skip the start position
                if (row === 0 && col === 0) {
                    continue;
                }
                
                // Determine tile type based on chaos level
                const chaos = tileData[row][col].chaos;
                const tileType = GameState.determineTileType(chaos);
                tileData[row][col].type = tileType;
            }
        }
        
        // Ensure the path is traversable
        ensureTraversablePath(tileData, rows, cols);
    }
    
    /**
     * Ensures there is a traversable path from start to goal
     * @param {Array} tileData - 2D array of tile data
     * @param {number} rows - Number of rows in the grid
     * @param {number} cols - Number of columns in the grid
     */
    function ensureTraversablePath(tileData, rows, cols) {
        // Define a guaranteed path from start to goal
        // This path will follow the top row and then the rightmost column
        const guaranteedPath = [];
        
        // Add top row to path
        for (let col = 0; col < cols; col++) {
            guaranteedPath.push({ row: 0, col });
        }
        
        // Add rightmost column to path (excluding the top-right corner which is already included)
        for (let row = 1; row < rows; row++) {
            guaranteedPath.push({ row, col: cols - 1 });
        }
        
        // Clear any blocked tiles along the guaranteed path
        guaranteedPath.forEach(pos => {
            if (tileData[pos.row][pos.col].type === 'blocked' || tileData[pos.row][pos.col].type === 'water') {
                tileData[pos.row][pos.col].type = 'normal';
                
                // Also adjust chaos/order levels to be more favorable
                tileData[pos.row][pos.col].chaos = Math.min(tileData[pos.row][pos.col].chaos, 0.6);
                tileData[pos.row][pos.col].order = 1 - tileData[pos.row][pos.col].chaos;
            }
        });
        
        // Verify path using pathfinding
        const pathExists = verifyPath(tileData, 0, 0, rows - 1, cols - 1);
        
        // If no path exists (which shouldn't happen with our guaranteed path, but just in case),
        // create a direct path
        if (!pathExists) {
            console.warn("Path verification failed, creating direct path");
            createDirectPath(tileData, 0, 0, rows - 1, cols - 1);
        }
    }
    
    /**
     * Verifies if a path exists from start to goal using breadth-first search
     * @param {Array} tileData - 2D array of tile data
     * @param {number} startRow - Starting row
     * @param {number} startCol - Starting column
     * @param {number} goalRow - Goal row
     * @param {number} goalCol - Goal column
     * @returns {boolean} Whether a path exists
     */
    function verifyPath(tileData, startRow, startCol, goalRow, goalCol) {
        const rows = tileData.length;
        const cols = tileData[0].length;
        
        // Create a visited array
        const visited = Array(rows).fill().map(() => Array(cols).fill(false));
        
        // Queue for BFS
        const queue = [{ row: startRow, col: startCol }];
        visited[startRow][startCol] = true;
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // Check if we've reached the goal
            if (current.row === goalRow && current.col === goalCol) {
                return true;
            }
            
            // Get adjacent tiles
            const adjacentTiles = getAdjacentTiles(current.row, current.col);
            
            // Check each adjacent tile
            for (const tile of adjacentTiles) {
                // Skip if already visited
                if (visited[tile.row][tile.col]) continue;
                
                // Skip if blocked or water
                if (tileData[tile.row][tile.col].type === 'blocked' || 
                    tileData[tile.row][tile.col].type === 'water') continue;
                
                // Mark as visited and add to queue
                visited[tile.row][tile.col] = true;
                queue.push(tile);
            }
        }
        
        // If we've exhausted the queue without finding the goal, no path exists
        return false;
    }
    
    /**
     * Creates a direct path from start to goal
     * @param {Array} tileData - 2D array of tile data
     * @param {number} startRow - Starting row
     * @param {number} startCol - Starting column
     * @param {number} goalRow - Goal row
     * @param {number} goalCol - Goal column
     */
    function createDirectPath(tileData, startRow, startCol, goalRow, goalCol) {
        // Create a path using a simple algorithm
        let currentRow = startRow;
        let currentCol = startCol;
        
        while (currentRow !== goalRow || currentCol !== goalCol) {
            // Move horizontally or vertically toward the goal
            if (currentRow < goalRow) {
                currentRow++;
            } else if (currentRow > goalRow) {
                currentRow--;
            } else if (currentCol < goalCol) {
                currentCol++;
            } else if (currentCol > goalCol) {
                currentCol--;
            }
            
            // Clear any obstacles
            if (tileData[currentRow][currentCol].type === 'blocked' || 
                tileData[currentRow][currentCol].type === 'water') {
                tileData[currentRow][currentCol].type = 'normal';
                
                // Adjust chaos/order levels
                tileData[currentRow][currentCol].chaos = Math.min(tileData[currentRow][currentCol].chaos, 0.5);
                tileData[currentRow][currentCol].order = 1 - tileData[currentRow][currentCol].chaos;
            }
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
                
                // Add chaos/order data attributes
                const chaos = tileData[row][col].chaos;
                const order = tileData[row][col].order;
                
                // Set data attributes for styling
                if (order > 0.7) {
                    hexContainer.setAttribute('data-order', 'high');
                } else if (order > 0.5) {
                    hexContainer.setAttribute('data-order', 'medium');
                } else if (order > 0.3) {
                    hexContainer.setAttribute('data-order', 'low');
                } else if (chaos > 0.7) {
                    hexContainer.setAttribute('data-chaos', 'high');
                } else if (chaos > 0.5) {
                    hexContainer.setAttribute('data-chaos', 'medium');
                }

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
                
                // Adjust path color based on chaos/order
                if (order > 0.7) {
                    path.style.fill = '#00ccff';
                    path.style.filter = 'brightness(1.2)';
                } else if (order > 0.5) {
                    path.style.fill = '#00aa99';
                    path.style.filter = 'brightness(1.1)';
                } else if (chaos > 0.7) {
                    path.style.fill = '#aa3300';
                    path.style.filter = 'brightness(0.9)';
                } else if (chaos > 0.5) {
                    path.style.fill = '#884400';
                    path.style.filter = 'brightness(0.95)';
                }
                
                svg.appendChild(path);
                hexContainer.appendChild(svg);

                const character = document.createElement('div');
                character.classList.add('character');
                hexContainer.appendChild(character);
                
                // Add a visual indicator of the tile's chaos/order state
                const stateIndicator = document.createElement('div');
                stateIndicator.classList.add('tile-state-indicator');
                
                if (order > 0.7) {
                    stateIndicator.classList.add('tile-state-order-high');
                } else if (order > 0.5) {
                    stateIndicator.classList.add('tile-state-order-medium');
                } else if (chaos > 0.7) {
                    stateIndicator.classList.add('tile-state-chaos-high');
                } else if (chaos > 0.5) {
                    stateIndicator.classList.add('tile-state-chaos-medium');
                } else {
                    stateIndicator.classList.add('tile-state-balanced');
                }
                
                hexContainer.appendChild(stateIndicator);

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
            GameState.isActive = true;
            isGameActive = true;
            startGame();
        });
        document.getElementById('upgrade-btn').addEventListener('click', () => {
            const upgradeCost = 5;
            if (GameState.resources.essence >= upgradeCost) {
                // Consume essence
                GameState.updateResource('essence', -upgradeCost);
                essence = GameState.resources.essence; // Update local variable
                
                // Increase movement range
                GameState.progress.stats.movementRange += 1;
                stats.movementRange = GameState.progress.stats.movementRange; // Update local variable
                
                // Save progress
                GameState.saveProgress();
                
                // Update UI
                updateUI();
                
                // Show feedback
                alert(`Movement range increased to ${GameState.progress.stats.movementRange}!`);
                
                // Update the button text to reflect new cost
                const upgradeBtn = document.getElementById('upgrade-btn');
                if (upgradeBtn) {
                    upgradeBtn.textContent = `Spend ${Math.min(5, GameState.resources.essence)} Essence: +1 Movement`;
                }
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
        
        // Reset movement points
        GameState.player.movementPoints = GameState.progress.stats.movementRange;
        movementPoints = GameState.player.movementPoints;
        
        // Increment turn counter
        GameState.player.turnCount++;
        turnCount = GameState.player.turnCount;
        
        // Track metrics
        GameState.metrics.incrementTurns();
        GameState.recentMetrics.incrementTurns();
        
        // Apply stability decay based on world chaos
        const worldChaos = GameState.worldEvolution.globalChaos;
        const stabilityDecay = GameState.resourceRates.stabilityDecayPerTurn * (1 + worldChaos); // More decay in chaotic worlds
        
        // Apply stability decay
        GameState.updateResource('stability', -stabilityDecay);
        
        // Update UI
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
        
        const confirmRest = confirm("This ends the turn and lets you rest to gain energy. Are you sure?");
        if (confirmRest) {
            // Calculate energy gain based on stability
            const stabilityFactor = GameState.resources.stability / 50; // 0.0 to 2.0
            const baseEnergyGain = GameState.resourceRates.energyPerRest;
            const energyGain = Math.round(baseEnergyGain * stabilityFactor);
            
            // Update resources
            GameState.updateResource('energy', energyGain);
            
            // Stability naturally increases slightly when resting
            GameState.updateResource('stability', 2);
            
            // Update local variables for compatibility
            energy = GameState.resources.energy;
            
            // End movement for this turn
            GameState.player.movementPoints = 0;
            movementPoints = 0;
            
            // Track metrics
            GameState.metrics.incrementRests();
            GameState.recentMetrics.incrementRests();
            
            // Show feedback
            const feedbackMessage = document.getElementById('feedback-message');
            if (feedbackMessage) {
                feedbackMessage.textContent = `Rested and gained ${energyGain} energy.`;
                feedbackMessage.style.display = 'block';
                setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
            }
            
            // Update UI with animation
            updateResourceDisplay('energy', GameState.resources.energy, GameState.resourceLimits.energy, true);
            updateResourceDisplay('stability', GameState.resources.stability, GameState.resourceLimits.stability, true);
            
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
        safeUpdate('recent-turns', `Turns: ${GameState.recentMetrics.turnsTaken}`);
        safeUpdate('recent-senses', `Senses: ${GameState.recentMetrics.sensesMade}`);
        safeUpdate('recent-pokes', `Pokes: ${GameState.recentMetrics.pokesMade}`);
        const recentEnergyRatio = GameState.recentMetrics.getEnergyUsageRatio().toFixed(2);
        safeUpdate('recent-energy-ratio', `Energy Ratio: ${recentEnergyRatio}`);
        const safestPathLength = 2 * (Math.min(rows, cols) - 1);
        const recentEfficiency = GameState.recentMetrics.getMovementEfficiency(safestPathLength).toFixed(2);
        safeUpdate('recent-efficiency', `Efficiency: ${recentEfficiency}`);
        safeUpdate('general-turns', `Total Turns: ${GameState.progress.totalTurns || 0}`);
        safeUpdate('general-senses', `Total Senses: ${GameState.progress.sensesMade || 0}`);
        safeUpdate('general-pokes', `Total Pokes: ${GameState.progress.pokesMade || 0}`);
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
                <p>Senses Made: ${GameState.progress.sensesMade}</p>
                <p>Pokes Made: ${GameState.progress.pokesMade}</p>
                <button id="restart-btn">Restart Level</button>
                <button id="view-stats-btn">View Stats</button>
            `;
            statsWindow.style.display = 'block';
            document.getElementById('restart-btn').addEventListener('click', () => {
                statsWindow.style.display = 'none';
                GameState.isActive = true;
                isGameActive = true;
                startGame();
            });
            document.getElementById('view-stats-btn').addEventListener('click', () => {
                restoreStatsWindow();
                updateStatsWindow();
                document.getElementById('stats-window').style.display = 'block';
            });
        }
        GameState.isActive = false;
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
                if (!GameState.isActive) return;
                const clickedRow = parseInt(container.getAttribute('data-row'));
                const clickedCol = parseInt(container.getAttribute('data-col'));
                const tile = tileData[clickedRow][clickedCol];
                const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
                const isAdjacent = adjacentTiles.some(t => t.row === clickedRow && t.col === clickedCol);
                const isCurrentTile = (clickedRow === currentRow && clickedCol === currentCol);

                if (currentAction === 'move' && isAdjacent && tile.type !== 'blocked' && tile.type !== 'water') {
                    if (GameState.player.movementPoints < 1) {
                        const feedbackMessage = document.getElementById('feedback-message');
                        if (feedbackMessage) {
                            feedbackMessage.textContent = "No movement points left!";
                            feedbackMessage.style.display = 'block';
                            setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
                        }
                        return;
                    }
                    
                    // Check energy
                    const energyCost = traits.includes('pathfinder') && GameState.player.moveCounter % 2 !== 0 ? 0 : 1;
                    if (GameState.resources.energy < energyCost) {
                        showLoseScreen();
                        return;
                    }

                    // Track metrics
                    GameState.metrics.incrementMoves();
                    GameState.recentMetrics.incrementMoves();
                    GameState.metrics.addEnergyForMovement(energyCost);
                    GameState.recentMetrics.addEnergyForMovement(energyCost);
                    
                    // Update move counter
                    GameState.player.moveCounter++;
                    moveCounter = GameState.player.moveCounter; // Update local variable
                    
                    // Move character
                    const currentHex = document.querySelector(`.hex-container[data-row="${currentRow}"][data-col="${currentCol}"]`);
                    if (currentHex) currentHex.querySelector('.character').style.display = 'none';
                    
                    // Update position
                    GameState.player.currentRow = clickedRow;
                    GameState.player.currentCol = clickedCol;
                    currentRow = clickedRow; // Update local variable
                    currentCol = clickedCol; // Update local variable
                    
                    container.querySelector('.character').style.display = 'block';

                    // Consume energy if needed
                    if (!traits.includes('pathfinder') || GameState.player.moveCounter % 2 === 0) {
                        GameState.updateResource('energy', -energyCost);
                        energy = GameState.resources.energy; // Update local variable
                    }
                    
                    // Consume movement point
                    GameState.player.movementPoints -= 1;
                    movementPoints = GameState.player.movementPoints; // Update local variable
                    
                    // Stability is affected by the tile's chaos/order
                    const stabilityEffect = (tile.order - 0.5) * 2; // -1.0 to +1.0
                    if (stabilityEffect !== 0) {
                        GameState.updateResource('stability', stabilityEffect);
                    }

                    // Track special tile interactions
                    if (tile.type === 'zoe' || tile.type === 'key' || tile.type === 'energy') {
                        GameState.metrics.incrementSpecialTiles();
                        GameState.recentMetrics.incrementSpecialTiles();
                    }
                    
                    // Mark tile as explored
                    if (!tile.explored) {
                        GameState.metrics.incrementTilesExplored();
                        GameState.recentMetrics.incrementTilesExplored();
                        tile.explored = true;
                    }

                    // Handle special tiles
                    if (tile.type === 'zoe') {
                        GameState.level.temporaryInventory.push('zoe');
                        temporaryInventory = GameState.level.temporaryInventory; // Update local variable
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
                    else if (tile.type === 'key') {
                        GameState.level.temporaryInventory.push('key');
                        temporaryInventory = GameState.level.temporaryInventory; // Update local variable
                        tile.type = 'normal';
                        container.classList.remove('key');
                    }
                    else if (tile.type === 'energy') {
                        let energyGain = 5;
                        if (traits.includes('explorer')) energyGain += 1;
                        
                        // Apply stability bonus/penalty to energy gain
                        const stabilityFactor = GameState.resources.stability / 50; // 0.0 to 2.0
                        energyGain = Math.round(energyGain * stabilityFactor);
                        
                        GameState.updateResource('energy', energyGain);
                        energy = GameState.resources.energy; // Update local variable
                        
                        tile.type = 'normal';
                        container.classList.remove('energy');
                        
                        // Show feedback
                        const feedbackMessage = document.getElementById('feedback-message');
                        if (feedbackMessage) {
                            feedbackMessage.textContent = `Collected energy source! Gained ${energyGain} energy.`;
                            feedbackMessage.style.display = 'block';
                            setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
                        }
                        
                        // Update UI with animation
                        updateResourceDisplay('energy', GameState.resources.energy, GameState.resourceLimits.energy, true);
                    }

                    updateVision();
                    updateUI();
                    highlightTiles(currentAction);

                    if (GameState.resources.energy <= 0) {
                        showLoseScreen();
                        return;
                    }
                } else if (currentAction === 'sense' && (isCurrentTile || isAdjacent)) {
                    const energyCost = traits.includes('zoeAdept') ? (isCurrentTile ? 2 : 1) : (isCurrentTile ? 4 : 2);
                    if (GameState.resources.energy < energyCost) {
                        showLoseScreen();
                        return;
                    }

                    // Consume energy
                    GameState.updateResource('energy', -energyCost);
                    energy = GameState.resources.energy; // Update local variable
                    
                    // Gain knowledge based on tile type and chaos/order ratio
                    const knowledgeGain = Math.round(2 + (tile.order * 3)); // More knowledge from ordered tiles
                    GameState.updateResource('knowledge', knowledgeGain);
                    
                    // Track metrics
                    GameState.metrics.incrementSenses();
                    GameState.recentMetrics.incrementSenses();
                    GameState.metrics.addEnergyForExploration(energyCost);
                    GameState.recentMetrics.addEnergyForExploration(energyCost);
                    
                    if (!tile.explored) {
                        GameState.metrics.incrementTilesExplored();
                        GameState.recentMetrics.incrementTilesExplored();
                        tile.explored = true;
                    }
                    
                    // Update progress data
                    GameState.progress.sensedTypes.push(tile.type);
                    GameState.progress.sensesMade++;
                    GameState.player.currentLevelSenses++;
                    currentLevelSenses = GameState.player.currentLevelSenses; // Update local variable
                    
                    if (!GameState.progress.uniqueSensedTypes.includes(tile.type)) {
                        GameState.progress.uniqueSensedTypes.push(tile.type);
                        uniquesensedTypes = GameState.progress.uniqueSensedTypes; // Update local variable
                    }
                    
                    const feedbackMessage = document.getElementById('feedback-message');
                    if (feedbackMessage) {
                        // Format chaos/order information
                        const chaosPercent = (tile.chaos * 100).toFixed(0);
                        const orderPercent = (tile.order * 100).toFixed(0);
                        
                        // Determine the state description based on chaos/order ratio
                        let stateDescription = "";
                        if (tile.chaos > 0.8) {
                            stateDescription = "highly chaotic";
                        } else if (tile.chaos > 0.6) {
                            stateDescription = "chaotic";
                        } else if (tile.chaos > 0.4) {
                            stateDescription = "balanced";
                        } else if (tile.chaos > 0.2) {
                            stateDescription = "ordered";
                        } else {
                            stateDescription = "highly ordered";
                        }
                        
                        feedbackMessage.textContent = `Sensed a ${tile.type} tile! It is ${stateDescription} (${chaosPercent}% chaos, ${orderPercent}% order). Gained ${knowledgeGain} knowledge.`;
                        feedbackMessage.style.display = 'block';
                        
                        if (traits.includes('senser') && !GameState.player.hasUsedSenserBonus && !isCurrentTile) {
                            GameState.player.hasUsedSenserBonus = true;
                            hasUsedsenserBonus = true; // Update local variable
                            
                            const adjacent = getAdjacentTiles(currentRow, currentCol);
                            const randomAdj = adjacent[Math.floor(Math.random() * adjacent.length)];
                            const adjTile = tileData[randomAdj.row][randomAdj.col];
                            
                            // Gain additional knowledge from bonus sense
                            const bonusKnowledgeGain = Math.round(1 + (adjTile.order * 2));
                            GameState.updateResource('knowledge', bonusKnowledgeGain);
                            
                            GameState.progress.sensedTypes.push(adjTile.type);
                            if (!GameState.progress.uniqueSensedTypes.includes(adjTile.type)) {
                                GameState.progress.uniqueSensedTypes.push(adjTile.type);
                                uniquesensedTypes = GameState.progress.uniqueSensedTypes; // Update local variable
                            }
                            
                            GameState.player.currentLevelSenses++;
                            currentLevelSenses = GameState.player.currentLevelSenses; // Update local variable
                            
                            // Format chaos/order information for bonus tile
                            const adjChaosPercent = (adjTile.chaos * 100).toFixed(0);
                            const adjOrderPercent = (adjTile.order * 100).toFixed(0);
                            
                            // Determine the state description for bonus tile
                            let adjStateDescription = "";
                            if (adjTile.chaos > 0.8) {
                                adjStateDescription = "highly chaotic";
                            } else if (adjTile.chaos > 0.6) {
                                adjStateDescription = "chaotic";
                            } else if (adjTile.chaos > 0.4) {
                                adjStateDescription = "balanced";
                            } else if (adjTile.chaos > 0.2) {
                                adjStateDescription = "ordered";
                            } else {
                                adjStateDescription = "highly ordered";
                            }
                            
                            feedbackMessage.textContent += ` Bonus: Sensed an adjacent ${adjTile.type} tile for free! It is ${adjStateDescription} (${adjChaosPercent}% chaos, ${adjOrderPercent}% order). Gained ${bonusKnowledgeGain} knowledge.`;
                        }
                        setTimeout(() => { feedbackMessage.style.display = 'none'; }, 3000);
                    }
                    
                    // Update UI with animation
                    updateResourceDisplay('energy', GameState.resources.energy, GameState.resourceLimits.energy, true);
                    updateResourceDisplay('knowledge', GameState.resources.knowledge, GameState.resourceLimits.knowledge, true);
                    
                    updateUI();

                    if (GameState.resources.energy <= 0) {
                        showLoseScreen();
                        return;
                    }
                } else if (currentAction === 'poke' && (isCurrentTile || isAdjacent)) {
                    const energyCost = traits.includes('zoeAdept') ? (isCurrentTile ? 2 : 1) : (isCurrentTile ? 4 : 2);
                    if (GameState.resources.energy < energyCost) {
                        showLoseScreen();
                        return;
                    }
                    
                    // Consume energy
                    GameState.updateResource('energy', -energyCost);
                    energy = GameState.resources.energy; // Update local variable
                    
                    // Track metrics
                    GameState.metrics.incrementPokes();
                    GameState.recentMetrics.incrementPokes();
                    GameState.metrics.addEnergyForExploration(energyCost);
                    GameState.recentMetrics.addEnergyForExploration(energyCost);
                    
                    // Update progress data
                    GameState.progress.pokesMade++;
                    pokesMade = GameState.progress.pokesMade; // Update local variable
                    
                    if (!tile.explored) {
                        GameState.metrics.incrementTilesExplored();
                        GameState.recentMetrics.incrementTilesExplored();
                        tile.explored = true;
                    }
                    
                    // Determine poke effect based on tile chaos/order and stability
                    let pokeEffect = "";
                    let resourceEffect = null;
                    
                    // Calculate effect chance based on stability
                    const baseChance = 0.7;
                    const successChance = GameState.applyStabilityToChance('poke', baseChance);
                    const isSuccess = Math.random() < successChance;
                    
                    if (isSuccess) {
                        // Successful poke
                        if (tile.chaos > 0.7) {
                            // Chaotic tile - unpredictable effects
                            const effects = [
                                { name: "energy surge", resource: "energy", amount: Math.round(5 + Math.random() * 5) },
                                { name: "stability fluctuation", resource: "stability", amount: Math.round(-10 + Math.random() * 20) },
                                { name: "knowledge flash", resource: "knowledge", amount: Math.round(2 + Math.random() * 3) }
                            ];
                            resourceEffect = effects[Math.floor(Math.random() * effects.length)];
                        } else if (tile.chaos > 0.4) {
                            // Balanced tile - moderate effects
                            const effects = [
                                { name: "energy flow", resource: "energy", amount: 3 },
                                { name: "stability shift", resource: "stability", amount: 5 },
                                { name: "knowledge insight", resource: "knowledge", amount: 2 }
                            ];
                            resourceEffect = effects[Math.floor(Math.random() * effects.length)];
                        } else {
                            // Ordered tile - predictable, beneficial effects
                            const effects = [
                                { name: "energy harmony", resource: "energy", amount: 4 },
                                { name: "stability reinforcement", resource: "stability", amount: 8 },
                                { name: "knowledge clarity", resource: "knowledge", amount: 3 }
                            ];
                            resourceEffect = effects[Math.floor(Math.random() * effects.length)];
                        }
                        
                        // Apply resource effect
                        if (resourceEffect) {
                            GameState.updateResource(resourceEffect.resource, resourceEffect.amount);
                            pokeEffect = `${resourceEffect.name} (${resourceEffect.amount > 0 ? '+' : ''}${resourceEffect.amount} ${resourceEffect.resource})`;
                            
                            // Update UI with animation
                            updateResourceDisplay(resourceEffect.resource, GameState.resources[resourceEffect.resource], GameState.resourceLimits[resourceEffect.resource], true);
                        }
                    } else {
                        // Failed poke - negative effect
                        const penalty = Math.round(2 + Math.random() * 3);
                        GameState.updateResource('stability', -penalty);
                        pokeEffect = `destabilization (-${penalty} stability)`;
                        
                        // Update UI with animation
                        updateResourceDisplay('stability', GameState.resources.stability, GameState.resourceLimits.stability, true);
                    }
                    
                    const feedbackMessage = document.getElementById('feedback-message');
                    if (feedbackMessage) {
                        feedbackMessage.textContent = `Poked a ${tile.type} tile! Effect: ${pokeEffect}`;
                        feedbackMessage.style.display = 'block';
                        setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2500);
                    }
                    
                    // Update UI with animation for energy
                    updateResourceDisplay('energy', GameState.resources.energy, GameState.resourceLimits.energy, true);
                    
                    updateUI();

                    if (GameState.resources.energy <= 0) {
                        showLoseScreen();
                        return;
                    }
                } else if (currentAction === 'stabilize' && (isCurrentTile || isAdjacent)) {
                    const energyCost = 3;
                    if (GameState.resources.energy < energyCost) {
                        showLoseScreen();
                        return;
                    }
                    
                    // Consume energy
                    GameState.updateResource('energy', -energyCost);
                    energy = GameState.resources.energy; // Update local variable
                    
                    // Calculate stabilization effect based on current chaos level and stability
                    const stabilizationPower = 0.2; // Base stabilization power
                    const chaosResistance = tile.chaos * 0.5; // Higher chaos = more resistance
                    
                    // Apply stability bonus/penalty
                    const stabilityFactor = GameState.resources.stability / 50; // 0.0 to 2.0
                    const effectiveStabilization = stabilizationPower * (1 - chaosResistance) * stabilityFactor;
                    
                    // Apply stabilization effect
                    const oldChaos = tile.chaos;
                    tile.chaos = Math.max(0.1, tile.chaos - effectiveStabilization);
                    tile.order = 1 - tile.chaos;
                    
                    // Calculate essence gained based on how much order was created
                    const orderCreated = tile.order - (1 - oldChaos);
                    const essenceGained = Math.max(1, Math.round(orderCreated * 10));
                    
                    // Update resources
                    GameState.updateResource('essence', essenceGained);
                    GameState.updateResource('stability', GameState.resourceRates.stabilityGainPerStabilize);
                    
                    essence = GameState.resources.essence; // Update local variable
                    
                    // Visual feedback - change tile appearance based on order level
                    if (tile.order > 0.7) {
                        // Highly ordered tiles could have a special appearance
                        container.style.opacity = "1.0";
                        container.style.filter = "brightness(1.2)";
                    } else if (tile.order > 0.5) {
                        container.style.opacity = "0.9";
                        container.style.filter = "brightness(1.1)";
                    }
                    
                    const feedbackMessage = document.getElementById('feedback-message');
                    if (feedbackMessage) {
                        const chaosPercent = (tile.chaos * 100).toFixed(0);
                        const orderPercent = (tile.order * 100).toFixed(0);
                        
                        // Determine effectiveness message
                        let effectivenessMsg = "";
                        if (effectiveStabilization < 0.05) {
                            effectivenessMsg = "The chaos strongly resists your efforts.";
                        } else if (effectiveStabilization < 0.1) {
                            effectivenessMsg = "The chaos resists your efforts.";
                        } else if (effectiveStabilization < 0.15) {
                            effectivenessMsg = "You make some progress against the chaos.";
                        } else {
                            effectivenessMsg = "Your stabilization is very effective!";
                        }
                        
                        feedbackMessage.textContent = `Stabilized tile! ${effectivenessMsg} New balance: ${chaosPercent}% Chaos, ${orderPercent}% Order. Gained ${essenceGained} Essence.`;
                        feedbackMessage.style.display = 'block';
                        setTimeout(() => { feedbackMessage.style.display = 'none'; }, 3000);
                    }
                    
                    // Update UI with animation
                    updateResourceDisplay('energy', GameState.resources.energy, GameState.resourceLimits.energy, true);
                    updateResourceDisplay('essence', GameState.resources.essence, GameState.resourceLimits.essence, true);
                    updateResourceDisplay('stability', GameState.resources.stability, GameState.resourceLimits.stability, true);
                    
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
                    if (!GameState.progress.hasFoundZoe && !GameState.level.temporaryInventory.includes('zoe')) {
                        const feedbackMessage = document.getElementById('feedback-message');
                        if (feedbackMessage) {
                            feedbackMessage.textContent = "You need Zoe to proceed!";
                            feedbackMessage.style.display = 'block';
                            setTimeout(() => { feedbackMessage.style.display = 'none'; }, 3000);
                        }
                    } else if (GameState.player.energy > 0) {
                        const gridSize = Math.min(rows, cols);
                        const pathfinderTurnLimit = gridSize * 2;
                        
                        // Update system balance
                        const balanceResult = GameState.updateSystemBalance(tileData);
                        if (balanceResult.newTrait === 'orderKeeper') {
                            alert('Earned Order Keeper trait for completing 5 levels with >50% order!');
                        }
                        
                        // Check for trait unlocks
                        if (GameState.player.currentLevelSenses >= 10 && !GameState.progress.traits.includes('senser')) {
                            GameState.progress.traits.push('senser');
                            traits = GameState.progress.traits; // Update local variable
                        }
                        
                        if (turnCount < pathfinderTurnLimit && !GameState.progress.traits.includes('pathfinder')) {
                            GameState.progress.traits.push('pathfinder');
                            traits = GameState.progress.traits; // Update local variable
                        }
                        
                        if (GameState.progress.uniqueSensedTypes.length >= 5 && !GameState.progress.traits.includes('explorer')) {
                            GameState.progress.traits.push('explorer');
                            traits = GameState.progress.traits; // Update local variable
                        }

                        // Calculate XP gain
                        let xpGain = 10 + GameState.player.energy;
                        
                        // Complete level progress
                        const foundZoe = GameState.level.temporaryInventory.includes('zoe');
                        const foundKey = GameState.level.temporaryInventory.includes('key');
                        
                        if (foundKey && !GameState.progress.traits.includes('Keymaster')) {
                            xpGain += 5;
                        }
                        
                        const progressResult = GameState.completeLevelProgress(xpGain, foundZoe, foundKey);
                        
                        // Update local variables for compatibility
                        traits = GameState.progress.traits;
                        xp = GameState.progress.xp;
                        essence = GameState.progress.essence;
                        
                        updateUI();

                        // Show victory screen
                        const statsWindow = document.getElementById('stats-window');
                        if (statsWindow) {
                            const typeCounts = {};
                            GameState.progress.sensedTypes.forEach(type => {
                                typeCounts[type] = (typeCounts[type] || 0) + 1;
                            });
                            const sensedTypesText = Object.entries(typeCounts)
                                .map(([type, count]) => `${type}: ${count}`)
                                .join(', ');
                            const safestPathLength = 2 * (Math.min(rows, cols) - 1);
                            const energyRatio = GameState.metrics.getEnergyUsageRatio().toFixed(2);
                            const efficiency = GameState.metrics.getMovementEfficiency(safestPathLength).toFixed(2);
                            
                            // Format world evolution information
                            const worldAge = GameState.worldEvolution.age;
                            const globalChaos = (GameState.worldEvolution.globalChaos * 100).toFixed(0);
                            const globalOrder = (GameState.worldEvolution.globalOrder * 100).toFixed(0);
                            
                            // Determine world state description
                            let worldStateDesc = "";
                            if (GameState.worldEvolution.globalChaos > 0.8) {
                                worldStateDesc = "Primordial Chaos";
                            } else if (GameState.worldEvolution.globalChaos > 0.6) {
                                worldStateDesc = "Emerging Patterns";
                            } else if (GameState.worldEvolution.globalChaos > 0.4) {
                                worldStateDesc = "Balanced Forces";
                            } else if (GameState.worldEvolution.globalChaos > 0.2) {
                                worldStateDesc = "Ordered Systems";
                            } else {
                                worldStateDesc = "Harmonious Order";
                            }
                            
                            victoryScreenContent = `
                                <h2>Level Complete!</h2>
                                <div class="victory-section">
                                    <h3>World Evolution</h3>
                                    <p>World Age: ${worldAge}</p>
                                    <p>World State: ${worldStateDesc}</p>
                                    <p>Global Balance: ${globalChaos}% Chaos / ${globalOrder}% Order</p>
                                </div>
                                <div class="victory-section">
                                    <h3>Resources</h3>
                                    <p>Energy: ${GameState.resources.energy}/${GameState.resourceLimits.energy}</p>
                                    <p>Essence: ${GameState.resources.essence}/${GameState.resourceLimits.essence}</p>
                                    <p>Knowledge: ${GameState.resources.knowledge}/${GameState.resourceLimits.knowledge}</p>
                                    <p>Stability: ${GameState.resources.stability}/${GameState.resourceLimits.stability}</p>
                                </div>
                                <div class="victory-section">
                                    <h3>Statistics</h3>
                                    <p>XP Gained: ${xpGain}</p>
                                    <p>Turns: ${turnCount}</p>
                                    <p>Senses Made: ${GameState.progress.sensesMade}</p>
                                    <p>Pokes Made: ${GameState.progress.pokesMade}</p>
                                    <p>Energy Usage Ratio (Move/Total): ${energyRatio}</p>
                                    <p>Movement Efficiency (Safest/Moves): ${efficiency}</p>
                                    <p>Sensed Types: ${sensedTypesText || 'None'}</p>
                                </div>
                                <div class="victory-buttons">
                                    <button id="next-level-btn">Next Level</button>
                                    <button id="upgrade-btn">Spend ${Math.min(5, GameState.resources.essence)} Essence: +1 Movement</button>
                                    <button id="view-stats-btn">View Stats</button>
                                </div>
                            `;
                            statsWindow.innerHTML = victoryScreenContent;
                            statsWindow.style.display = 'block';
                            attachVictoryScreenListeners();
                            GameState.isActive = false;
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

        if (GameState.progress.hasFoundZoe) {
            const goalTile = document.querySelector(`.hex-container[data-row="${rows - 1}"][data-col="${cols - 1}"]`);
            if (goalTile) goalTile.classList.add('goal-visible');
        }

        highlightTiles(null);
        updateVision();
        updateUI();
        
        GameState.isActive = true;
        isGameActive = true;
        document.getElementById('stats-window').style.display = 'none';
    }

    /**
     * Updates all UI elements with current game state
     */
    function updateUI() {
        if (turnDisplay) {
            turnDisplay.textContent = `Turns: ${GameState.player.turnCount}`;
        }
        
        if (statsDisplay) {
            statsDisplay.textContent = `Moves: ${GameState.progress.stats.movementRange} | Luck: ${GameState.progress.stats.luck} | XP: ${GameState.progress.xp}`;
        }
        
        if (traitsDisplay) {
            traitsDisplay.textContent = `Traits: ${GameState.progress.traits.length > 0 ? GameState.progress.traits.join(', ') : 'None'}`;
        }
        
        if (tempInventoryDisplay) {
            tempInventoryDisplay.textContent = `Level Items: ${GameState.level.temporaryInventory.length > 0 ? GameState.level.temporaryInventory.join(', ') : 'None'}`;
        }
        
        if (persistentInventoryDisplay) {
            persistentInventoryDisplay.textContent = `Persistent Items: ${GameState.progress.persistentInventory.length > 0 ? GameState.progress.persistentInventory.join(', ') : 'None'}`;
        }
        
        // Update resource displays
        updateResourceDisplay('energy', GameState.resources.energy, GameState.resourceLimits.energy);
        updateResourceDisplay('essence', GameState.resources.essence, GameState.resourceLimits.essence);
        updateResourceDisplay('knowledge', GameState.resources.knowledge, GameState.resourceLimits.knowledge);
        updateResourceDisplay('stability', GameState.resources.stability, GameState.resourceLimits.stability);
        
        const systemBalance = document.getElementById('system-balance');
        if (systemBalance) {
            // Determine world state description
            let worldStateDesc = "";
            if (GameState.worldEvolution.globalChaos > 0.8) {
                worldStateDesc = "Primordial Chaos";
            } else if (GameState.worldEvolution.globalChaos > 0.6) {
                worldStateDesc = "Emerging Patterns";
            } else if (GameState.worldEvolution.globalChaos > 0.4) {
                worldStateDesc = "Balanced Forces";
            } else if (GameState.worldEvolution.globalChaos > 0.2) {
                worldStateDesc = "Ordered Systems";
            } else {
                worldStateDesc = "Harmonious Order";
            }
            
            const chaosPercent = (GameState.worldEvolution.globalChaos * 100).toFixed(0);
            const orderPercent = (GameState.worldEvolution.globalOrder * 100).toFixed(0);
            const worldAge = GameState.worldEvolution.age;
            
            systemBalance.innerHTML = `
                <span class="world-state">${worldStateDesc}</span> | 
                <span class="world-age">Age: ${worldAge}</span> | 
                <span class="world-balance">${chaosPercent}% Chaos / ${orderPercent}% Order</span>
            `;
        }
        
        // Update local variables for compatibility
        turnCount = GameState.player.turnCount;
        energy = GameState.player.energy;
        movementPoints = GameState.player.movementPoints;
    }
    
    /**
     * Updates a resource display in the UI
     * @param {string} resourceType - Type of resource ('energy', 'essence', 'knowledge', 'stability')
     * @param {number} value - Current value
     * @param {number} max - Maximum value
     * @param {boolean} animate - Whether to animate the change
     */
    function updateResourceDisplay(resourceType, value, max, animate = false) {
        const bar = document.getElementById(`${resourceType}-bar`);
        const valueDisplay = document.getElementById(`${resourceType}-value`);
        
        if (bar && valueDisplay) {
            // Calculate percentage
            const percentage = Math.min(100, Math.max(0, (value / max) * 100));
            
            // Update bar width
            bar.style.width = `${percentage}%`;
            
            // Update value text
            valueDisplay.textContent = `${Math.round(value)}/${max}`;
            
            // Apply animation if requested
            if (animate) {
                bar.classList.add('resource-change');
                setTimeout(() => {
                    bar.classList.remove('resource-change');
                }, 500);
            }
            
            // Update color for stability based on value
            if (resourceType === 'stability') {
                if (value < 30) {
                    bar.style.background = 'linear-gradient(to right, #ff3300, #ff6600)';
                } else if (value < 70) {
                    bar.style.background = 'linear-gradient(to right, #ffcc00, #ffff00)';
                } else {
                    bar.style.background = 'linear-gradient(to right, #00cc66, #00ffcc)';
                }
            }
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
        GameState.player.currentAction = 'move';
        currentAction = 'move'; // Update local variable for compatibility
        highlightTiles('move');
    });

    document.getElementById('sense-btn').addEventListener('click', () => {
        GameState.player.currentAction = 'sense';
        currentAction = 'sense'; // Update local variable for compatibility
        highlightTiles('sense');
    });

    document.getElementById('stabilize-btn').addEventListener('click', () => {
        GameState.player.currentAction = 'stabilize';
        currentAction = 'stabilize'; // Update local variable for compatibility
        highlightTiles('stabilize');
    });

    document.getElementById('poke-btn').addEventListener('click', () => {
        GameState.player.currentAction = 'poke';
        currentAction = 'poke'; // Update local variable for compatibility
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