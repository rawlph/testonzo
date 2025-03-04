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

	// Function to get adjacent tiles
	function getAdjacentTiles(row, col) {
		const adjacent = [];
		const directions = [
			[0, -1],  // Left
			[0, 1],   // Right
			[-1, -1], // Up-left
			[-1, 0],  // Up
			[1, -1],  // Down-left
			[1, 0]    // Down
		];
    
    directions.forEach(([dRow, dCol]) => {
        const newRow = row + dRow;
        const newCol = col + dCol;
        // Check if the new position is within the 3x3 grid
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
            // Update character position
            hexContainers[currentHex].querySelector('.character').style.display = 'none';
            currentHex = index;
            hexContainers[currentHex].querySelector('.character').style.display = 'block';

			
            // If the hexagon is blocked, do nothing
            if (container.classList.contains('blocked')) return;

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

            // Get the new position from data attributes
            const newRow = parseInt(container.getAttribute('data-row'));
            const newCol = parseInt(container.getAttribute('data-col'));

            // Check if the character has reached the goal (row 2, col 2)
            if (newRow === 2 && newCol === 2) {
                const winScreen = document.getElementById('win-screen');
                if (winScreen) {
                    winScreen.style.display = 'block';
                } else {
                    console.error('Win screen element not found. Please add <div id="win-screen">...</div> to your HTML.');
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