document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const rows = 7;
    const cols = 7;
    const hexVisualWidth = 86.6; // Width of the hexagon (point-to-point)
    const hexHeight = 100;       // Height of the hexagon (flat-to-flat)
    const rowOffset = hexHeight * 0.75; // Vertical spacing between rows
    const colOffset = hexVisualWidth;   // Horizontal spacing between columns

    // Calculate total grid dimensions
    const totalWidth = (cols - 1) * colOffset + hexVisualWidth; // Full width including all hexagons
    const totalHeight = (rows - 1) * rowOffset + hexHeight;     // Full height including all rows

    // Set grid size for centering
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

            // Calculate horizontal position
            const isOddRow = row % 2 === 1;
            const rowShift = isOddRow ? hexVisualWidth / 2 : 0; // 43.3px for odd rows
            const hexLeft = col * colOffset + rowShift;

            hexContainer.style.position = 'absolute';
            hexContainer.style.left = `${hexLeft}px`;
            hexContainer.style.top = '0'; // Relative to the row

            // Create SVG hexagon
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', hexVisualWidth);
            svg.setAttribute('height', hexHeight);
            svg.setAttribute('viewBox', '0 0 86.6 100');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M43.3 0 L86.6 25 L86.6 75 L43.3 100 L0 75 L0 25 Z');
            svg.appendChild(path);
            hexContainer.appendChild(svg);

            // Add character placeholder
            const character = document.createElement('div');
            character.classList.add('character');
            hexContainer.appendChild(character);

            hexRow.appendChild(hexContainer);
        }
		if (row === rows - 1 && col === cols - 1) { // Assuming 'rows' and 'cols' are defined (e.g., 7)
		hexContainer.classList.add('goal');
	}
        grid.appendChild(hexRow);
    }
	// Spawn the character at (0,0)
	const startingHex = document.querySelector('.hex-container[data-row="0"][data-col="0"]');
		if (startingHex) {
			startingHex.querySelector('.character').style.display = 'block';
			} else {
			console.error('Starting hexagon not found. Check your grid generation.');
			
			let turnCount = 0;
			const turnDisplay = document.getElementById('turn-counter');
			turnDisplay.textContent = `Turns: ${turnCount}`;
			
			// Track the character's position
let currentRow = 0;
let currentCol = 0;

// Function to find adjacent tiles (simplified for a hex grid)
function getAdjacentTiles(row, col) {
    const adjacent = [];
    const directions = [
        [0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]
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

// Add click listeners to all hexagons
document.querySelectorAll('.hex-container').forEach(container => {
    container.addEventListener('click', () => {
        const clickedRow = parseInt(container.getAttribute('data-row'));
        const clickedCol = parseInt(container.getAttribute('data-col'));

        // Check if the clicked tile is adjacent
        const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
        const isAdjacent = adjacentTiles.some(tile => tile.row === clickedRow && tile.col === clickedCol);

        if (isAdjacent) {
            // Hide the character at the current position
            const currentHex = document.querySelector(`.hex-container[data-row="${currentRow}"][data-col="${currentCol}"]`);
            currentHex.querySelector('.character').style.display = 'none';

            // Move to the new position
            currentRow = clickedRow;
            currentCol = clickedCol;
            container.querySelector('.character').style.display = 'block';

            // Update turn counter
            turnCount++;
            turnDisplay.textContent = `Turns: ${turnCount}`;

            // Check for victory
            if (currentRow === rows - 1 && currentCol === cols - 1) {
                document.getElementById('win-screen').style.display = 'block';
            }
        }
    });
});

			// Restart button functionality
			document.getElementById('restart-btn').addEventListener('click', () => {
			document.getElementById('win-screen').style.display = 'none';
			document.querySelectorAll('.character').forEach(char => char.style.display = 'none');
			currentRow = 0;
			currentCol = 0;
			document.querySelector('.hex-container[data-row="0"][data-col="0"] .character').style.display = 'block';
			turnCount = 0;
			turnDisplay.textContent = `Turns: ${turnCount}`;
});
}
});