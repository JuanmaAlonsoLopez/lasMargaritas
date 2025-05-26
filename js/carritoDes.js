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

carritoIcon.addEventListener('click', () => {
  dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
  renderCart();
});

function renderCart() {
  cartItems.innerHTML = '';
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

function cambiarCantidad(index, delta) {
  productosCarrito[index].cantidad += delta;
  if (productosCarrito[index].cantidad < 1) {
    productosCarrito.splice(index, 1);
  }
  renderCart();
}

function eliminarItem(index) {
  productosCarrito.splice(index, 1);
  renderCart();
}