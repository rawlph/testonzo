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

    // **New Function: Create tileData array**
    function createTileData(rows, cols) {
        const tileData = [];
        for (let row = 0; row < rows; row++) {
            tileData[row] = [];
            for (let col = 0; col < cols; col++) {
                tileData[row][col] = {
                    type: 'normal',    // Default tile type
                    effects: [],       // Placeholder for future effects
                    state: 'active'    // Placeholder for future states
                };
            }
        }
        return tileData;
    }

    // **New Function: Identify non-path positions**
    function getNonPathPositions(rows, cols) {
        const path = [];
        // Top row
        for (let col = 0; col < cols; col++) path.push({ row: 0, col });
        // Rightmost column (excluding top-right corner)
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

    // **Updated Function: Place tiles using tileData**
    function placeTiles(tileData, rows, cols) {
        // Set the goal tile
        tileData[rows - 1][cols - 1].type = 'goal';

        let nonPathPositions = getNonPathPositions(rows, cols);
        // Shuffle positions for randomness
        for (let i = nonPathPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nonPathPositions[i], nonPathPositions[j]] = [nonPathPositions[j], nonPathPositions[i]];
        }

        const gridSize = Math.min(rows, cols);
        // Place blocked tiles
        const blocksToPlace = gridSize >= 3 ? 2 * Math.floor((gridSize - 2) / 2) : 0;
        for (let i = 0; i < blocksToPlace && nonPathPositions.length > 0; i++) {
            const pos = nonPathPositions.shift();
            tileData[pos.row][pos.col].type = 'blocked';
        }

        // Place key tile
        if (nonPathPositions.length > 0) {
            const pos = nonPathPositions.shift();
            tileData[pos.row][pos.col].type = 'key';
        }

        // Place energy tiles
        const energyTileCount = Math.floor(gridSize / 2);
        for (let i = 0; i < energyTileCount && nonPathPositions.length > 0; i++) {
            const pos = nonPathPositions.shift();
            tileData[pos.row][pos.col].type = 'energy';
        }
    }

    // **Updated Function: Build grid using tileData**
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

                // Apply tile type as a class for styling
                const tileType = tileData[row][col].type;
                hexContainer.classList.add(tileType);

                hexRow.appendChild(hexContainer);
            }
            grid.appendChild(hexRow);
        }
    }

    // Player progress and state
    let playerProgress = JSON.parse(localStorage.getItem('playerProgress')) || {
        stats: { movementRange: 1, luck: 0 },
        traits: [],
        persistentInventory: [],
        xp: 0
    };
    let { stats, traits, persistentInventory, xp } = playerProgress;
    let temporaryInventory = [];
    let energy = 5 * (rows + cols - 2); // Starting energy

    // **Updated Function: Start or restart the game**
    function startGame() {
        const tileData = createTileData(rows, cols);
        placeTiles(tileData, rows, cols);
        buildGrid(rows, cols, tileData);

        // Reset character visibility
        document.querySelectorAll('.character').forEach(char => char.style.display = 'none');
        const startingHex = document.querySelector('.hex-container[data-row="0"][data-col="0"]');
        if (startingHex) startingHex.querySelector('.character').style.display = 'block';

        // Reset game state
        currentRow = 0;
        currentCol = 0;
        energy = 5 * (rows + cols - 2);
        temporaryInventory = [];
        turnCount = 0;
        updateUI();

        // Attach click handlers using tileData
        document.querySelectorAll('.hex-container').forEach(container => {
            container.addEventListener('click', () => {
                const clickedRow = parseInt(container.getAttribute('data-row'));
                const clickedCol = parseInt(container.getAttribute('data-col'));
                const tile = tileData[clickedRow][clickedCol];
                const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
                const isAdjacent = adjacentTiles.some(t => t.row === clickedRow && t.col === clickedCol);
                const isBlocked = tile.type === 'blocked';

                if (isAdjacent && !isBlocked && energy > 0) {
                    energy -= 1;
                    const currentHex = document.querySelector(`.hex-container[data-row="${currentRow}"][data-col="${currentCol}"]`);
                    currentHex.querySelector('.character').style.display = 'none';
                    currentRow = clickedRow;
                    currentCol = clickedCol;
                    container.querySelector('.character').style.display = 'block';

                    // Handle interactions
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
                    updateUI();

                    // Check victory condition
                    if (currentRow === rows - 1 && currentCol === cols - 1) {
                        const winScreen = document.getElementById('win-screen');
                        if (winScreen) {
                            let winMessage = 'Victory! You reached the goal.';
                            let xpGain = 10;
                            if (temporaryInventory.includes('key')) {
                                winMessage = 'Victory! You reached the goal with the key—amazing!';
                                if (traits.includes('Keymaster')) {
                                    xpGain += 5; // Bonus XP for Keymaster trait
                                }
                            }
                            winScreen.querySelector('p').textContent = winMessage;
                            winScreen.style.display = 'block';
                            xp += xpGain;
                            if (temporaryInventory.includes('key') && !traits.includes('Keymaster')) {
                                traits.push('Keymaster');
                            }
                            localStorage.setItem('playerProgress', JSON.stringify({ stats, traits, persistentInventory, xp }));
                        }
                    }
                }
            });
        });
    }

    // UI elements and update function
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

    // Adjacent tiles calculation
    function getAdjacentTiles(row, col) {
        const isOddRow = row % 2 === 1;
        const adjacent = [
            { row: row - 1, col: col },      // Top
            { row: row + 1, col: col },      // Bottom
            { row: row, col: col - 1 },      // Left
            { row: row, col: col + 1 },      // Right
            { row: row - 1, col: isOddRow ? col + 1 : col - 1 }, // Top diagonal
            { row: row + 1, col: isOddRow ? col + 1 : col - 1 }  // Bottom diagonal
        ];
        return adjacent.filter(tile => tile.row >= 0 && tile.row < rows && tile.col >= 0 && tile.col < cols);
    }

    // Initialize the game
    startGame();

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
                xp: 0
            };
            ({ stats, traits, persistentInventory, xp } = playerProgress);
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