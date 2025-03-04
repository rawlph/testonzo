document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const rows = 5;
    const cols = 5;
    const hexVisualWidth = 86.6;
    const hexHeight = 100;
    const offsetX = hexVisualWidth * 0.75;

    for (let row = 0; row < rows; row++) {
        const hexRow = document.createElement('div');
        hexRow.classList.add('hex-row');
        hexRow.style.top = `${row * (hexHeight * 0.75)}px`;

        for (let col = 0; col < cols; col++) {
            const hexContainer = document.createElement('div');
            hexContainer.classList.add('hex-container');
            hexContainer.setAttribute('data-row', row);
            hexContainer.setAttribute('data-col', col);

            const isOddRow = row % 2 === 1;
            const offset = isOddRow ? offsetX / 2 : 0;
            hexContainer.style.left = `${col * offsetX + offset}px`;

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

            hexRow.appendChild(hexContainer);
        }
        grid.appendChild(hexRow);
    }
});