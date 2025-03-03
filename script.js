document.addEventListener('DOMContentLoaded', () => {
    const hexContainers = document.querySelectorAll('.hex-container');
    let currentHex = 0; // Start at the first hex

    // Show the character on the starting hex
    hexContainers[currentHex].querySelector('.character').style.display = 'block';

    hexContainers.forEach((container, index) => {
        container.addEventListener('click', () => {
            // Hide the character in the current hex
            hexContainers[currentHex].querySelector('.character').style.display = 'none';
            // Move to the clicked hex and show the character
            currentHex = index;
            hexContainers[currentHex].querySelector('.character').style.display = 'block';
        });
    });
});