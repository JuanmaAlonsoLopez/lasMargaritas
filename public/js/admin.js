document.addEventListener('DOMContentLoaded', () => {
  // --- AUTENTICACIÓN Y SEGURIDAD ---
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  if (!token || !user || user.role !== 1) {
    console.error('Acceso denegado. Se requiere ser administrador.');
    window.location.href = '/index.html';
    return;
  }

  // ===================================================================
  // REFERENCIAS AL DOM
  // ===================================================================
  // --- Productos ---
  const tblProducts = document.querySelector('#tblProducts tbody');
  const modalProduct = document.getElementById('modal');
  const productForm = document.getElementById('productForm');
  const btnAddProduct = document.getElementById('btnAdd');
  const formTitleProduct = document.getElementById('formTitle');
  const imagePreview = document.getElementById('imagePreview');
  const imageInput = document.getElementById('image');
  const categorySelect = document.getElementById('category');
  const closeModalBtnProduct = document.getElementById('closeBtn');
  const cancelBtnProduct = document.getElementById('btnCancel');

  // --- Usuarios ---
  const tblUsers = document.querySelector('#tblUsers tbody');
  const modalUser = document.getElementById('modalUser');
  const userForm = document.getElementById('userForm');
  // CORRECCIÓN: Apuntamos al nuevo ID del select de roles
  const userRoleSelect = document.getElementById('userRole'); 
  const closeModalBtnUser = document.getElementById('closeUser');
  const cancelBtnUser = document.getElementById('btnCancelUser');

  // ===================================================================
  // LÓGICA DE GESTIÓN DE PRODUCTOS (SIN CAMBIOS)
  // ===================================================================

  const loadProducts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('No se pudieron cargar los productos.');
      const products = await response.json();
      tblProducts.innerHTML = '';
      if (products.length === 0) {
        tblProducts.innerHTML = '<tr><td colspan="6">No hay productos para mostrar.</td></tr>';
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
        tblProducts.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      tblProducts.innerHTML = `<tr><td colspan="6">Error al cargar los datos. Revise la consola.</td></tr>`;
    }
  };

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

  const closeProductModal = () => {
    modalProduct.classList.add('hidden');
  };

  const openModalForCreateProduct = () => {
    productForm.reset(); // reset() limpia todo el formulario
    formTitleProduct.textContent = 'Nuevo Producto';
    imagePreview.style.display = 'none';
    document.getElementById('prodId').value = '';
    document.getElementById('image').required = true;
    modalProduct.classList.remove('hidden');
  };

  const populateFormForEditProduct = (product) => {
    productForm.reset();
    formTitleProduct.textContent = 'Editar Producto';
    document.getElementById('prodId').value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('description').value = product.description;
    document.getElementById('price').value = product.price;
    document.getElementById('stock').value = product.stock;
    document.getElementById('category').value = product.category;
    imagePreview.src = product.image_url;
    imagePreview.style.display = 'block';
    document.getElementById('image').required = false;
    modalProduct.classList.remove('hidden');
  };

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
        throw new Error((await response.json()).message || 'Error al guardar el producto.');
      }
      closeProductModal();
      loadProducts();
    } catch (error) {
      console.error('Error en el envío del formulario de producto:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // ===================================================================
  // LÓGICA DE GESTIÓN DE USUARIOS (CORREGIDA)
  // ===================================================================
  
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('No se pudieron cargar los usuarios.');
      const users = await response.json();
      tblUsers.innerHTML = '';
      users.forEach(u => {
        const row = document.createElement('tr');
        // CORRECCIÓN: Muestra role_name y guarda el data-role-id
        row.innerHTML = `
          <td>${u.email}</td>
          <td>${u.name}</td>
          <td>${u.role_name}</td>
          <td class="actions">
            <button class="btn-edit" data-id="${u.id}" data-role-id="${u.role}">Editar</button>
            <button class="btn-delete" data-id="${u.id}">Eliminar</button>
          </td>
        `;
        tblUsers.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      tblUsers.innerHTML = `<tr><td colspan="4">Error al cargar usuarios.</td></tr>`;
    }
  };

  // CORRECCIÓN: Carga roles desde el endpoint /api/users/roles
  const loadUserRoles = async () => {
    try {
        const response = await fetch('/api/users/roles', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('No se pudieron cargar los roles.');
        const roles = await response.json();
        userRoleSelect.innerHTML = '';
        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.role_name;
            userRoleSelect.appendChild(option);
        });
    } catch (error) {
        console.error(error);
    }
  };

  const closeUserModal = () => {
    modalUser.classList.add('hidden');
  };

  const populateUserFormForEdit = (user) => {
    userForm.reset();
    modalUser.querySelector('#userFormTitle').textContent = 'Editar Usuario';
    modalUser.querySelector('#userId').value = user.id;
    modalUser.querySelector('#userEmail').value = user.email;
    modalUser.querySelector('#userName').value = user.name;
    // CORRECCIÓN: Asigna el valor al select de roles
    userRoleSelect.value = user.role;
    modalUser.classList.remove('hidden');
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();
    const id = modalUser.querySelector('#userId').value;
    if (!id) return;
    // CORRECCIÓN: Envía el campo "role"
    const userData = {
      email: modalUser.querySelector('#userEmail').value,
      name: modalUser.querySelector('#userName').value,
      role: userRoleSelect.value,
    };
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(userData)
      });
      if (!response.ok) throw new Error((await response.json()).message);
      closeUserModal();
      loadUsers();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // ===================================================================
  // EVENT LISTENERS
  // ===================================================================
  
  // --- Para la tabla de PRODUCTOS ---
  tblProducts.addEventListener('click', async (event) => {
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
        populateFormForEditProduct(product);
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  });

  // --- Para la tabla de USUARIOS ---
  tblUsers.addEventListener('click', (event) => {
    const target = event.target;
    const id = target.dataset.id;
    if (target.classList.contains('btn-edit')) {
      const row = target.closest('tr');
      // CORRECCIÓN: Lee el data-role-id
      const user = {
          id: id,
          email: row.cells[0].textContent,
          name: row.cells[1].textContent,
          role: target.dataset.roleId
      };
      populateUserFormForEdit(user);
    }
    if (target.classList.contains('btn-delete')) {
      if (confirm(`¿Seguro que quieres eliminar al usuario con ID ${id}?`)) {
        fetch(`/api/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }})
        .then(res => {
          if(!res.ok) throw new Error('Error en la respuesta del servidor');
          target.closest('tr').remove();
        })
        .catch(err => alert('No se pudo eliminar el usuario.'));
      }
    }
  });

  // --- Para los formularios y modales ---
  btnAddProduct.addEventListener('click', openModalForCreateProduct);
  productForm.addEventListener('submit', handleProductSubmit);
  closeModalBtnProduct.addEventListener('click', closeProductModal);
  cancelBtnProduct.addEventListener('click', closeProductModal);

  userForm.addEventListener('submit', handleUserSubmit);
  closeModalBtnUser.addEventListener('click', closeUserModal);
  cancelBtnUser.addEventListener('click', closeUserModal);

  imageInput.addEventListener('change', event => {
    const file = event.target.files[0];
    if (file) {
      imagePreview.src = URL.createObjectURL(file);
      imagePreview.style.display = 'block';
    }
  });

  // ===================================================================
  // CARGA INICIAL DE DATOS
  // ===================================================================
  loadProducts();
  loadCategories();
  loadUsers();
  // CORRECCIÓN: Llama a la función que carga los roles
  loadUserRoles(); 
});