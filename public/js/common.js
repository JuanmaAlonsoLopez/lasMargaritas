document.addEventListener('DOMContentLoaded', () => {
    // === Existing User Authentication Logic ===
    const userFromStorage = JSON.parse(localStorage.getItem('user'));
    const tokenFromStorage = localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromURL = urlParams.get('token');
    const userFromURL = urlParams.get('user');

    const accountLink = document.querySelector('a[href="#"] img[alt="Ingresar"]')?.parentElement;
    if (!accountLink) return;

    // Si el token está en la URL y el usuario también
    if (tokenFromURL && userFromURL) {
        const user = JSON.parse(decodeURIComponent(userFromURL));
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', tokenFromURL);
        showUserInfo(user);
    } else if (tokenFromStorage && userFromStorage) {
        showUserInfo(userFromStorage);
    } else {
        accountLink.innerHTML = `<img src="../images/logoBanner/account_circle_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg" alt="Ingresar">`;
        accountLink.style.cursor = 'pointer';
        accountLink.addEventListener('click', e => {
            e.preventDefault();
            localStorage.setItem('lastPage', window.location.pathname);
            window.location.href = '/login.html';
        });
    }

    function showUserInfo(user) {
        accountLink.innerHTML = `<span class="user-name">Hola, ${user.name}</span>`;
        accountLink.style.cursor = 'default';

        if (user.role === 1) {
            const adminButton = document.createElement('button');
            adminButton.textContent = 'Administrador';
            adminButton.className = 'admin-button';
            adminButton.style.marginLeft = '10px';
            adminButton.onclick = () => {
                window.location.href = '/pages/admin.html';
            };
            accountLink.appendChild(adminButton);
        }

        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Cerrar sesión';
        logoutBtn.className = 'account-link-logout';
        logoutBtn.style.marginLeft = '10px';
        logoutBtn.onclick = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            urlParams.delete('token');
            urlParams.delete('user');
            window.history.replaceState({}, document.title, window.location.pathname + '?' + urlParams.toString());
            location.reload();
        };
        accountLink.appendChild(logoutBtn);
    }

    // --- Cart Icon Update Logic (NOW GLOBAL) ---
    const cartIconCountElement = document.getElementById('cart-item-count');

    // Make getCart global if other scripts need direct access
    window.getCart = () => JSON.parse(localStorage.getItem('cart')) || [];

    // Make updateCartIconBadge global
    window.updateCartIconBadge = function() {
        const cart = window.getCart(); // Use the global getCart
        let totalQuantity = 0;
        cart.forEach(product => {
            totalQuantity += product.quantity;
        });

        if (cartIconCountElement) {
            cartIconCountElement.textContent = totalQuantity;
            if (totalQuantity > 0) {
                cartIconCountElement.style.display = 'block';
            } else {
                cartIconCountElement.style.display = 'none';
            }
        }
    };

    // Call the function on page load to set the initial count
    window.updateCartIconBadge();

    // Remove the custom event listener from common.js if it was here.
    // window.addEventListener('cartUpdated', updateCartIconBadge); // Remove this line
});

// If `saveCart` is defined in common.js and used globally, make it global here too
// This is important if `llamadoCarpetas.js` calls `saveCart` without redefining it.
window.saveCart = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
    window.updateCartIconBadge(); // Directly call the global update function
};