// Simulación de productos
const productosCarrito = [
  {
    id: 1,
    nombre: "Producto 001",
    imagen: "../images/fotosProductos/Manantial-Photoroom.png",
    cantidad: 1,
    precio: 12000
  }
];

const iconos = document.querySelectorAll('.icons a');
const carritoIcon = iconos[1];
const dropdown = document.getElementById('cartDropdown');
const cartItems = document.getElementById('cartItems');
const blurBg = document.getElementById('cart-blur-bg');

// Mostrar/ocultar el carrito y el blur
carritoIcon.addEventListener('click', (e) => {
  e.preventDefault();
  const isOpen = dropdown.style.display === 'flex';
  if (!isOpen) {
    dropdown.style.display = 'flex';
    blurBg.classList.remove('hidden');
    renderCart();
  } else {
    dropdown.style.display = 'none';
    blurBg.classList.add('hidden');
  }
});

// Cerrar el carrito al hacer click en el blur
blurBg.addEventListener('click', function() {
  dropdown.style.display = 'none';
  blurBg.classList.add('hidden');
});

function renderCart() {
  cartItems.innerHTML = '';
  if (productosCarrito.length === 0) {
    cartItems.innerHTML = `<div class="cart-empty">Tu carrito está vacío.</div>`;
    return;
  }
  productosCarrito.forEach((producto, index) => {
    const item = document.createElement('div');
    item.classList.add('cart-item');
    item.innerHTML = `
      <img src="${producto.imagen}" alt="${producto.nombre}">
      <div class="cart-item-info">
        <p>${producto.nombre}</p>
        <div class="quantity-controls">
          <button onclick="cambiarCantidad(${index}, -1)">-</button>
          <span>${producto.cantidad}</span>
          <button onclick="cambiarCantidad(${index}, 1)">+</button>
        </div>
      </div>
      <div class="cart-price">$${producto.precio * producto.cantidad}</div>
      <div class="remove-item" onclick="eliminarItem(${index})">&#128465;</div>
    `;
    cartItems.appendChild(item);
  });
}

// Estas funciones deben estar en window para que funcionen los onclick del HTML generado
window.cambiarCantidad = function(index, delta) {
  productosCarrito[index].cantidad += delta;
  if (productosCarrito[index].cantidad < 1) {
    productosCarrito.splice(index, 1);
  }
  renderCart();
};

window.eliminarItem = function(index) {
  productosCarrito.splice(index, 1);
  renderCart();
};

// Cerrar con la X
document.getElementById('cartCloseBtn').onclick = function() {
  document.getElementById('cartDropdown').style.display = 'none';
  document.getElementById('cart-blur-bg').classList.add('hidden');
};