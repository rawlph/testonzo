document.addEventListener('DOMContentLoaded', () => {
    const hexContainers = document.querySelectorAll('.hex-container');
    let currentHex = 0; // Start on the first hexagon

    // Show the character on the starting hexagon
    hexContainers[currentHex].querySelector('.character').style.display = 'block';

    // Add click functionality to move the character
    hexContainers.forEach((container, index) => {
        container.addEventListener('click', () => {
            // Hide the character in the current hexagon
            hexContainers[currentHex].querySelector('.character').style.display = 'none';
            // Move to the clicked hexagon
            currentHex = index;
            hexContainers[currentHex].querySelector('.character').style.display = 'block';
        });
    });
});