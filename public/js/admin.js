document.addEventListener('DOMContentLoaded', () => {
  // --- AUTENTICACIÓN Y SEGURIDAD ---
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  if (!token || !user || user.role !== 1) {
    console.error('Acceso denegado. Se requiere ser administrador.');
    window.location.href = '/index.html';
    return;
  }

  // --- REFERENCIAS A ELEMENTOS DEL DOM ---
  const tableBody = document.querySelector('#tblProducts tbody');
  const btnAdd = document.getElementById('btnAdd');
  const modal = document.getElementById('modal');
  const closeModalBtn = document.getElementById('closeBtn');
  const cancelBtn = document.getElementById('btnCancel');
  const productForm = document.getElementById('productForm');
  const formTitle = document.getElementById('formTitle');
  const imagePreview = document.getElementById('imagePreview');
  const imageInput = document.getElementById('image');
  const categorySelect = document.getElementById('category');

  // --- FUNCIÓN PARA CARGAR Y MOSTRAR PRODUCTOS ---
  const loadProducts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('No se pudieron cargar los productos.');
      }
      const products = await response.json();
      tableBody.innerHTML = ''; // Limpiar tabla

      if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No hay productos para mostrar.</td></tr>';
        return;
      }

      products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${product.name}</td>
          <td>${product.description}</td>
          <td>$${parseFloat(product.price).toFixed(2)}</td>
          <td>${product.stock}</td>
          <td>${product.category_name}</td>
          <td class="actions">
            <button class="btn-edit" data-id="${product.id}">Editar</button>
            <button class="btn-delete" data-id="${product.id}">Eliminar</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      tableBody.innerHTML = `<tr><td colspan="6">Error al cargar los datos. Revise la consola.</td></tr>`;
    }
  };

  // --- FUNCIÓN PARA CARGAR CATEGORÍAS EN EL SELECT ---
  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/products/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('No se pudieron cargar las categorías.');

      const categories = await response.json();
      categorySelect.innerHTML = '<option value="">Seleccione una categoría...</option>';
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.category_name;
        categorySelect.appendChild(option);
      });
    } catch (error) {
      console.error(error);
      categorySelect.innerHTML = '<option value="">Error al cargar categorías</option>';
    }
  };
  
  // --- FUNCIONES PARA MANEJAR EL MODAL (CREAR Y EDITAR) ---
  const closeModal = () => {
    modal.classList.add('hidden');
  };
  
  const openModalForCreate = () => {
    formTitle.textContent = 'Nuevo Producto';
    productForm.reset();
    imagePreview.style.display = 'none';
    document.getElementById('prodId').value = '';
    document.getElementById('image').required = true;
    modal.classList.remove('hidden');
  };

  const populateFormForEdit = (product) => {
    formTitle.textContent = 'Editar Producto';
    document.getElementById('prodId').value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('description').value = product.description;
    document.getElementById('price').value = product.price;
    document.getElementById('stock').value = product.stock;
    document.getElementById('category').value = product.category;
    imagePreview.src = product.image_url;
    imagePreview.style.display = 'block';
    document.getElementById('image').required = false;
    modal.classList.remove('hidden');
  };

  // --- FUNCIÓN DE ENVÍO DEL FORMULARIO (PARA CREAR Y EDITAR) ---
  const handleProductSubmit = async (event) => {
    event.preventDefault();
    const id = document.getElementById('prodId').value;
    const isEditing = !!id;
    const formData = new FormData(productForm);
    const url = isEditing ? `http://localhost:3000/api/products/${id}` : 'http://localhost:3000/api/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el producto.');
      }
      closeModal();
      loadProducts(); // Recargar productos tras el éxito
    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // --- EVENT LISTENERS ---

  // 1. Para los botones de la tabla (Editar y Eliminar)
  tableBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.classList.contains('btn-delete')) {
      const id = target.dataset.id;
      if (confirm(`¿Estás seguro de que quieres eliminar el producto con ID ${id}?`)) {
        try {
          const response = await fetch(`http://localhost:3000/api/products/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error((await response.json()).message);
          target.closest('tr').remove();
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
    }
    if (target.classList.contains('btn-edit')) {
      const id = target.dataset.id;
      try {
        const response = await fetch(`http://localhost:3000/api/products/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('No se pudieron obtener los datos del producto.');
        const product = await response.json();
        populateFormForEdit(product);
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  });

  // 2. Para los botones y formularios principales
  btnAdd.addEventListener('click', openModalForCreate);
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  productForm.addEventListener('submit', handleProductSubmit);

  // 3. Para la vista previa de la imagen
  imageInput.addEventListener('change', event => {
    const file = event.target.files[0];
    if (file) {
      imagePreview.src = URL.createObjectURL(file);
      imagePreview.style.display = 'block';
    }
  });

  // --- CARGA INICIAL DE DATOS ---
  loadProducts();
  loadCategories();
});