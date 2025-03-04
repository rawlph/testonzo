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

    // Add click handlers to each hexagon
    hexContainers.forEach((container, index) => {
        container.addEventListener('click', () => {
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