document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const rows = 5;
    const cols = 5;
    const hexVisualWidth = 86.6;
    const hexHeight = 100;
    const rowOffset = hexHeight * 0.75;
    const colOffset = hexVisualWidth;

    // Load persistent progress or initialize with energy
    let playerProgress = JSON.parse(localStorage.getItem('playerProgress')) || {
        stats: { movementRange: 1, luck: 0 },
        traits: [],
        persistentInventory: [],
        xp: 0,
        energy: 0 // Add energy to track it
    };
    let { stats, traits, persistentInventory, xp, energy } = playerProgress;
    let temporaryInventory = [];

    // Calculate total grid dimensions
    const totalWidth = (cols - 1) * colOffset + hexVisualWidth;
    const totalHeight = (rows - 1) * rowOffset + hexHeight;
    grid.style.width = `${totalWidth}px`; // Fixed string interpolation
    grid.style.height = `${totalHeight}px`;
    grid.style.position = 'relative';

    // Generate the grid
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

    // Function to place all tiles (blocked, key, energy)
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

        // Place blocked tiles
        const gridSize = Math.min(rows, cols);
        const blocksToPlace = gridSize >= 3 ? 2 * Math.floor((gridSize - 2) / 2) : 0;
        for (let i = 0; i < blocksToPlace && nonPathTiles.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * nonPathTiles.length);
            const blockedTile = nonPathTiles.splice(randomIndex, 1)[0];
            blockedTile.classList.add('blocked');
        }

        // Place key
        if (nonPathTiles.length > 0) {
            const randomIndex = Math.floor(Math.random() * nonPathTiles.length);
            const keyTile = nonPathTiles.splice(randomIndex, 1)[0]; // Remove from available tiles
            keyTile.classList.add('key');
        }

        // Place energy tiles
        const energyTileCount = Math.floor(gridSize / 2);
        for (let i = 0; i < energyTileCount && nonPathTiles.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * nonPathTiles.length);
            const energyTile = nonPathTiles.splice(randomIndex, 1)[0];
            energyTile.classList.add('energy');
        }
    }

    // Initial tile placement
    placeTiles();

    // Game state
    const startingHex = document.querySelector('.hex-container[data-row="0"][data-col="0"]');
    if (startingHex) startingHex.querySelector('.character').style.display = 'block';

    let turnCount = 0;
    const turnDisplay = document.getElementById('turn-counter');
    const statsDisplay = document.getElementById('stats-display');
    const traitsDisplay = document.getElementById('traits-display');
    const tempInventoryDisplay = document.getElementById('temp-inventory-display');
    const persistentInventoryDisplay = document.getElementById('persistent-inventory-display');
    const energyDisplay = document.getElementById('energy-display'); // New energy display element

    // Initial UI update
    updateUI();

    let currentRow = 0;
    let currentCol = 0;

    function getAdjacentTiles(row, col) {
        const adjacent = [];
        const isEvenRow = row % 2 === 0;
        let directions = isEvenRow ? [
            [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
        ] : [
            [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
        ];

        directions.forEach(([dRow, dCol]) => {
            const newRow = row + dRow;
            const newCol = col + dCol;
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                adjacent.push({ row: newRow, col: newCol });
            }
        });
        return adjacent;
    }

    function updateUI() {
        if (turnDisplay) turnDisplay.textContent = `Turns: ${turnCount}`; // Fixed string syntax
        if (statsDisplay) statsDisplay.textContent = `Moves: ${stats.movementRange} | Luck: ${stats.luck} | XP: ${xp}`;
        if (traitsDisplay) traitsDisplay.textContent = `Traits: ${traits.length > 0 ? traits.join(', ') : 'None'}`;
        if (tempInventoryDisplay) tempInventoryDisplay.textContent = `Level Items: ${temporaryInventory.length > 0 ? temporaryInventory.join(', ') : 'None'}`;
        if (persistentInventoryDisplay) persistentInventoryDisplay.textContent = `Persistent Items: ${persistentInventory.length > 0 ? persistentInventory.join(', ') : 'None'}`;
        if (energyDisplay) energyDisplay.textContent = `Energy: ${energy}`; // Display energy
    }

    document.querySelectorAll('.hex-container').forEach(container => {
        container.addEventListener('click', () => {
            const clickedRow = parseInt(container.getAttribute('data-row'));
            const clickedCol = parseInt(container.getAttribute('data-col'));

            const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
            const isAdjacent = adjacentTiles.some(tile => tile.row === clickedRow && tile.col === clickedCol);
            const isBlocked = container.classList.contains('blocked');

            if (isAdjacent && !isBlocked) {
                const currentHex = document.querySelector(`.hex-container[data-row="${currentRow}"][data-col="${currentCol}"]`); // Fixed quotes
                currentHex.querySelector('.character').style.display = 'none';

                currentRow = clickedRow;
                currentCol = clickedCol;
                container.querySelector('.character').style.display = 'block';

                if (container.classList.contains('key')) {
                    temporaryInventory.push('key');
                    container.classList.remove('key');
                }
                if (container.classList.contains('energy')) {
                    energy += 5; // Increment energy
                    container.classList.remove('energy'); // Despawn energy tile
                    console.log('Collected Energy! Total:', energy);
                }

                turnCount++;
                updateUI();

                if (currentRow === rows - 1 && currentCol === cols - 1) {
                    const winScreen = document.getElementById('win-screen');
                    if (winScreen) {
                        const winMessage = temporaryInventory.includes('key') 
                            ? 'Victory! You reached the goal with the key—amazing!' 
                            : 'Victory! You reached the goal.';
                        winScreen.querySelector('p').textContent = winMessage;
                        winScreen.style.display = 'block';

                        xp += 10;
                        if (temporaryInventory.includes('key') && !traits.includes('Keymaster')) {
                            traits.push('Keymaster');
                        }
                        localStorage.setItem('playerProgress', JSON.stringify({ stats, traits, persistentInventory, xp, energy }));
                    }
                }
            }
        });
    });

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            const winScreen = document.getElementById('win-screen');
            if (winScreen) winScreen.style.display = 'none';

            document.querySelectorAll('.character').forEach(char => char.style.display = 'none');
            document.querySelectorAll('.blocked').forEach(block => block.classList.remove('blocked'));
            document.querySelectorAll('.key').forEach(key => key.classList.remove('key'));
            document.querySelectorAll('.energy').forEach(energyTile => energyTile.classList.remove('energy')); // Clear energy tiles

            currentRow = 0;
            currentCol = 0;
            temporaryInventory = [];
            const startingHex = document.querySelector('.hex-container[data-row="0"][data-col="0"]');
            if (startingHex) startingHex.querySelector('.character').style.display = 'block';

            turnCount = 0;
            updateUI();

            placeTiles(); // Re-place all tiles (blocks, key, energy)
        });
    }
});