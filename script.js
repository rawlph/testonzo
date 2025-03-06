let isGameActive = true; // Tracks if the game is active or finished

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
        traits: [],
        persistentInventory: [],
        xp: 0,
        sensedTypes: [],
        sensesMade: 0,
        pokesMade: 0,
        hasFoundZoe: false,
        zoeLevelsCompleted: 0,
        uniquesensedTypes: []
    };
    let { stats, traits, persistentInventory, xp, sensedTypes, sensesMade, pokesMade, hasFoundZoe, zoeLevelsCompleted, uniquesensedTypes } = playerProgress;
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
    function updateVision(tileData) {
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
        movementPoints = 1;
        turnCount++;
        updateUI();
        highlightTiles(null);
        console.log(`Turn ${turnCount} ended. MP reset to ${movementPoints}.`);
    }

    function rest() {
        if (!isGameActive) {
            console.log("Level complete—cannot rest!");
            return;
        }
        const confirmRest = confirm("This ends the turn and lets you rest for 10 energy points. Are you sure?");
        if (confirmRest) {
            energy += 10;
            movementPoints = 0;
            endTurn();
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
        const tileData = createTileData(rows, cols);
        placeTiles(tileData, rows, cols);
        buildGrid(rows, cols, tileData);

        document.querySelectorAll('.character').forEach(char => char.style.display = 'none');
        const startingHex = document.querySelector('.hex-container[data-row="0"][data-col="0"]');
        if (startingHex) startingHex.querySelector('.character').style.display = 'block';

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
        updateVision(tileData);
        updateUI();
        isGameActive = true; // Reset game state
        document.getElementById('stats-window').style.display = 'none'; // Hide any previous stats window
    }

    document.querySelectorAll('.hex-container').forEach(container => {
        container.addEventListener('click', () => {
            if (!isGameActive) {
                console.log("Level complete or lost—check your stats!");
                return;
            }

            const clickedRow = parseInt(container.getAttribute('data-row'));
            const clickedCol = parseInt(container.getAttribute('data-col'));
            const tile = tileData[clickedRow][clickedCol];
            const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
            const isAdjacent = adjacentTiles.some(t => t.row === clickedRow && t.col === clickedCol);
            const isCurrentTile = (clickedRow === currentRow && clickedCol === currentCol);

            if (currentAction === 'move' && isAdjacent && tile.type !== 'blocked' && tile.type !== 'water') {
                if (movementPoints < 1) {
                    const feedbackMessage = document.getElementById('feedback-message');
                    feedbackMessage.textContent = "No movement points left!";
                    feedbackMessage.style.display = 'block';
                    setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
                    return;
                }
                if (energy <= 0) {
                    showLoseScreen();
                    return;
                }
                moveCounter++;
                const currentHex = document.querySelector(`.hex-container[data-row="${currentRow}"][data-col="${currentCol}"]`);
                currentHex.querySelector('.character').style.display = 'none';
                currentRow = clickedRow;
                currentCol = clickedCol;
                container.querySelector('.character').style.display = 'block';

                if (!traits.includes('pathfinder') || moveCounter % 2 === 0) {
                    energy -= 1;
                }
                movementPoints -= 1;

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
                    let energyGain = 5;
                    if (traits.includes('explorer')) energyGain += 1;
                    energy += energyGain;
                    tile.type = 'normal';
                    container.classList.remove('energy');
                }

                updateVision(tileData);
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
                energy -= energyCost;
                playerProgress.sensedTypes.push(tile.type);
                playerProgress.sensesMade++;
                currentLevelSenses++;
                if (!uniquesensedTypes.includes(tile.type)) {
                    uniquesensedTypes.push(tile.type);
                }
                const feedbackMessage = document.getElementById('feedback-message');
                feedbackMessage.textContent = `Sensed a ${tile.type} tile!`;
                feedbackMessage.style.display = 'block';
                if (traits.includes('senser') && !hasUsedsenserBonus && !isCurrentTile) {
                    hasUsedsenserBonus = true;
                    const adjacent = getAdjacentTiles(currentRow, currentCol);
                    const randomAdj = adjacent[Math.floor(Math.random() * adjacent.length)];
                    const adjTile = tileData[randomAdj.row][randomAdj.col];
                    playerProgress.sensedTypes.push(adjTile.type);
                    if (!uniquesensedTypes.includes(adjTile.type)) {
                        uniquesensedTypes.push(adjTile.type);
                    }
                    currentLevelSenses++;
                    feedbackMessage.textContent += ` Bonus: Sensed an adjacent ${adjTile.type} tile for free!`;
                }
                setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
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
                playerProgress.pokesMade++;
                const feedbackMessage = document.getElementById('feedback-message');
                feedbackMessage.textContent = `Poked and revealed a ${tile.type} tile!`;
                feedbackMessage.style.display = 'block';
                setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
                updateUI();

                if (energy <= 0) {
                    showLoseScreen();
                    return;
                }
            } else {
                const feedbackMessage = document.getElementById('feedback-message');
                feedbackMessage.textContent = currentAction === 'move' ? 
                    "You can only move to adjacent, non-blocked tiles!" : 
                    "You can only sense or poke adjacent tiles or your current tile!";
                feedbackMessage.style.display = 'block';
                setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
            }

            // Victory condition
            if (currentRow === rows - 1 && currentCol === cols - 1) {
                if (!playerProgress.hasFoundZoe && !temporaryInventory.includes('zoe')) {
                    const feedbackMessage = document.getElementById('feedback-message');
                    feedbackMessage.textContent = "You need Zoe to proceed!";
                    feedbackMessage.style.display = 'block';
                    setTimeout(() => { feedbackMessage.style.display = 'none'; }, 3000);
                } else if (energy > 0) { // Win condition: reached goal with energy remaining
                    const gridSize = Math.min(rows, cols);
                    const pathfinderTurnLimit = gridSize * 2;

                    if (currentLevelSenses >= 10 && !traits.includes('senser')) {
                        traits.push('senser');
                    }
                    if (turnCount < pathfinderTurnLimit && !traits.includes('pathfinder')) {
                        traits.push('pathfinder');
                    }
                    if (uniquesensedTypes.length >= 5 && !traits.includes('explorer')) {
                        traits.push('explorer');
                    }

                    let xpGain = 10 + energy; // Bonus XP for remaining energy
                    if (!playerProgress.hasFoundZoe && temporaryInventory.includes('zoe')) {
                        playerProgress.hasFoundZoe = true;
                        playerProgress.zoeLevelsCompleted = 1;
                        if (!traits.includes('zoeInitiate')) {
                            traits.push('zoeInitiate');
                        }
                    } else if (playerProgress.hasFoundZoe) {
                        playerProgress.zoeLevelsCompleted += 1;
                        if (playerProgress.zoeLevelsCompleted === 4 && !traits.includes('zoeAdept')) {
                            traits.push('zoeAdept');
                        } else if (playerProgress.zoeLevelsCompleted === 7 && !traits.includes('zoeMaster')) {
                            traits.push('zoeMaster');
                        }
                    }
                    if (temporaryInventory.includes('key') && !traits.includes('Keymaster')) {
                        traits.push('Keymaster');
                        xpGain += 5;
                    }
                    playerProgress.xp += xpGain;
                    xp = playerProgress.xp;
                    playerProgress.traits = traits;
                    playerProgress.uniquesensedTypes = uniquesensedTypes;
                    localStorage.setItem('playerProgress', JSON.stringify(playerProgress));

                    updateUI();

                    const statsWindow = document.getElementById('stats-window');
                    if (statsWindow) {
                        const typeCounts = {};
                        playerProgress.sensedTypes.forEach(type => {
                            typeCounts[type] = (typeCounts[type] || 0) + 1;
                        });
                        const sensedTypesText = Object.entries(typeCounts)
                            .map(([type, count]) => `${type}: ${count}`)
                            .join(', ');
                        statsWindow.innerHTML = `
                            <h2>Level Complete!</h2>
                            <p>Turns: ${turnCount}</p>
                            <p>Energy Remaining: ${energy}</p>
                            <p>Senses Made: ${playerProgress.sensesMade}</p>
                            <p>Pokes Made: ${playerProgress.pokesMade}</p>
                            <p>Sensed Types: ${sensedTypesText || 'None'}</p>
                            <button id="next-level-btn">Next Level</button>
                        `;
                        statsWindow.style.display = 'block';
                    }
                    isGameActive = false;
                }
            }
        });
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

    // Next Level button (moved to dynamic creation in victory condition)
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
                traits: [],
                persistentInventory: [],
                xp: 0,
                sensedTypes: [],
                sensesMade: 0,
                pokesMade: 0,
                hasFoundZoe: false,
                zoeLevelsCompleted: 0,
                uniquesensedTypes: []
            };
            ({ stats, traits, persistentInventory, xp, sensedTypes, sensesMade, pokesMade, hasFoundZoe, zoeLevelsCompleted, uniquesensedTypes } = playerProgress);
            startGame();
        });
    }
});