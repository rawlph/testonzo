document.addEventListener('DOMContentLoaded', () => {
    const hexContainers = document.querySelectorAll('.hex-container');
    let currentHex = 0; // Starting position
    let turnCount = 0;  // Initialize turn counter
    const turnDisplay = document.getElementById('turn-counter'); // Link to HTML element

    // Show character at starting position
    hexContainers[currentHex].querySelector('.character').style.display = 'block';

    // Handle clicks on hexagons
    hexContainers.forEach((container, index) => {
        container.addEventListener('click', () => {
            // If the hexagon is blocked, exit the function early.
            if (container.classList.contains('blocked')) return; // Skip if blocked

            // Move character: hide it on the current hex and show it on the clicked one
            hexContainers[currentHex].querySelector('.character').style.display = 'none';
            currentHex = index;
            hexContainers[currentHex].querySelector('.character').style.display = 'block';

            // Update turn counter
            turnCount++;
            turnDisplay.textContent = `Turns: ${turnCount}`;

            // Check win condition: if the new hex's row and column are (2,2), show win screen
            const newRow = parseInt(container.getAttribute('data-row'));
            const newCol = parseInt(container.getAttribute('data-col'));
            if (newRow === 2 && newCol === 2) {
                document.getElementById('win-screen').style.display = 'block';
            }
        });
    });

    // Restart button functionality
    document.getElementById('restart-btn').addEventListener('click', () => {
        document.getElementById('win-screen').style.display = 'none';
        hexContainers.forEach(container => {
            container.querySelector('.character').style.display = 'none';
        });
        currentHex = 0;
        hexContainers[currentHex].querySelector('.character').style.display = 'block';
        turnCount = 0; // Reset turn counter
        turnDisplay.textContent = `Turns: ${turnCount}`; // Update display
    });
});
