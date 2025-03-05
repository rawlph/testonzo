document.addEventListener('DOMContentLoaded', () => {
    let rows = 5;  // Initial grid size
    let cols = 5;
    const hexVisualWidth = 86.6;
    const hexHeight = 100;
    const rowOffset = hexHeight * 0.75;
    const colOffset = hexVisualWidth;
    let turnCount = 0;

    // Function to build the grid based on rows and cols
    function buildGrid(rows, cols) {
        const grid = document.querySelector('.grid');
        grid.innerHTML = '';  // Clear existing grid

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

                if (row === rows - 1 && col === cols - 1) {
                    hexContainer.classList.add('goal');
                }

                hexRow.appendChild(hexContainer);
            }
            grid.appendChild(hexRow);
        }
    }

    // Load persistent progress or initialize
    let playerProgress = JSON.parse(localStorage.getItem('playerProgress')) || {
        stats: { movementRange: 1, luck: 0 },
        traits: [],
        persistentInventory: [],
        xp: 0
    };
    let { stats, traits, persistentInventory, xp } = playerProgress;

    let temporaryInventory = [];
    let energy = 5 * (rows + cols - 2);  // Starting energy

    // Function to place tiles (blocked, key, energy)
    function placeTiles() {
        const path = [];
        for (let col = 0; col < cols; col++) path.push({ row: 0, col });
        for (let row = 1; row < rows; row++) path.push({ row, col: cols - 1 });

        const nonPathTiles = [];
        document.querySelectorAll('.hex-container').forEach(container => {
            const row = parseInt(container.getAttribute('data-row'));
            const col = parseInt(container.getAttribute('data-col'));
            const isPath = path.some(p => p.row === row && p.col === col);
            const isStartOrGoal = (row === 0 && col === 0) || (row === rows - 1 && col === cols - 1);
            if (!isPath && !isStartOrGoal) {
                nonPathTiles.push(container);
            }
        });

        const gridSize = Math.min(rows, cols);
        const blocksToPlace = gridSize >= 3 ? 2 * Math.floor((gridSize - 2) / 2) : 0;
        for (let i = 0; i < blocksToPlace && nonPathTiles.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * nonPathTiles.length);
            const blockedTile = nonPathTiles.splice(randomIndex, 1)[0];
            blockedTile.classList.add('blocked');
        }

        if (nonPathTiles.length > 0) {
            const randomIndex = Math.floor(Math.random() * nonPathTiles.length);
            const keyTile = nonPathTiles.splice(randomIndex, 1)[0];
            keyTile.classList.add('key');
        }

        const energyTileCount = Math.floor(gridSize / 2);
        for (let i = 0; i < energyTileCount && nonPathTiles.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * nonPathTiles.length);
            const energyTile = nonPathTiles.splice(randomIndex, 1)[0];
            energyTile.classList.add('energy');
        }
    }

    // Function to start or restart the game
    function startGame() {
    buildGrid(rows, cols);
    placeTiles();
    // Hide all characters to ensure only one is visible
    document.querySelectorAll('.character').forEach(char => char.style.display = 'none');
    const startingHex = document.querySelector('.hex-container[data-row="0"][data-col="0"]');
    if (startingHex) startingHex.querySelector('.character').style.display = 'block';
    // Reset current position
    currentRow = 0;
    currentCol = 0;
    energy = 5 * (rows + cols - 2);  // Reset energy
    temporaryInventory = [];
    turnCount = 0;
    updateUI();

        // Attach movement logic to the new grid
        document.querySelectorAll('.hex-container').forEach(container => {
            container.addEventListener('click', () => {
                const clickedRow = parseInt(container.getAttribute('data-row'));
                const clickedCol = parseInt(container.getAttribute('data-col'));
                const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
                const isAdjacent = adjacentTiles.some(tile => tile.row === clickedRow && tile.col === clickedCol);
                const isBlocked = container.classList.contains('blocked');

                if (isAdjacent && !isBlocked) {
                    energy -= 1;
                    const currentHex = document.querySelector(`.hex-container[data-row="${currentRow}"][data-col="${currentCol}"]`);
                    currentHex.querySelector('.character').style.display = 'none';
                    currentRow = clickedRow;
                    currentCol = clickedCol;
                    container.querySelector('.character').style.display = 'block';

                    if (container.classList.contains('key')) {
                        temporaryInventory.push('key');
                        container.classList.remove('key');
                    }
                    if (container.classList.contains('energy')) {
                        energy += 5;
                        container.classList.remove('energy');
                    }

                    turnCount++;
                    updateUI();

                    if (currentRow === rows - 1 && currentCol === cols - 1) {
                        const winScreen = document.getElementById('win-screen');
                        if (winScreen) {
                            const winMessage = temporaryInventory.includes('key') ? 'Victory with key!' : 'Victory!';
                            winScreen.querySelector('p').textContent = winMessage;
                            winScreen.style.display = 'block';
                            xp += 10;
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

    

    // UI elements
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

    // Movement logic variables
    let currentRow = 0;
    let currentCol = 0;
    function getAdjacentTiles(row, col) {
        const isOddRow = row % 2 === 1;
        const adjacent = [
            { row: row - 1, col: col },      // Top
            { row: row + 1, col: col },      // Bottom
            { row: row, col: col - 1 },      // Left
            { row: row, col: col + 1 },      // Right
            { row: row - 1, col: isOddRow ? col + 1 : col - 1 },  // Top diagonal
            { row: row + 1, col: isOddRow ? col + 1 : col - 1 }   // Bottom diagonal
        ];
        return adjacent.filter(tile => tile.row >= 0 && tile.row < rows && tile.col >= 0 && tile.col < cols);
    }
// Initial game start
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