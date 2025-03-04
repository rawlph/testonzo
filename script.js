document.addEventListener('DOMContentLoaded', () => {
    const hexContainers = document.querySelectorAll('.hex-container');
    let currentHex = 0; // Starting position (first tile)
    let turnCount = 0;  // Track the number of moves
    let hasKey = false; // Track if the player has collected the key

    // Show the character on the starting hexagon
    hexContainers[currentHex].querySelector('.character').style.display = 'block';

    // Get the turn counter display element
    const turnDisplay = document.getElementById('turn-counter');
    if (!turnDisplay) {
        console.error('Turn counter element not found. Please add <p id="turn-counter">Turns: 0</p> to your HTML.');
    }

    // Function to find adjacent tiles
   function getAdjacentTiles(row, col) {
        const adjacent = [];
        const isEvenRow = row % 2 === 0;

        let directions;
        if (isEvenRow) {
            // Even rows (0, 2): No shift
            directions = [
                [0, -1],  // West (Left)
                [0, 1],   // East (Right)
                [-1, -1], // North-west (Up-left)
                [-1, 0],  // North-east (Up-right)
                [1, -1],  // South-west (Down-left)
                [1, 0]    // South-east (Down-right)
            ];
        } else {
            // Odd rows (1): Shifted right
            directions = [
                [0, -1],  // West (Left)
                [0, 1],   // East (Right)
                [-1, 0],  // North-west (Up-left)
                [-1, 1],  // North-east (Up-right)
                [1, 0],   // South-west (Down)
                [1, 1]    // South-east (Down-right)
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

            // Check if the clicked tile is adjacent
            const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
            const isAdjacent = adjacentTiles.some(tile => 
                tile.row === clickedRow && tile.col === clickedCol
            );

            // Move the character if the tile is adjacent and not blocked
            if (isAdjacent && !container.classList.contains('blocked')) {
                // Hide the character on the current tile
                hexContainers[currentHex].querySelector('.character').style.display = 'none';

                // Move to the clicked tile
                currentHex = index;
                hexContainers[currentHex].querySelector('.character').style.display = 'block';

                // Update turn count
                turnCount++;
                if (turnDisplay) {
                    turnDisplay.textContent = `Turns: ${turnCount}`;
                }

                // Check if the player collected the key (row 0, col 2)
                if (clickedRow === 0 && clickedCol === 2 && !hasKey) {
                    hasKey = true;
                    container.classList.remove('key'); // Remove gold styling
                }

                // Check if the player reached the goal (row 2, col 2)
                if (clickedRow === 2 && clickedCol === 2) {
                    const winScreen = document.getElementById('win-screen');
                    if (winScreen) {
                        // Show different messages based on whether the key was collected
                        const message = hasKey ? 'You finished with the key, congrats!' : 'You won!';
                        winScreen.querySelector('p').textContent = message;
                        winScreen.style.display = 'block';
						console.log('Key collected!');
                    } else {
                        console.error('Win screen not found. Add <div id="win-screen"><p></p><button id="restart-btn">Restart</button></div> to your HTML.');
                    }
                }
            }
        });
    });

    // Restart button functionality
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            const winScreen = document.getElementById('win-screen');
            if (winScreen) winScreen.style.display = 'none';

            // Reset all characters and re-add the key
            hexContainers.forEach(container => {
                container.querySelector('.character').style.display = 'none';
                if (container.getAttribute('data-row') === '0' && container.getAttribute('data-col') === '2') {
                    container.classList.add('key'); // Put the key back
                }
            });

            // Reset game state
            currentHex = 0;
            hexContainers[currentHex].querySelector('.character').style.display = 'block';
            turnCount = 0;
            hasKey = false; // Reset key status
            if (turnDisplay) turnDisplay.textContent = `Turns: ${turnCount}`;
        });
    }
});