let isGameActive = true; // Tracks if the game is active or finished
let tileData; // Declare tileData in the outer scope

document.addEventListener('DOMContentLoaded', () => {
    // Initial grid size and constants
    let rows = 10;
    let cols = 10;
    const hexHeight = 100;  // Adjust for visual size
    const hexVisualWidth = 86.6;  // Hex width for visual display: 100 * cos(30) * 2
    const colOffset = hexVisualWidth * 0.75;  // 75% of hex width for tight packing
    const rowOffset = hexHeight * 0.75;  // 75% of height for tight packing
    const gridContainer = document.querySelector('.grid');
    
    // Game state variables
    let zoeFound = false;
    let energy = 20;
    let turnCount = 1;
    let movementPoints = 1;
    let currentAction = null;
    let playerTile = null;
    let currentRow, currentCol;
    let moveCounter = 0;
    let hasUsedsenserBonus = false;
    let currentLevelSenses = 0;
    
    // All DOM element references at the top of the script
    const turnDisplay = document.getElementById('turn-display');
    const statsDisplay = document.getElementById('stats-display');
    const traitsDisplay = document.getElementById('traits-display');
    const tempInventoryDisplay = document.getElementById('temp-inventory-display');
    const persistentInventoryDisplay = document.getElementById('persistent-inventory-display');
    const energyDisplay = document.getElementById('energy-display');

    // Player progress and state
    let playerProgress = JSON.parse(localStorage.getItem('playerProgress')) || {
        stats: { movementRange: 1, luck: 0 },
        traits: [],
        level: 1,
        xp: 0,
        sensesMade: 0,
        pokesMade: 0,
        sensedTypes: [],
        uniquesensedTypes: [],
        hasFoundZoe: false,
        zoeLevelsCompleted: 0,
        generationalStats: {
            totalTurns: 0,
            totalEnergy: 0,
            totalMoves: 0,
            totalSenses: 0,
            totalInteractions: 0,
            totalRests: 0,
            levelsCompleted: 0
        },
        evolutionPotential: {
            pathfinderAffinity: 0,
            senserAffinity: 0,
            explorerAffinity: 0
        },
        generationHistory: [],
        currentGeneration: 1
    };
    
    // Game state variables
    let traits = [...(playerProgress.traits || [])]; // Start with saved traits or empty array
    let stats = playerProgress.stats || { movementRange: 1, luck: 0 };
    let xp = playerProgress.xp || 0;
    let uniquesensedTypes = [...(playerProgress.uniquesensedTypes || [])];
    let temporaryInventory = []; // Items that only exist for current level
    let persistentInventory = []; // Items that persist between levels
    
    // Current level stats tracking
    let levelStats = {
        turns: 1, // Start at turn 1
        energyUsed: 0,
        tilesMoved: 0,
        tilesSensed: 0,
        tilesInteracted: 0,
        restsUsed: 0,
        zoeFound: false,
        goalReached: false
    };

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

    // Function to highlight tiles based on the action
    function highlightTiles(action) {
        // Clear all highlights first
        document.querySelectorAll('.hex-container').forEach(container => {
            container.classList.remove('move-highlight', 'sense-highlight', 'poke-highlight');
        });

        if (!action || !playerTile) return;

        // Get adjacent tiles
        const range = action === 'sense' && traits.includes('senser') ? 2 : 1;
        const adjacentTiles = getAdjacentTiles(playerTile, range);

        // Apply appropriate highlight class based on the action
        adjacentTiles.forEach(tile => {
            if (action === 'move') {
                // Can't move to blocked tiles or water
                if (tile.getAttribute('data-type') !== 'blocked' && 
                    tile.getAttribute('data-type') !== 'water') {
                    tile.classList.add('move-highlight');
                }
            } else if (action === 'sense') {
                tile.classList.add('sense-highlight');
            } else if (action === 'poke') {
                tile.classList.add('poke-highlight');
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
                    type: 'empty',
                    effects: [],
                    state: 'active',
                    explored: row === 0 && col === 0 ? true : false
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
        const treasureToPlace = Math.max(1, Math.floor(gridSize / 3));
        const waterToPlace = Math.max(1, Math.floor(gridSize / 4));
        
        for (let i = 0; i < blocksToPlace && i < nonPathPositions.length; i++) {
            const pos = nonPathPositions[i];
            tileData[pos.row][pos.col].type = 'blocked';
        }
        
        for (let i = blocksToPlace; i < blocksToPlace + treasureToPlace && i < nonPathPositions.length; i++) {
            const pos = nonPathPositions[i];
            tileData[pos.row][pos.col].type = 'treasure';
        }
        
        for (let i = blocksToPlace + treasureToPlace; i < blocksToPlace + treasureToPlace + waterToPlace && i < nonPathPositions.length; i++) {
            const pos = nonPathPositions[i];
            tileData[pos.row][pos.col].type = 'water';
        }
        
        if (!playerProgress.hasFoundZoe && nonPathPositions.length > blocksToPlace + treasureToPlace + waterToPlace) {
            const zoeIndex = blocksToPlace + treasureToPlace + waterToPlace + Math.floor(Math.random() * (nonPathPositions.length - blocksToPlace - treasureToPlace - waterToPlace));
            if (zoeIndex < nonPathPositions.length) {
                const pos = nonPathPositions[zoeIndex];
                tileData[pos.row][pos.col].type = 'zoe';
            }
        }
        
        return tileData;
    }

    function buildGrid(rows, cols, tileData) {
        const grid = document.querySelector('.grid');
        if (!grid) {
            console.error('Grid element not found in HTML');
            return;
        }
        grid.innerHTML = '';
        const totalWidth = (cols * colOffset) + hexVisualWidth;
        const totalHeight = (rows * rowOffset) + hexHeight;
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
                hexContainer.setAttribute('id', `hex-${row}-${col}`);
                hexContainer.setAttribute('data-type', tileData[row][col].type);

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
                svg.style.pointerEvents = 'none'; // Make sure clicks go through to container
                svg.style.display = 'block'; // Ensure consistent rendering
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M43.3 0 L86.6 25 L86.6 75 L43.3 100 L0 75 L0 25 Z');
                path.style.strokeWidth = '2';
                path.style.stroke = '#333';
                svg.appendChild(path);
                hexContainer.appendChild(svg);

                const character = document.createElement('div');
                character.classList.add('character');
                character.style.pointerEvents = 'none'; // Make sure clicks go through to container
                character.style.display = 'none'; // Hide by default
                hexContainer.appendChild(character);

                const tileType = tileData[row][col].type;
                hexContainer.classList.add(tileType);

                if (!tileData[row][col].explored) {
                    hexContainer.classList.add('unexplored');
                }

                hexContainer.addEventListener('click', handleTileClick);

                hexRow.appendChild(hexContainer);
            }
            grid.appendChild(hexRow);
        }
    }

    function generateGrid() {
        tileData = createTileData(rows, cols);
        tileData = placeTiles(tileData, rows, cols);
        buildGrid(rows, cols, tileData);
    }

    function initializeGame() {
        console.log("Initializing game...");
        
        isGameActive = true;
        zoeFound = false;
        energy = 20;
        turnCount = 1;
        movementPoints = 1;
        currentAction = null;
        temporaryInventory = [];
        persistentInventory = [];
        
        levelStats = {
            turns: 1,
            energyUsed: 0,
            tilesMoved: 0,
            tilesSensed: 0,
            tilesInteracted: 0,
            restsUsed: 0,
            zoeFound: false,
            goalReached: false
        };
        
        const savedProgress = localStorage.getItem('playerProgress');
        if (savedProgress) {
            try {
                playerProgress = JSON.parse(savedProgress);
                traits = Array.isArray(playerProgress.traits) ? [...playerProgress.traits] : [];
                console.log("Loaded player progress:", playerProgress);
            } catch (e) {
                console.error("Error loading player progress:", e);
                traits = [];
            }
        }
        
        generateGrid();
        
        let validTiles = Array.from(document.querySelectorAll('.hex-container[data-type="empty"]'));
        
        if (validTiles.length === 0) {
            validTiles = Array.from(document.querySelectorAll('.hex-container'));
            validTiles = validTiles.filter(tile => 
                tile.getAttribute('data-type') !== 'blocked' && 
                tile.getAttribute('data-type') !== 'water'
            );
        }
        
        if (validTiles.length === 0) {
            console.error("No valid tiles found for player placement");
            const startTile = document.getElementById('hex-0-0');
            if (startTile) {
                startTile.setAttribute('data-type', 'empty');
                startTile.className = 'hex-container empty';
                validTiles = [startTile];
            }
        }
        
        if (validTiles.length > 0) {
            playerTile = validTiles[Math.floor(Math.random() * validTiles.length)];
            const character = playerTile.querySelector('.character');
            if (character) {
                character.innerHTML = '<i class="fas fa-user"></i>';
                character.style.display = 'block';
            } else {
                const newCharacter = document.createElement('div');
                newCharacter.className = 'character';
                newCharacter.innerHTML = '<i class="fas fa-user"></i>';
                newCharacter.style.pointerEvents = 'none';
                playerTile.appendChild(newCharacter);
            }
            
            const playerRow = parseInt(playerTile.getAttribute('data-row'));
            const playerCol = parseInt(playerTile.getAttribute('data-col'));
            currentRow = playerRow;
            currentCol = playerCol;
        }
        
        updateFogOfWar();
        updateUI();
        
        const statsWindow = document.getElementById('stats-window');
        if (statsWindow) statsWindow.style.display = 'none';
        
        console.log("Game initialization complete");
    }

    function endTurn() {
        energy--;
        turnCount++;
        movementPoints = 1; // Reset movement points
        levelStats.turns++;
        
        updateUI();
        
        currentAction = null;
        highlightTiles(null);
        
        if (energy <= 0) {
            showLoseScreen();
        }
    }

    function rest() {
        const confirmRest = confirm("This ends the turn and lets you rest for 10 energy points. Are you sure?");
        if (confirmRest) {
            turnCount++;
            levelStats.turns++;
            levelStats.restsUsed++;
            
            energy += 2;
            if (traits.includes('explorer')) energy += 1;
            
            movementPoints = 1;
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
                initializeGame();
            });
        }
        isGameActive = false;
    }

    function updateUI() {
        try {
            if (turnDisplay) turnDisplay.textContent = `Turns: ${turnCount || 0}`;
            if (statsDisplay) statsDisplay.textContent = `Moves: ${stats?.movementRange || 0} | Luck: ${stats?.luck || 0} | XP: ${xp || 0}`;
            if (traitsDisplay) traitsDisplay.textContent = `Traits: ${traits && traits.length > 0 ? traits.join(', ') : 'None'}`;
            if (tempInventoryDisplay) tempInventoryDisplay.textContent = `Level Items: ${temporaryInventory && temporaryInventory.length > 0 ? temporaryInventory.join(', ') : 'None'}`;
            if (persistentInventoryDisplay) {
                persistentInventoryDisplay.textContent = `Persistent Items: ${persistentInventory && persistentInventory.length > 0 ? persistentInventory.join(', ') : 'None'}`;
            }
            if (energyDisplay) energyDisplay.textContent = `Energy: ${energy || 0} | MP: ${movementPoints || 0}`;
        } catch (error) {
            console.error("Error updating UI:", error);
        }
    }

    function getAdjacentTiles(centerTile, range = 1) {
        if (!centerTile) return [];
        
        const row = parseInt(centerTile.getAttribute('data-row'));
        const col = parseInt(centerTile.getAttribute('data-col'));
        const adjacent = [];
        
        for (let r = row - range; r <= row + range; r++) {
            for (let c = col - range; c <= col + range; c++) {
                if (r === row && c === col) continue;
                
                if (Math.abs(r - row) + Math.abs(c - col) > range * 2) continue;
                
                const tile = document.querySelector(`.hex-container[data-row="${r}"][data-col="${c}"]`);
                if (tile) {
                    adjacent.push(tile);
                }
            }
        }
        
        return adjacent;
    }

    function moveAction() {
        currentAction = 'move';
        const moveRange = 1; // Standard move range is 1
        const movableTiles = getAdjacentTiles(playerTile, moveRange);
        
        const validMoveTiles = movableTiles.filter(tile => 
            tile.dataset.type !== 'blocked' && 
            tile.dataset.type !== 'water'
        );
        
        highlightTiles('move');
    }

    function senseAction() {
        currentAction = 'sense';
        const sensorRange = traits.includes('senser') ? 2 : 1;
        
        highlightTiles('sense');
    }

    function pokeAction() {
        currentAction = 'poke';
        const pokeRange = 1; // Standard poke range is 1
        
        highlightTiles('poke');
    }

    function handleTileClick(event) {
        if (!isGameActive) return;
        
        const container = event.currentTarget;
        if (!container) {
            console.log("No container found for click");
            return;
        }
        
        const tileId = container.getAttribute('id');
        console.log(`Clicked on tile ${tileId}`);
        
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
        
        playerTile.querySelector('.character')?.remove();
        playerTile = targetTile;
        const character = document.createElement('div');
        character.className = 'character';
        character.innerHTML = '<i class="fas fa-user"></i>';
        playerTile.appendChild(character);
        
        const energyCost = traits.includes('pathfinder') ? 1 : 2;
        energy -= energyCost;
        levelStats.energyUsed += energyCost;
        movementPoints--;
        levelStats.tilesMoved++;
        
        if (targetTile.dataset.type === 'zoe') {
            targetTile.dataset.type = 'empty';
            targetTile.classList.remove('zoe-tile');
            zoeFound = true;
            const goalTile = document.querySelector('[data-type="goal"]');
            goalTile.classList.add('goal-tile');
            
            levelStats.zoeFound = true;
        }
        
        if (targetTile.dataset.type === 'goal' && zoeFound) {
            levelStats.goalReached = true;
            showVictoryScreen();
            return;
        }
        
        updateFogOfWar();
        updateUI();
    }

    function performSense(targetTile) {
        if (!targetTile || targetTile === playerTile) return;
        
        const energyCost = traits.includes('senser') ? 1 : 2;
        energy -= energyCost;
        levelStats.energyUsed += energyCost;
        levelStats.tilesSensed++;
        
        if (targetTile.dataset.type === 'zoe') {
            targetTile.classList.add('zoe-tile');
        } else if (targetTile.dataset.type === 'goal' && zoeFound) {
            targetTile.classList.add('goal-tile');
        }
        
        currentAction = null;
        highlightTiles(null);
        updateUI();
    }

    function performPoke(targetTile) {
        if (!targetTile || targetTile === playerTile) return;
        
        const energyCost = traits.includes('explorer') ? 1 : 2;
        energy -= energyCost;
        levelStats.energyUsed += energyCost;
        levelStats.tilesInteracted++;
        
        if (targetTile.dataset.type === 'zoe') {
            targetTile.classList.add('zoe-tile');
            targetTile.dataset.type = 'empty';
            zoeFound = true;
            const goalTile = document.querySelector('[data-type="goal"]');
            goalTile.classList.add('goal-tile');
            
            levelStats.zoeFound = true;
        } else if (targetTile.dataset.type === 'goal' && zoeFound) {
            levelStats.goalReached = true;
            showVictoryScreen();
            return;
        }
        
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
        const visionRange = traits.includes('zoeMaster') ? 3 : traits.includes('zoeInitiate') ? 2 : 1;
        const visibleTiles = getTilesInRange(currentRow, currentCol, visionRange);

        visibleTiles.forEach(tile => {
            const tileContainer = document.querySelector(`.hex-container[data-row="${tile.row}"][data-col="${tile.col}"]`);
            if (tileContainer) tileContainer.classList.remove('unexplored');
        });
    }

    document.getElementById('move-btn')?.addEventListener('click', () => {
        moveAction();
    });

    document.getElementById('sense-btn')?.addEventListener('click', () => {
        senseAction();
    });

    document.getElementById('poke-btn')?.addEventListener('click', () => {
        pokeAction();
    });

    document.getElementById('rest-btn')?.addEventListener('click', () => {
        rest();
    });

    document.getElementById('end-turn-btn')?.addEventListener('click', () => {
        endTurn();
    });

    initializeGame();

    const statsWindow = document.getElementById('stats-window');
    statsWindow.addEventListener('click', (e) => {
        if (e.target.id === 'next-level-btn') {
            statsWindow.style.display = 'none';
            isGameActive = true;
            initializeGame();
        }
    });

    const resizeBtn = document.getElementById('resize-btn');
    if (resizeBtn) {
        resizeBtn.addEventListener('click', () => {
            const newRows = parseInt(document.getElementById('rows-input').value);
            const newCols = parseInt(document.getElementById('cols-input').value);
            if (newRows >= 3 && newCols >= 3 && newRows <= 20 && newCols <= 20) {
                rows = newRows;
                cols = newCols;
                initializeGame();
            } else {
                alert('Please choose rows and columns between 3 and 20.');
            }
        });
    }

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
                
                generation: 1,
                evolutionStage: 'basic', 
                generationHistory: [],
                ancestralTraits: [],
                
                levelsCompleted: 0,
                totalTurns: 0,
                totalEnergy: 0,
                totalRests: 0,
                optimPathRatio: 0,
                explorationPercentage: 0,
                
                traitAffinities: {
                    explorer: 0,
                    senser: 0,
                    pathfinder: 0,
                    zoeAdept: 0
                }
            };
            ({ stats, traits, xp, sensedTypes, uniquesensedTypes, hasFoundZoe, zoeLevelsCompleted, sensesMade, pokesMade, generation, evolutionStage, generationHistory, ancestralTraits, levelsCompleted, totalTurns, totalEnergy, totalRests, optimPathRatio, explorationPercentage, traitAffinities } = playerProgress);
            initializeGame();
        });
    }

    function showVictoryScreen() {
        const performance = calculatePerformance();
        
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
        
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        
        const victoryBox = document.createElement('div');
        victoryBox.className = 'victory-box';
        
        const title = document.createElement('h2');
        title.textContent = 'Level Complete!';
        victoryBox.appendChild(title);
        
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
        
        const continueBtn = document.createElement('button');
        continueBtn.textContent = 'Continue to Next Level';
        continueBtn.addEventListener('click', () => {
            overlay.remove();
            initializeGame();
        });
        victoryBox.appendChild(continueBtn);
        
        overlay.appendChild(victoryBox);
        document.body.appendChild(overlay);
        
        isGameActive = false;
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
});