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
    let currentLevelObservations = 0;  // Observations in the current level (for Explorer)
    let moveCounter = 0;  // Moves made (for Pathfinder energy cost)
    let hasUsedObserverBonus = false;  // Flag for Observer’s free reveal

    // Player progress and state
    let playerProgress = JSON.parse(localStorage.getItem('playerProgress')) || {
        stats: { movementRange: 1, luck: 0 },
        traits: [],  // Stores unlocked traits like 'explorer', 'pathfinder', 'observer'
        persistentInventory: [],
        xp: 0,
        observedTypes: [],
        observationsMade: 0,
        hasFoundZoe: false,
        zoeLevelsCompleted: 0,
        uniqueObservedTypes: []  // Unique tile types observed across all levels (for Observer)
    };
    let { stats, traits, persistentInventory, xp, observedTypes, observationsMade, hasFoundZoe, zoeLevelsCompleted, uniqueObservedTypes } = playerProgress;
    let temporaryInventory = [];
    let energy = 5 * (rows + cols - 2); // Starting energy
    let currentAction = null; // 'move' or 'observe'

    // Highlight tiles based on the selected action
    function highlightTiles(action) {
        const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
        document.querySelectorAll('.hex-container').forEach(container => {
            const row = parseInt(container.getAttribute('data-row'));
            const col = parseInt(container.getAttribute('data-col'));
            container.classList.remove('highlight-move', 'highlight-observe');
            if (action === 'move' && adjacentTiles.some(t => t.row === row && t.col === col)) {
                container.classList.add('highlight-move');
            } else if (action === 'observe') {
                if ((row === currentRow && col === currentCol) || adjacentTiles.some(t => t.row === row && t.col === col)) {
                    container.classList.add('highlight-observe');
                }
            }
        });
    }

    // Update visible tiles based on vision range
    function updateVision(tileData) {
        const visionRange = traits.includes('zoeMaster') ? 3 : traits.includes('zoeInitiate') ? 2 : 1;
        const visibleTiles = getTilesInRange(currentRow, currentCol, visionRange);

        document.querySelectorAll('.hex-container').forEach(container => {
            const row = parseInt(container.getAttribute('data-row'));
            const col = parseInt(container.getAttribute('data-col'));
            if (visibleTiles.some(t => t.row === row && t.col === col)) {
                container.classList.remove('unexplored');
            } else {
                container.classList.add('unexplored');
            }
        });
    }

    // Get tiles within a specified range (simplified for hex grid)
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

    // Get adjacent tiles (simplified hex grid adjacency)
    function getAdjacentTiles(row, col) {
        const directions = [
            { row: -1, col: 0 }, { row: 1, col: 0 },  // Up, Down
            { row: 0, col: -1 }, { row: 0, col: 1 },  // Left, Right
            { row: -1, col: row % 2 === 0 ? -1 : 1 }, { row: 1, col: row % 2 === 0 ? -1 : 1 }  // Diagonals
        ];
        return directions
            .map(dir => ({ row: row + dir.row, col: col + dir.col }))
            .filter(pos => pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols);
    }

    // Initialize tile data
    function createTileData(rows, cols) {
        const tileData = [];
        for (let row = 0; row < rows; row++) {
            tileData[row] = [];
            for (let col = 0; col < cols; col++) {
                tileData[row][col] = {
                    type: 'normal',
                    effects: [],
                    state: 'active'
                };
            }
        }
        return tileData;
    }

    // Get positions not on the default path
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

    // Place special tiles on the grid
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

    // Build the visual grid
    function buildGrid(rows, cols, tileData) {
        const grid = document.querySelector('.grid');
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
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M43.3 0 L86.6 25 L86.6 75 L43.3 100 L0 75 L0 25 Z');
                svg.appendChild(path);
                hexContainer.appendChild(svg);

                const character = document.createElement('div');
                character.classList.add('character');
                hexContainer.appendChild(character);

                const tileType = tileData[row][col].type;
                hexContainer.classList.add(tileType);

                hexRow.appendChild(hexContainer);
            }
            grid.appendChild(hexRow);
        }
    }

    // Update the UI (simplified placeholder)
    function updateUI() {
        const energyDisplay = document.getElementById('energy');
        if (energyDisplay) energyDisplay.textContent = `Energy: ${energy}`;
        const turnDisplay = document.getElementById('turn-count');
        if (turnDisplay) turnDisplay.textContent = `Turn: ${turnCount}`;
        const traitsDisplay = document.getElementById('traits');
        if (traitsDisplay) traitsDisplay.textContent = `Traits: ${traits.join(', ') || 'None'}`;
    }

    // Start the game
    function startGame() {
        const tileData = createTileData(rows, cols);
        placeTiles(tileData, rows, cols);
        buildGrid(rows, cols, tileData);

        document.querySelectorAll('.character').forEach(char => char.style.display = 'none');
        const startingHex = document.querySelector('.hex-container[data-row="0"][data-col="0"]');
        if (startingHex) startingHex.querySelector('.character').style.display = 'block';

        currentRow = 0;
        currentCol = 0;
        energy = 5 * (rows + cols - 2);
        temporaryInventory = [];
        turnCount = 0;
        currentLevelObservations = 0;  // Reset per level
        moveCounter = 0;  // Reset per level
        hasUsedObserverBonus = false;  // Reset per level
        highlightTiles(null);
        updateVision(tileData);
        updateUI();

        document.getElementById('move-btn').addEventListener('click', () => {
            currentAction = 'move';
            highlightTiles('move');
        });

        document.getElementById('observe-btn').addEventListener('click', () => {
            currentAction = 'observe';
            highlightTiles('observe');
        });

        document.querySelectorAll('.hex-container').forEach(container => {
            container.addEventListener('click', () => {
                const clickedRow = parseInt(container.getAttribute('data-row'));
                const clickedCol = parseInt(container.getAttribute('data-col'));
                const tile = tileData[clickedRow][clickedCol];
                const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
                const isAdjacent = adjacentTiles.some(t => t.row === clickedRow && t.col === clickedCol);
                const isCurrentTile = (clickedRow === currentRow && clickedCol === currentCol);

                if (currentAction === 'move' && isAdjacent && tile.type !== 'blocked' && tile.type !== 'water') {
                    moveCounter++;  // Increment for Pathfinder
                    const currentHex = document.querySelector(`.hex-container[data-row="${currentRow}"][data-col="${currentCol}"]`);
                    currentHex.querySelector('.character').style.display = 'none';
                    currentRow = clickedRow;
                    currentCol = clickedCol;
                    container.querySelector('.character').style.display = 'block';

                    // Pathfinder: 0.5 energy/move (deduct 1 energy every two moves)
                    if (!traits.includes('pathfinder') || moveCounter % 2 === 0) {
                        if (energy > 0) energy -= 1;
                    }

                    if (tile.type === 'zoe') {
                        temporaryInventory.push('zoe');
                        tile.type = 'normal';
                        container.classList.remove('zoe');
                    }
                    if (tile.type === 'key') {
                        temporaryInventory.push('key');
                        tile.type = 'normal';
                        container.classList.remove('key');
                    }
                    if (tile.type === 'energy') {
                        let energyGain = 5;
                        if (traits.includes('explorer')) energyGain += 1;  // Explorer: +1 energy
                        energy += energyGain;
                        tile.type = 'normal';
                        container.classList.remove('energy');
                    }

                    turnCount++;
                    updateVision(tileData);
                    updateUI();
                    highlightTiles(currentAction);
                } else if (currentAction === 'observe') {
                    const energyCost = traits.includes('zoeAdept') ? (isCurrentTile ? 2 : 1) : (isCurrentTile ? 4 : 2);
                    if (energy >= energyCost) {
                        energy -= energyCost;
                        playerProgress.observedTypes.push(tile.type);
                        playerProgress.observationsMade++;
                        currentLevelObservations++;  // For Explorer unlock

                        // Observer: Track unique tile types
                        if (!uniqueObservedTypes.includes(tile.type)) {
                            uniqueObservedTypes.push(tile.type);
                        }

                        const feedbackMessage = document.getElementById('feedback-message');
                        feedbackMessage.textContent = `Observed a ${tile.type} tile!`;
                        feedbackMessage.style.display = 'block';
                        setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);

                        if (!isCurrentTile) turnCount++;

                        // Observer: Free adjacent tile reveal once per level
                        if (traits.includes('observer') && !hasUsedObserverBonus) {
                            hasUsedObserverBonus = true;
                            const adjacent = getAdjacentTiles(currentRow, currentCol);
                            if (adjacent.length > 0) {
                                const randomAdj = adjacent[Math.floor(Math.random() * adjacent.length)];
                                const adjTile = tileData[randomAdj.row][randomAdj.col];
                                playerProgress.observedTypes.push(adjTile.type);
                                if (!uniqueObservedTypes.includes(adjTile.type)) {
                                    uniqueObservedTypes.push(adjTile.type);
                                }
                                currentLevelObservations++;
                                feedbackMessage.textContent += ` Bonus: Observed an adjacent ${adjTile.type} tile for free!`;
                            }
                        }

                        updateUI();
                    } else {
                        console.log("Not enough energy to observe!");
                    }
                }

                // Victory condition and trait unlocks
                if (currentRow === rows - 1 && currentCol === cols - 1) {
                    const gridSize = Math.min(rows, cols);
                    const pathfinderTurnLimit = gridSize * 2;  // Scales with grid size (e.g., 10 for 5x5)

                    // Unlock Explorer
                    if (currentLevelObservations >= 10 && !traits.includes('explorer')) {
                        traits.push('explorer');
                        console.log("Unlocked Explorer!");
                    }
                    // Unlock Pathfinder
                    if (turnCount < pathfinderTurnLimit && !traits.includes('pathfinder')) {
                        traits.push('pathfinder');
                        console.log("Unlocked Pathfinder!");
                    }
                    // Unlock Observer
                    if (uniqueObservedTypes.length >= 5 && !traits.includes('observer')) {
                        traits.push('observer');
                        console.log("Unlocked Observer!");
                    }

                    // Save progress to localStorage
                    playerProgress.traits = traits;
                    playerProgress.uniqueObservedTypes = uniqueObservedTypes;
                    localStorage.setItem('playerProgress', JSON.stringify(playerProgress));

                    console.log("Victory! Traits:", traits);
                    // Add victory screen logic here if desired
                }
            });
        });
    }

    // Start the game
    startGame();
});