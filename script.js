document.addEventListener('DOMContentLoaded', () => {
    // Grab the grid container from HTML
    const grid = document.querySelector('.grid');

    // Define grid size (easy to change later!)
    const rows = 3;
    const cols = 3;

    // Hexagon dimensions (adjust these to scale the grid)
    const hexWidth = 100; // Width of each hexagon
    const hexHeight = 115.47; // Height based on a regular hexagon (sqrt(3)/2 * width)
    const offsetX = hexWidth * 0.75; // Horizontal spacing between hexagons

    // Generate the grid
    for (let row = 0; row < rows; row++) {
        // Create a row container
        const hexRow = document.createElement('div');
        hexRow.classList.add('hex-row');
        hexRow.style.top = `${row * (hexHeight * 0.75)}px`; // Vertical spacing for rows

        for (let col = 0; col < cols; col++) {
            // Create a hexagon container
            const hexContainer = document.createElement('div');
            hexContainer.classList.add('hex-container');
            hexContainer.setAttribute('data-row', row); // Store row index
            hexContainer.setAttribute('data-col', col); // Store column index

            // Position the hexagon (offset odd rows)
            const isOddRow = row % 2 === 1;
            const offset = isOddRow ? offsetX / 2 : 0;
            hexContainer.style.left = `${col * offsetX + offset}px`;

            // Create an SVG hexagon
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', hexWidth);
            svg.setAttribute('height', hexHeight);
            svg.setAttribute('viewBox', '0 0 100 115.47');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M50 0 L93.3 28.87 L93.3 86.6 L50 115.47 L6.7 86.6 L6.7 28.87 Z');
            svg.appendChild(path);
            hexContainer.appendChild(svg);

            // Add a placeholder for a character (hidden by default)
            const character = document.createElement('div');
            character.classList.add('character');
            hexContainer.appendChild(character);

            // Add the hexagon to the row
            hexRow.appendChild(hexContainer);
        }

        // Add the row to the grid
        grid.appendChild(hexRow);
    }

    // Grid is ready! Add game logic (e.g., movement) here later
});