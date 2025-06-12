// Obtener categorías y productos cuando la página se carga
document.addEventListener('DOMContentLoaded', () => {
  // Obtener categorías
  fetch('/api/products/categories')
    .then(response => response.json())
    .then(data => {
      const categorySelect = document.getElementById('category'); // Asegúrate de que el id sea 'category' en tu HTML
      data.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;  // Asumimos que 'id' es el identificador de la categoría
        option.textContent = category.category_name;  // Asegúrate de que 'category_name' es el campo correcto
        categorySelect.appendChild(option);
      });
    })
    .catch(error => console.error('Error al obtener categorías:', error));

  // Obtener productos y mostrarlos en la tabla
  fetch('/api/products/products')
    .then(response => response.json())
    .then(data => {
      renderTable(data);  // Usamos la función renderTable para renderizar los productos
    })
    .catch(error => console.error('Error al obtener productos:', error));
});

// Función para renderizar la tabla de productos
function renderTable(products) {
  const tbody = document.querySelector('#tblProducts tbody');
  tbody.innerHTML = '';  // Limpiar la tabla antes de agregar los nuevos productos
  products.forEach(product => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${product.name}</td>
      <td>${product.description}</td>
      <td>$${product.price.toFixed(2)}</td>
      <td>${product.stock}</td>
      <td>
        <button class="edit" data-id="${product.id}">✏️</button>
        <button class="del" data-id="${product.id}">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// Manejar la creación y edición de productos
const modal = document.getElementById('modal');
const form = document.getElementById('productForm');
const formTitle = document.getElementById('formTitle');
const btnAdd = document.getElementById('btnAdd');
const btnCancel = document.getElementById('btnCancel');
const closeBtn = document.getElementById('closeBtn');
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');
let currentImageData = "";

// Mostrar el modal para crear un nuevo producto
btnAdd.addEventListener('click', () => openModal());

// Función para abrir el modal
function openModal(edit = false, product = {}) {
  formTitle.textContent = edit ? 'Editar producto' : 'Nuevo producto';
  document.getElementById('prodId').value = product.id || '';
  document.getElementById('name').value = product.name || '';
  document.getElementById('description').value = product.description || '';
  document.getElementById('price').value = product.price || '';
  document.getElementById('stock').value = product.stock || '';

  // Limpiar el campo de categoría
  const categorySelect = document.getElementById('category');
  categorySelect.value = product.category || '';

  // Mostrar la imagen si existe
  if (product.image_url) {
    imagePreview.src = product.image_url;
    imagePreview.style.display = 'block';
    currentImageData = product.image_url;
  } else {
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    currentImageData = "";
  }

  imageInput.value = ''; // Limpiar el campo de la imagen
  modal.classList.remove('hidden');
}

// Cerrar el modal
function closeModal() {
  form.reset();
  imagePreview.src = '';
  imagePreview.style.display = 'none';
  currentImageData = "";
  modal.classList.add('hidden');
}

// Resetear el modal
function resetModal() {
  form.reset();
  imagePreview.src = '';
  imagePreview.style.display = 'none';
  currentImageData = "";
}

btnCancel.addEventListener('click', closeModal);
closeBtn.addEventListener('click', closeModal);

// Manejo de la imagen
imageInput.addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block';
      currentImageData = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    currentImageData = "";
  }
});

// Guardar producto
form.onsubmit = e => {
  e.preventDefault();
  const id = document.getElementById('prodId').value;
  const name = document.getElementById('name').value;
  const description = document.getElementById('description').value;
  const price = parseFloat(document.getElementById('price').value);
  const stock = parseInt(document.getElementById('stock').value, 10);
  const category = document.getElementById('category').value;
  const image = currentImageData; // Usar la imagen que se haya cargado

  const method = id ? 'PUT' : 'POST'; // Si tiene id, es edición, sino es creación
  const url = id ? `/api/products/edit-product/${id}` : '/api/products/add-product';

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('stock', stock);
  formData.append('category', category);
  formData.append('image', image); // Agregar la imagen

  // Enviar la solicitud al servidor
  fetch(url, {
    method: method,
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      // Si la respuesta es correcta, cerrar el modal y recargar la tabla
      closeModal();
      fetch('/api/products/products')
        .then(response => response.json())
        .then(data => renderTable(data))
        .catch(error => console.error('Error al obtener productos:', error));
    })
    .catch(error => console.error('Error al guardar el producto:', error));
};

// Eliminar producto
tbody.addEventListener('click', e => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains('edit')) {
    fetch(`/api/products/products/${id}`)
      .then(response => response.json())
      .then(data => openModal(true, data)) // Abrir el modal con los datos del producto
      .catch(error => console.error('Error al obtener producto para editar:', error));
  }

  if (e.target.classList.contains('del')) {
    if (confirm('¿Eliminar este producto?')) {
      fetch(`/api/products/products/${id}`, {
        method: 'DELETE',
      })
        .then(response => response.json())
        .then(() => {
          // Recargar la tabla después de eliminar el producto
          fetch('/api/products/products')
            .then(response => response.json())
            .then(data => renderTable(data))
            .catch(error => console.error('Error al obtener productos:', error));
        })
        .catch(error => console.error('Error al eliminar el producto:', error));
    }
  }
});

// Inicializar la tabla de productos
fetch('/api/products/products')
  .then(response => response.json())
  .then(data => renderTable(data))
  .catch(error => console.error('Error al obtener productos:', error));
