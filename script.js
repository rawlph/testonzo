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

    // Player progress and state
    let playerProgress = JSON.parse(localStorage.getItem('playerProgress')) || {
        stats: { movementRange: 1, luck: 0 },
        traits: [],
        persistentInventory: [],
        xp: 0,
        observedTypes: [],
        observationsMade: 0,
        hasFoundZoe: false,  // Track if Zoe has been found
        zoeLevelsCompleted: 0  // Track levels completed with Zoe for traits
    };
    let { stats, traits, persistentInventory, xp, observedTypes, observationsMade, hasFoundZoe, zoeLevelsCompleted } = playerProgress;
    let temporaryInventory = [];
    let energy = 5 * (rows + cols - 2); // Starting energy
    let currentAction = null; // 'move' or 'observe'

    // Function to highlight tiles based on the action
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

    // Vision mechanics: Update visible tiles based on range
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
                    state: 'active'
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

        // Place Zoe only if not found yet
        if (!hasFoundZoe) {
            const zoeRow = 2;
            const zoeCol = 2;
            tileData[zoeRow][zoeCol].type = 'zoe';
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
        currentAction = null;
        highlightTiles(null);
        updateVision(tileData); // Initial vision update
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
                    const currentHex = document.querySelector(`.hex-container[data-row="${currentRow}"][data-col="${currentCol}"]`);
                    currentHex.querySelector('.character').style.display = 'none';
                    currentRow = clickedRow;
                    currentCol = clickedCol;
                    container.querySelector('.character').style.display = 'block';

                    if (energy > 0) {
                        energy -= 1;
                    }

                    if (tile.type === 'zoe') {
                        temporaryInventory.push('zoe');
                        tile.type = 'normal';
                        container.classList.remove('zoe');
                        const goalTile = document.querySelector(`.hex-container[data-row="${rows - 1}"][data-col="${cols - 1}"]`);
                        goalTile.classList.add('goal-visible');
                        const feedbackMessage = document.getElementById('feedback-message');
                        feedbackMessage.textContent = "You’ve grasped the spark of life, igniting a faint sense of purpose.";
                        feedbackMessage.style.display = 'block';
                        setTimeout(() => { feedbackMessage.style.display = 'none'; }, 3000);
                    }
                    if (tile.type === 'key') {
                        temporaryInventory.push('key');
                        tile.type = 'normal';
                        container.classList.remove('key');
                    }
                    if (tile.type === 'energy') {
                        energy += 5;
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

                        const feedbackMessage = document.getElementById('feedback-message');
                        feedbackMessage.textContent = `Observed a ${tile.type} tile!`;
                        feedbackMessage.style.display = 'block';
                        setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);

                        if (!isCurrentTile) {
                            turnCount++;
                        }

                        updateUI();
                    } else {
                        console.log("Not enough energy to observe!");
                    }
                }

                // Victory condition
                if (currentRow === rows - 1 && currentCol === cols - 1) {
                    const winScreen = document.getElementById('win-screen');
                    if (winScreen) {
                        let winMessage = 'You reached the goal, but without Zoe, your journey feels incomplete.';
                        let xpGain = 5;
                        if (temporaryInventory.includes('zoe')) {
                            winMessage = 'Victory! You reached the goal with Zoe—amazing!';
                            xpGain = 10;
                            playerProgress.hasFoundZoe = true;
                            playerProgress.zoeLevelsCompleted += 1;
                            if (playerProgress.zoeLevelsCompleted === 1 && !traits.includes('zoeInitiate')) {
                                traits.push('zoeInitiate');
                            } else if (playerProgress.zoeLevelsCompleted === 4 && !traits.includes('zoeAdept')) {
                                traits.push('zoeAdept');
                            } else if (playerProgress.zoeLevelsCompleted === 7 && !traits.includes('zoeMaster')) {
                                traits.push('zoeMaster');
                            }
                        } else if (temporaryInventory.includes('key')) {
                            winMessage = 'Victory! You reached the goal with the key.';
                            xpGain = 10;
                            if (!traits.includes('Keymaster')) traits.push('Keymaster');
                        }
                        winScreen.querySelector('p').textContent = winMessage;
                        winScreen.style.display = 'block';
                        xp += xpGain;
                        localStorage.setItem('playerProgress', JSON.stringify(playerProgress));
                    }

                    const statsWindow = document.getElementById('stats-window');
                    if (statsWindow) {
                        const typeCounts = {};
                        playerProgress.observedTypes.forEach(type => {
                            typeCounts[type] = (typeCounts[type] || 0) + 1;
                        });
                        const observedTypesText = Object.entries(typeCounts)
                            .map(([type, count]) => `${type}: ${count}`)
                            .join(', ');
                        document.getElementById('turns-stat').textContent = `Turns: ${turnCount}`;
                        document.getElementById('observations-stat').textContent = `Observations Made: ${playerProgress.observationsMade}`;
                        document.getElementById('observed-types-stat').textContent = `Observed Types: ${observedTypesText || 'None'}`;
                        statsWindow.style.display = 'block';
                    }
                }
            });
        });
    }

    const turnDisplay = document.getElementById('turn-counter');
    const statsDisplay = document.getElementById('stats-display');
    const traitsDisplay = document.getElementById('traits-display');
    const tempInventoryDisplay = document.getElementById('temp-inventory-display');
    const persistentInventoryDisplay = document.getElementById('persistent-inventory-display');
    const energyDisplay = document.getElementById('energy-display');

    function updateUI() {
        if (turnDisplay) turnDisplay.textContent = `Turns: ${turnCount}`;
        if (statsDisplay) statsDisplay.textContent = `Moves: ${stats.movementRange} | Luck: ${stats.luck} | XP: ${xp}`;
        if (traitsDisplay) traitsDisplay.textContent = `Traits: ${traits.length > 0 ? traits.join(', ') : 'None'}`;
        if (tempInventoryDisplay) tempInventoryDisplay.textContent = `Level Items: ${temporaryInventory.length > 0 ? temporaryInventory.join(', ') : 'None'}`;
        if (persistentInventoryDisplay) persistentInventoryDisplay.textContent = `Persistent Items: ${persistentInventory.length > 0 ? persistentInventory.join(', ') : 'None'}`;
        if (energyDisplay) energyDisplay.textContent = `Energy: ${energy}`;
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

    // Initialize the game
    startGame();

    // Close stats window and restart
    document.getElementById('close-stats-btn').addEventListener('click', () => {
        const statsWindow = document.getElementById('stats-window');
        if (statsWindow) statsWindow.style.display = 'none';
        const winScreen = document.getElementById('win-screen');
        if (winScreen) winScreen.style.display = 'none';
        startGame();
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
                traits: [],
                persistentInventory: [],
                xp: 0,
                observedTypes: [],
                observationsMade: 0,
                hasFoundZoe: false,
                zoeLevelsCompleted: 0
            };
            ({ stats, traits, persistentInventory, xp, observedTypes, observationsMade, hasFoundZoe, zoeLevelsCompleted } = playerProgress);
            startGame();
        });
    }

    // Restart button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            const winScreen = document.getElementById('win-screen');
            if (winScreen) winScreen.style.display = 'none';
            startGame();
        });
    }
});