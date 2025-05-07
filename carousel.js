let currentIndex = 0;

function showCarouselItem(index) {
    const items = document.querySelectorAll('.producto');
    const totalItems = items.length;
    
    if (index >= totalItems) currentIndex = 0;  // Regresa al inicio cuando llega al final
    if (index < 0) currentIndex = totalItems - 1;  // Regresa al final si va hacia atrás

    const carousel = document.querySelector('.carousel');
    carousel.style.transform = `translateX(-${currentIndex * 33.33}%)`; // Cada producto ocupa un 33.33% del ancho
}

// Mostrar el tercer producto centrado al inicio
showCarouselItem(currentIndex);

document.querySelector('.prev').addEventListener('click', () => {
    currentIndex--;
    showCarouselItem(currentIndex);
});

document.querySelector('.next').addEventListener('click', () => {
    currentIndex++;
    showCarouselItem(currentIndex);
});

