document.addEventListener('DOMContentLoaded', () => {
    const cartIconCountElement = document.getElementById('cart-item-count');

    // Function to get cart from localStorage
    const getCart = () => JSON.parse(localStorage.getItem('cart')) || [];

    // Function to update the cart icon badge
    function updateCartIconBadge() {
        const cart = getCart();
        let totalQuantity = 0;
        cart.forEach(product => {
            totalQuantity += product.quantity;
        });

        if (cartIconCountElement) {
            cartIconCountElement.textContent = totalQuantity;
            if (totalQuantity > 0) {
                cartIconCountElement.style.display = 'block'; // Show badge if items exist
            } else {
                cartIconCountElement.style.display = 'none'; // Hide badge if no items
            }
        }
    }

    // Call the function on page load to set the initial count
    updateCartIconBadge();

    // Listen for a custom event to update the badge
    // This event will be dispatched by any script that modifies the cart
    window.addEventListener('cartUpdated', updateCartIconBadge);
});