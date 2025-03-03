document.addEventListener('DOMContentLoaded', () => {
    const hexes = document.querySelectorAll('.hex');
    let currentHex = 0; // Start at the first hex

    // Place the character in the first hex
    hexes[currentHex].innerHTML = '<div class="character"></div>';

    hexes.forEach((hex, index) => {
        hex.addEventListener('click', () => {
            // Remove character from current hex
            hexes[currentHex].innerHTML = '';
            // Move to clicked hex
            currentHex = index;
            hexes[currentHex].innerHTML = '<div class="character"></div>';
        });
    });
});