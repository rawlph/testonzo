document.addEventListener('DOMContentLoaded', () => {
    const hexContainers = document.querySelectorAll('.hex-container');
    let currentHex = 0; // Start at the first hexagon (row 0, col 0)
    let turnCount = 0;

    // Show the character on the starting hexagon
    hexContainers[currentHex].querySelector('.character').style.display = 'block';

    // Create and append the turn counter display
    const turnDisplay = document.createElement('p');
    turnDisplay.textContent = `Turns: ${turnCount}`;
    document.body.appendChild(turnDisplay);

    // Add click handlers to move the character
    hexContainers.forEach((container, index) => {
        container.addEventListener('click', () => {
            // Hide character in current hexagon
            hexContainers[currentHex].querySelector('.character').style.display = 'none';

            // Move to the clicked hexagon
            currentHex = index;
            hexContainers[currentHex].querySelector('.character').style.display = 'block';

            // Increment turn counter and update display
            turnCount++;
            turnDisplay.textContent = `Turns: ${turnCount}`;

            // Get the new position from data attributes
            const newRow = parseInt(container.getAttribute('data-row'));
            const newCol = parseInt(container.getAttribute('data-col'));

            // Check for win condition (goal tile at row 2, col 2)
            if (newRow === 2 && newCol === 2) {
                alert('You Win!');
            }
        });
    });
});