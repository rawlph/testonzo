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
        grid.appendChild(hexRow);
    }
});