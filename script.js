document.addEventListener('DOMContentLoaded', () => {
    const hexContainers = document.querySelectorAll('.hex-container');
    let currentHex = 0; // Starting position (first tile)
    let turnCount = 0;  // Initialize turn counter

    // Show the character on the starting hexagon
    hexContainers[currentHex].querySelector('.character').style.display = 'block';

    // Get the turn counter display element
    const turnDisplay = document.getElementById('turn-counter');
    if (!turnDisplay) {
        console.error('Turn counter element not found. Please add <p id="turn-counter">Turns: 0</p> to your HTML.');
    }

   function getAdjacentTiles(row, col) {
    const adjacent = [];
    const isEvenRow = row % 2 === 0;

    let directions;
    if (isEvenRow) {
        // Even rows (0, 2): No shift
        directions = [
            [0, -1],  // Left
            [0, 1],   // Right
            [-1, -1], // Up-left
            [-1, 0],  // Up-right
            [1, -1],  // Down-left
            [1, 0]    // Down-right
        ];
    } else {
        // Odd rows (1): Shifted right
        directions = [
            [0, -1],  // Left
            [0, 1],   // Right
            [-1, -1], // Up-left
            [-1, 0],  // Up
            [1, 0],   // Down
            [1, 1]    // Down-right
        ];
    }

    directions.forEach(([dRow, dCol]) => {
        const newRow = row + dRow;
        const newCol = col + dCol;
        if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 3) {
            adjacent.push({ row: newRow, col: newCol });
        }
    });
    return adjacent;
}

    // Add click handlers to each hexagon
    hexContainers.forEach((container, index) => {
        container.addEventListener('click', () => {
            const clickedRow = parseInt(container.getAttribute('data-row'));
            const clickedCol = parseInt(container.getAttribute('data-col'));
            const currentRow = parseInt(hexContainers[currentHex].getAttribute('data-row'));
            const currentCol = parseInt(hexContainers[currentHex].getAttribute('data-col'));

            // Get all adjacent tiles to the current position
            const adjacentTiles = getAdjacentTiles(currentRow, currentCol);

            // Check if the clicked tile is adjacent
            const isAdjacent = adjacentTiles.some(tile => 
                tile.row === clickedRow && tile.col === clickedCol
            );

            // Allow move if tile is adjacent and not blocked
            if (isAdjacent && !container.classList.contains('blocked')) {
                // Hide the character on the current hexagon
                hexContainers[currentHex].querySelector('.character').style.display = 'none';

                // Move the character to the clicked hexagon
                currentHex = index;
                hexContainers[currentHex].querySelector('.character').style.display = 'block';

                // Increment the turn counter and update the display
                turnCount++;
                if (turnDisplay) {
                    turnDisplay.textContent = `Turns: ${turnCount}`;
                }

                // Check if the character has reached the goal (row 2, col 2)
                if (clickedRow === 2 && clickedCol === 2) {
                    const winScreen = document.getElementById('win-screen');
                    if (winScreen) {
                        winScreen.style.display = 'block';
                    } else {
                        console.error('Win screen element not found. Please add <div id="win-screen">...</div> to your HTML.');
                    }
                }
            }
        });
    });

    // Optional: Add restart functionality
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            const winScreen = document.getElementById('win-screen');
            if (winScreen) winScreen.style.display = 'none';
            hexContainers.forEach(container => {
                container.querySelector('.character').style.display = 'none';
            });
            currentHex = 0;
            hexContainers[currentHex].querySelector('.character').style.display = 'block';
            turnCount = 0;
            if (turnDisplay) turnDisplay.textContent = `Turns: ${turnCount}`;
        });
    }
});