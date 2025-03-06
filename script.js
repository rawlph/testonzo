let isGameActive = true; // Tracks if the game is active or finished
let tileData; // Declare tileData in the outer scope

document.addEventListener('DOMContentLoaded', () => {
    // Initial grid size and constants
    let rows = 5;
    let cols = 5;
    const hexVisualWidth = 86.6;
    const hexHeight = 100;
    const rowOffset = hexHeight * 0.75;
    const colOffset = hexVisualWidth;
    let turnCount = 0;
    let currentRow = 0;
    let currentCol = 0;
    let currentLevelSenses = 0; // For Explorer trait
    let moveCounter = 0; // For Pathfinder energy cost
    let hasUsedsenserBonus = false; // For senser free reveal
    let currentAction = null; // 'move', 'sense', or 'poke'
    let energy = 5 * (rows + cols - 2); // Starting energy
    let movementPoints = 1; // Base MP per turn

    // Particle effects function
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

    // Player progress and state
    let playerProgress = JSON.parse(localStorage.getItem('playerProgress')) || {
        stats: { movementRange: 1, luck: 0 },
        xp: 0,
        traits: [],
        sensedTypes: [],
        uniquesensedTypes: [],
        hasFoundZoe: false,
        zoeLevelsCompleted: 0,
        sensesMade: 0,
        pokesMade: 0,
        
        // Enhanced generational stats
        generation: 1,
        evolutionStage: 'basic', // 'basic', 'aware', 'sentient', 'conscious'
        generationHistory: [],
        ancestralTraits: [],
        
        // Game performance metrics
        levelsCompleted: 0,
        totalTurns: 0,
        totalEnergy: 0,
        totalRests: 0,
        optimPathRatio: 0,
        explorationPercentage: 0,
        
        // Evolution potential metrics
        traitAffinities: {
            explorer: 0,
            senser: 0,
            pathfinder: 0,
            zoeAdept: 0
        }
    };
    
    // Initialize local stats for the current level
    let levelStats = {
        turns: 0,
        energyUsed: 0,
        restsUsed: 0,
        tilesExplored: 0,
        totalTiles: rows * cols,
        tilesInteracted: 0,
        tilesSensed: 0,
        movementsMade: 0,
        optimalPathLength: Math.abs(rows-1) + Math.abs(cols-1) // Manhattan distance to goal
    };

    let { stats, traits, xp, sensedTypes, uniquesensedTypes, hasFoundZoe, zoeLevelsCompleted, sensesMade, pokesMade, generation, evolutionStage, generationHistory, ancestralTraits, levelsCompleted, totalTurns, totalEnergy, totalRests, optimPathRatio, explorationPercentage, traitAffinities } = playerProgress;
    let temporaryInventory = [];

    // DOM elements
    const turnDisplay = document.getElementById('turn-counter');
    const statsDisplay = document.getElementById('stats-display');
    const traitsDisplay = document.getElementById('traits-display');
    const tempInventoryDisplay = document.getElementById('temp-inventory-display');
    const persistentInventoryDisplay = document.getElementById('persistent-inventory-display');
    const energyDisplay = document.getElementById('energy-display');

    // Function to highlight tiles based on the action
    function highlightTiles(action) {
        const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
        document.querySelectorAll('.hex-container').forEach(container => {
            const row = parseInt(container.getAttribute('data-row'));
            const col = parseInt(container.getAttribute('data-col'));
            container.classList.remove('highlight-move', 'highlight-sense', 'highlight-poke');
            if (action === 'move' && adjacentTiles.some(t => t.row === row && t.col === col)) {
                container.classList.add('highlight-move');
            } else if (action === 'sense' || action === 'poke') {
                if ((row === currentRow && col === currentCol) || adjacentTiles.some(t => t.row === row && t.col === col)) {
                    container.classList.add(action === 'sense' ? 'highlight-sense' : 'highlight-poke');
                }
            }
        });
    }

    // Vision mechanics: Update visible tiles based on range with permanent fog clearing
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

    // Helper to get tiles within a range (simplified for hex grid)
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

    function createTileData(rows, cols) {
        const tileData = [];
        for (let row = 0; row < rows; row++) {
            tileData[row] = [];
            for (let col = 0; col < cols; col++) {
                tileData[row][col] = {
                    type: 'normal',
                    effects: [],
                    state: 'active',
                    explored: false
                };
            }
        }
        return tileData;
    }

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

        if (!playerProgress.hasFoundZoe) {
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

    function endTurn() {
        if (!isGameActive) {
            console.log("Level complete—cannot end turn!");
            return;
        }
        if (movementPoints > 0) {
            const confirmEnd = confirm("You still have resources left. Are you sure you want to end your turn?");
            if (!confirmEnd) return;
        }
        turnCount++;
        levelStats.turns++;
        
        movementPoints = stats.movementRange;
        highlightTiles(null);
        currentAction = null;
        
        // Energy cost per turn
        energy -= 1;
        levelStats.energyUsed += 1;
        
        if (energy <= 0) {
            showLoseScreen();
            return;
        }
        
        updateUI();
    }

    function rest() {
        if (!isGameActive) {
            console.log("Level complete—cannot rest!");
            return;
        }
        const confirmRest = confirm("This ends the turn and lets you rest for 10 energy points. Are you sure?");
        if (confirmRest) {
            turnCount++;
            levelStats.turns++;
            levelStats.restsUsed++;
            
            energy += 2;
            if (traits.includes('explorer')) energy += 1;
            
            movementPoints = stats.movementRange;
            highlightTiles(null);
            currentAction = null;
            
            updateUI();
        }
    }

    function showLoseScreen() {
        const statsWindow = document.getElementById('stats-window');
        if (statsWindow) {
            statsWindow.innerHTML = `
                <h2>Energy Depleted!</h2>
                <p>You ran out of energy before reaching the goal.</p>
                <p>Turns: ${turnCount}</p>
                <p>Senses Made: ${playerProgress.sensesMade}</p>
                <p>Pokes Made: ${playerProgress.pokesMade}</p>
                <button id="restart-btn">Restart Level</button>
            `;
            statsWindow.style.display = 'block';
            document.getElementById('restart-btn').addEventListener('click', () => {
                statsWindow.style.display = 'none';
                isGameActive = true;
                startGame();
            });
        }
        isGameActive = false;
    }

    function startGame() {
        console.log("Starting game..."); // Debugging log
        tileData = createTileData(rows, cols); // Assign to outer scope
        placeTiles(tileData, rows, cols);
        buildGrid(rows, cols, tileData);

        // Attach event listeners to hex containers after the grid is built
        const hexContainers = document.querySelectorAll('.hex-container');
        console.log(`Found ${hexContainers.length} hex containers`); // Debugging log
        hexContainers.forEach(container => {
            container.addEventListener('click', handleTileClick);
        });

        // Rest of startGame setup
        document.querySelectorAll('.character').forEach(char => char.style.display = 'none');
        const startingHex = document.querySelector('.hex-container[data-row="0"][data-col="0"]');
        if (startingHex) {
            const character = startingHex.querySelector('.character');
            if (character) character.style.display = 'block';
        }

        if (playerProgress.hasFoundZoe) {
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
        movementPoints = 1;
        highlightTiles(null);
        updateVision();
        updateUI();
        isGameActive = true;
        document.getElementById('stats-window').style.display = 'none';
    }

    function updateUI() {
        if (turnDisplay) turnDisplay.textContent = `Turns: ${turnCount}`;
        if (statsDisplay) statsDisplay.textContent = `Moves: ${stats.movementRange} | Luck: ${stats.luck} | XP: ${xp}`;
        if (traitsDisplay) traitsDisplay.textContent = `Traits: ${traits.length > 0 ? traits.join(', ') : 'None'}`;
        if (tempInventoryDisplay) tempInventoryDisplay.textContent = `Level Items: ${temporaryInventory.length > 0 ? temporaryInventory.join(', ') : 'None'}`;
        if (persistentInventoryDisplay) persistentInventoryDisplay.textContent = `Persistent Items: ${persistentInventory.length > 0 ? persistentInventory.join(', ') : 'None'}`;
        if (energyDisplay) energyDisplay.textContent = `Energy: ${energy} | MP: ${movementPoints}`;
    }

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

    function handleTileClick(event) {
        if (!isGameActive) return;
        
        const container = event.target.closest('.hex-container');
        if (!container) return;
        
        const tileId = container.getAttribute('id');
        console.log(`Clicked on tile ${tileId}`);
        
        // Handle based on current action
        if (currentAction === 'move') {
            if (container.classList.contains('move-highlight')) {
                moveToTile(container);
            }
        } else if (currentAction === 'sense') {
            if (container.classList.contains('sense-highlight')) {
                performSense(container);
            }
        } else if (currentAction === 'poke') {
            if (container.classList.contains('poke-highlight')) {
                performPoke(container);
            }
        }
    }

    function moveToTile(targetTile) {
        if (!targetTile || targetTile === playerTile || movementPoints <= 0) return;
        
        const targetCoords = getCoordinates(targetTile);
        const playerCoords = getCoordinates(playerTile);
        const distance = getDistance(playerCoords, targetCoords);
        
        if (distance > 1) return; // Cannot move more than 1 tile at once
        
        // Update player position
        playerTile.querySelector('.character')?.remove();
        playerTile = targetTile;
        const character = document.createElement('div');
        character.className = 'character';
        character.innerHTML = '<i class="fas fa-user"></i>';
        playerTile.appendChild(character);
        
        // Update game state
        const energyCost = traits.includes('pathfinder') ? 1 : 2;
        energy -= energyCost;
        levelStats.energyUsed += energyCost;
        movementPoints--;
        levelStats.tilesMoved++;
        
        // Check for zoe on the tile
        if (targetTile.dataset.type === 'zoe') {
            targetTile.dataset.type = 'empty';
            targetTile.classList.remove('zoe-tile');
            zoeFound = true;
            // Reveal the goal tile
            const goalTile = document.querySelector('[data-type="goal"]');
            goalTile.classList.add('goal-tile');
            
            levelStats.zoeFound = true;
        }
        
        // Check for goal on the tile
        if (targetTile.dataset.type === 'goal' && zoeFound) {
            // Victory!
            levelStats.goalReached = true;
            showVictoryScreen();
            return;
        }
        
        updateFogOfWar();
        updateUI();
    }

    function performSense(targetTile) {
        if (!targetTile || targetTile === playerTile) return;
        
        // Energy cost
        const energyCost = traits.includes('senser') ? 1 : 2;
        energy -= energyCost;
        levelStats.energyUsed += energyCost;
        levelStats.tilesSensed++;
        
        // Reveal the tile type
        if (targetTile.dataset.type === 'zoe') {
            targetTile.classList.add('zoe-tile');
        } else if (targetTile.dataset.type === 'goal' && zoeFound) {
            targetTile.classList.add('goal-tile');
        }
        
        // Clear the action
        currentAction = null;
        highlightTiles(null);
        updateUI();
    }

    function performPoke(targetTile) {
        if (!targetTile || targetTile === playerTile) return;
        
        // Energy cost
        const energyCost = traits.includes('explorer') ? 1 : 2;
        energy -= energyCost;
        levelStats.energyUsed += energyCost;
        levelStats.tilesInteracted++;
        
        // Interaction effect based on tile type
        if (targetTile.dataset.type === 'zoe') {
            // Found Zoe by poking!
            targetTile.classList.add('zoe-tile');
            targetTile.dataset.type = 'empty';
            zoeFound = true;
            // Reveal the goal tile
            const goalTile = document.querySelector('[data-type="goal"]');
            goalTile.classList.add('goal-tile');
            
            levelStats.zoeFound = true;
        } else if (targetTile.dataset.type === 'goal' && zoeFound) {
            // Victory through poking!
            levelStats.goalReached = true;
            showVictoryScreen();
            return;
        }
        
        // Clear the action
        currentAction = null;
        highlightTiles(null);
        updateUI();
    }

    function getCoordinates(tile) {
        return {
            row: parseInt(tile.getAttribute('data-row')),
            col: parseInt(tile.getAttribute('data-col'))
        };
    }

    function getDistance(coords1, coords2) {
        return Math.max(Math.abs(coords1.row - coords2.row), Math.abs(coords1.col - coords2.col));
    }

    function updateFogOfWar() {
        // Update fog of war based on player position and vision range
        const visionRange = traits.includes('zoeMaster') ? 3 : traits.includes('zoeInitiate') ? 2 : 1;
        const visibleTiles = getTilesInRange(currentRow, currentCol, visionRange);

        visibleTiles.forEach(tile => {
            const tileContainer = document.querySelector(`.hex-container[data-row="${tile.row}"][data-col="${tile.col}"]`);
            if (tileContainer) tileContainer.classList.remove('unexplored');
        });
    }

    // Button event listeners
    document.getElementById('move-btn').addEventListener('click', () => {
        currentAction = 'move';
        highlightTiles('move');
    });

    document.getElementById('sense-btn').addEventListener('click', () => {
        currentAction = 'sense';
        highlightTiles('sense');
    });

    document.getElementById('poke-btn').addEventListener('click', () => {
        currentAction = 'poke';
        highlightTiles('poke');
    });

    document.getElementById('end-turn-btn').addEventListener('click', endTurn);

    document.getElementById('rest-btn').addEventListener('click', rest);

    // Initialize the game
    startGame();

    // Next Level button
    const statsWindow = document.getElementById('stats-window');
    statsWindow.addEventListener('click', (e) => {
        if (e.target.id === 'next-level-btn') {
            statsWindow.style.display = 'none';
            isGameActive = true;
            startGame();
        }
    });

    // Admin tool: Resize grid
    const resizeBtn = document.getElementById('resize-btn');
    if (resizeBtn) {
        resizeBtn.addEventListener('click', () => {
            const newRows = parseInt(document.getElementById('rows-input').value);
            const newCols = parseInt(document.getElementById('cols-input').value);
            if (newRows >= 3 && newCols >= 3 && newRows <= 20 && newCols <= 20) {
                rows = newRows;
                cols = newCols;
                startGame();
            } else {
                alert('Please choose rows and columns between 3 and 20.');
            }
        });
    }

    // Admin tool: Reset stats
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => {
            localStorage.removeItem('playerProgress');
            playerProgress = {
                stats: { movementRange: 1, luck: 0 },
                xp: 0,
                traits: [],
                sensedTypes: [],
                uniquesensedTypes: [],
                hasFoundZoe: false,
                zoeLevelsCompleted: 0,
                sensesMade: 0,
                pokesMade: 0,
                
                // Enhanced generational stats
                generation: 1,
                evolutionStage: 'basic', // 'basic', 'aware', 'sentient', 'conscious'
                generationHistory: [],
                ancestralTraits: [],
                
                // Game performance metrics
                levelsCompleted: 0,
                totalTurns: 0,
                totalEnergy: 0,
                totalRests: 0,
                optimPathRatio: 0,
                explorationPercentage: 0,
                
                // Evolution potential metrics
                traitAffinities: {
                    explorer: 0,
                    senser: 0,
                    pathfinder: 0,
                    zoeAdept: 0
                }
            };
            ({ stats, traits, xp, sensedTypes, uniquesensedTypes, hasFoundZoe, zoeLevelsCompleted, sensesMade, pokesMade, generation, evolutionStage, generationHistory, ancestralTraits, levelsCompleted, totalTurns, totalEnergy, totalRests, optimPathRatio, explorationPercentage, traitAffinities } = playerProgress);
            startGame();
        });
    }

    function showVictoryScreen() {
        // Calculate performance metrics
        const performance = calculatePerformance();
        
        // Update player progress with this level's stats
        savePlayerStats(performance);
        
        // Create victory overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        
        const victoryBox = document.createElement('div');
        victoryBox.className = 'victory-box';
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'Level Complete!';
        victoryBox.appendChild(title);
        
        // Stats display
        const statsDiv = document.createElement('div');
        statsDiv.className = 'stats-container';
        
        const statsContent = `
            <h3>Your Performance</h3>
            <div class="stat-row">
                <span>Turns Taken:</span>
                <span>${levelStats.turns}</span>
            </div>
            <div class="stat-row">
                <span>Energy Used:</span>
                <span>${levelStats.energyUsed}</span>
            </div>
            <div class="stat-row">
                <span>Tiles Moved:</span>
                <span>${levelStats.tilesMoved}</span>
            </div>
            <div class="stat-row">
                <span>Tiles Sensed:</span>
                <span>${levelStats.tilesSensed}</span>
            </div>
            <div class="stat-row">
                <span>Interactions:</span>
                <span>${levelStats.tilesInteracted}</span>
            </div>
            <div class="stat-row">
                <span>Rests Taken:</span>
                <span>${levelStats.restsUsed}</span>
            </div>
            <h3>Evolution Progress</h3>
            <div class="evolution-progress">
                <div class="progress-bar pathfinder" style="width: ${performance.pathfinderAffinity}%;">
                    <span>Pathfinder: ${Math.floor(performance.pathfinderAffinity)}%</span>
                </div>
                <div class="progress-bar senser" style="width: ${performance.senserAffinity}%;">
                    <span>Senser: ${Math.floor(performance.senserAffinity)}%</span>
                </div>
                <div class="progress-bar explorer" style="width: ${performance.explorerAffinity}%;">
                    <span>Explorer: ${Math.floor(performance.explorerAffinity)}%</span>
                </div>
            </div>
        `;
        
        statsDiv.innerHTML = statsContent;
        victoryBox.appendChild(statsDiv);
        
        // Continue button
        const continueBtn = document.createElement('button');
        continueBtn.textContent = 'Continue to Next Level';
        continueBtn.addEventListener('click', () => {
            overlay.remove();
            generateNewLevel();
        });
        victoryBox.appendChild(continueBtn);
        
        overlay.appendChild(victoryBox);
        document.body.appendChild(overlay);
        
        isGameActive = false;
    }

    function generateNewLevel() {
        // Reset level-specific variables
        levelStats = {
            turns: 1, // Start at turn 1
            energyUsed: 0,
            tilesMoved: 0,
            tilesSensed: 0,
            tilesInteracted: 0,
            restsUsed: 0,
            zoeFound: false,
            goalReached: false
        };
        
        // Increment generation if needed
        if (playerProgress.generationalStats.levelsCompleted % 3 === 0) {
            playerProgress.currentGeneration++;
            // Store ancestral traits
            playerProgress.generationHistory.push({
                generation: playerProgress.currentGeneration - 1,
                traits: [...traits],
                performanceMetrics: { ...playerProgress.generationalStats }
            });
            
            // Reset some stats for new generation
            traits = []; // Start with no traits in the new generation
            playerProgress.traits = [];
            // Keep accumulated affinity but reset some metrics
            playerProgress.generationalStats.levelsCompleted = 0;
        }
        
        // Generate a new grid
        setupGame();
    }

    function calculatePerformance() {
        const pathfinderAffinity = Math.min(100, (levelStats.tilesMoved / levelStats.turns) * 100);
        const senserAffinity = Math.min(100, (levelStats.tilesSensed / levelStats.turns) * 100);
        const explorerAffinity = Math.min(100, (levelStats.tilesInteracted / levelStats.turns) * 100);
        
        return {
            pathfinderAffinity,
            senserAffinity,
            explorerAffinity
        };
    }

    function savePlayerStats(performance) {
        playerProgress.generationalStats.totalTurns += levelStats.turns;
        playerProgress.generationalStats.totalEnergy += levelStats.energyUsed;
        playerProgress.generationalStats.totalMoves += levelStats.tilesMoved;
        playerProgress.generationalStats.totalSenses += levelStats.tilesSensed;
        playerProgress.generationalStats.totalInteractions += levelStats.tilesInteracted;
        playerProgress.generationalStats.totalRests += levelStats.restsUsed;
        playerProgress.generationalStats.levelsCompleted += 1;
        
        playerProgress.evolutionPotential.pathfinderAffinity = 
            (playerProgress.evolutionPotential.pathfinderAffinity + performance.pathfinderAffinity) / 2;
        playerProgress.evolutionPotential.senserAffinity = 
            (playerProgress.evolutionPotential.senserAffinity + performance.senserAffinity) / 2;
        playerProgress.evolutionPotential.explorerAffinity = 
            (playerProgress.evolutionPotential.explorerAffinity + performance.explorerAffinity) / 2;
        
        if (playerProgress.evolutionPotential.pathfinderAffinity >= 60 && !traits.includes('pathfinder')) {
            traits.push('pathfinder');
            playerProgress.traits.push('pathfinder');
        }
        
        if (playerProgress.evolutionPotential.senserAffinity >= 60 && !traits.includes('senser')) {
            traits.push('senser');
            playerProgress.traits.push('senser');
        }
        
        if (playerProgress.evolutionPotential.explorerAffinity >= 60 && !traits.includes('explorer')) {
            traits.push('explorer');
            playerProgress.traits.push('explorer');
        }
        
        localStorage.setItem('playerProgress', JSON.stringify(playerProgress));
    }

    function setupGame() {
        // Reset state
        isGameActive = true;
        zoeFound = false;
        energy = 20;
        turnCount = 1;
        movementPoints = 1;
        currentAction = null;
        playerTile = null;
        
        // Initialize level stats
        levelStats = {
            turns: 1, // Start at turn 1
            energyUsed: 0,
            tilesMoved: 0,
            tilesSensed: 0,
            tilesInteracted: 0,
            restsUsed: 0,
            zoeFound: false,
            goalReached: false
        };
        
        // Load or initialize player progress
        const savedProgress = localStorage.getItem('playerProgress');
        if (savedProgress) {
            playerProgress = JSON.parse(savedProgress);
            traits = [...playerProgress.traits]; // Load traits
        }
        
        // Clear existing grid
        gridContainer.innerHTML = '';
        
        // Generate grid
        generateGrid();
        
        // Add player character to a random valid tile
        const validTiles = Array.from(document.querySelectorAll('.hex-container[data-type="empty"]'));
        playerTile = validTiles[Math.floor(Math.random() * validTiles.length)];
        const character = document.createElement('div');
        character.className = 'character';
        character.innerHTML = '<i class="fas fa-user"></i>';
        playerTile.appendChild(character);
        
        // Add click event listeners
        document.querySelectorAll('.hex-container').forEach(container => {
            container.addEventListener('click', handleTileClick);
        });
        
        // Update UI
        updateFogOfWar();
        updateUI();
    }

    function generateGrid() {
        // Generate a new grid
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
});