document.addEventListener('DOMContentLoaded', () => {
    const hexContainers = document.querySelectorAll('.hex-container');
    let currentHex = 0;

    hexContainers[currentHex].querySelector('.character').style.display = 'block';

    hexContainers.forEach((container, index) => {
        container.addEventListener('click', () => {
            hexContainers[currentHex].querySelector('.character').style.display = 'none';
            currentHex = index;
            hexContainers[currentHex].querySelector('.character').style.display = 'block';
        });
    });
});