// Helpers localStorage
const STORAGE_KEY = 'admin_products';
const USER_KEY    = 'admin_users';

function getProducts() {
  const j = localStorage.getItem(STORAGE_KEY);
  return j ? JSON.parse(j) : [];
}
function saveProducts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function getUsers() {
  const j = localStorage.getItem(USER_KEY);
  return j ? JSON.parse(j) : [];
}
function saveUsers(list) {
  localStorage.setItem(USER_KEY, JSON.stringify(list));
}

// Navegación interna
document.querySelectorAll('.admin-nav button')
  .forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('main > section')
        .forEach(sec =>
          sec.id === btn.dataset.target
            ? sec.classList.remove('hidden')
            : sec.classList.add('hidden')
        );
    })
);

// — CRUD Productos —
const modal      = document.getElementById('modal');
const form       = document.getElementById('productForm');
const formTitle  = document.getElementById('formTitle');
const btnAdd     = document.getElementById('btnAdd');
const btnCancel  = document.getElementById('btnCancel');
const closeBtn   = document.getElementById('closeBtn');
const tbody      = document.querySelector('#tblProducts tbody');

// ...existing code...

function renderTable() {
  const prods = getProducts();
  tbody.innerHTML = '';
  prods.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.description}</td>
      <td>$ ${p.price.toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>
        <button class="edit" data-id="${p.id}">✏️</button>
        <button class="del"  data-id="${p.id}">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// --- NUEVO: Manejo de imagen ---
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');
let currentImageData = "";

imageInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
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


function openModal(edit = false, p = {}) {
  formTitle.textContent = edit ? 'Editar producto' : 'Nuevo producto';
  document.getElementById('prodId').value      = p.id || '';
  document.getElementById('name').value        = p.name || '';
  document.getElementById('description').value = p.description || '';
  document.getElementById('price').value       = p.price || '';
  document.getElementById('stock').value       = p.stock || '';
  // --- NUEVO: Imagen ---
  if (p.image) {
    imagePreview.src = p.image;
    imagePreview.style.display = 'block';
    currentImageData = p.image;
  } else {
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    currentImageData = "";
  }
  imageInput.value = '';
  modal.classList.remove('hidden');
}

function closeModal() {
  form.reset();
  imagePreview.src = '';
  imagePreview.style.display = 'none';
  currentImageData = "";
  modal.classList.add('hidden');
}

function resetModal() {
  form.reset();
  imagePreview.src = '';
  imagePreview.style.display = 'none';
  currentImageData = "";
}

btnAdd.addEventListener('click', () => openModal());
closeBtn.addEventListener('click', () => closeModal());
resetBtn.addEventListener('click', () => resetModal());
btnCancel.addEventListener('click', () => closeModal());


form.onsubmit = e => {
  e.preventDefault();
  const id          = document.getElementById('prodId').value;
  const name        = document.getElementById('name').value;
  const description = document.getElementById('description').value;
  const price       = parseFloat(document.getElementById('price').value);
  const stock       = parseInt(document.getElementById('stock').value, 10);
  const image       = currentImageData; // NUEVO
  let prods = getProducts();
  if (!id) {
    prods.push({ id: Date.now().toString(), name, description, price, stock, image });
  } else {
    prods = prods.map(x => x.id === id ? { id, name, description, price, stock, image } : x);
  }
  saveProducts(prods);
  renderTable();
  closeModal();
};

// ...existing code...

tbody.addEventListener('click', e => {
  const id = e.target.dataset.id;
  if (!id) return;
  let prods = getProducts();
  if (e.target.classList.contains('edit')) {
    openModal(true, prods.find(x => x.id === id));
  }
  if (e.target.classList.contains('del')) {
    if (confirm('¿Eliminar este producto?')) {
      saveProducts(prods.filter(x => x.id !== id));
      renderTable();
    }
  }
});
renderTable();

// — CRUD Usuarios —
const modalUser     = document.getElementById('modalUser');
const formUser      = document.getElementById('userForm');
const userTitle     = document.getElementById('userFormTitle');
const btnAddUser    = document.getElementById('btnAddUser');
const btnCancelUser = document.getElementById('btnCancelUser');
const closeUser     = document.getElementById('closeUser');
const tbodyUsers    = document.querySelector('#tblUsers tbody');

function renderUserTable() {
  const users = getUsers();
  tbodyUsers.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.email}</td>
      <td>${u.name}</td>
      <td>${u.status}</td>
      <td>
        <button class="editUser"     data-id="${u.id}">✏️</button>
        <button class="toggleStatus" data-id="${u.id}">
          ${u.status==='activo'?'Dar baja':'Reactivar'}
        </button>
      </td>`;
    tbodyUsers.appendChild(tr);
  });
}

function openUserModal(edit = false, u = {}) {
  userTitle.textContent = edit ? 'Editar usuario' : 'Nuevo usuario';
  document.getElementById('userId').value     = u.id || '';
  document.getElementById('userEmail').value  = u.email || '';
  document.getElementById('userName').value   = u.name  || '';
  document.getElementById('userStatus').value = u.status|| 'activo';
  modalUser.classList.remove('hidden');
}
function closeUserModal() {
  formUser.reset();
  modalUser.classList.add('hidden');
}

btnAddUser.addEventListener('click', () => openUserModal());
btnCancelUser.addEventListener('click', closeUserModal);
closeUser.addEventListener('click', closeUserModal);
modalUser.addEventListener('click', e => { if (e.target === modalUser) closeUserModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modalUser.classList.contains('hidden')) closeUserModal();
});

formUser.onsubmit = e => {
  e.preventDefault();
  const id     = document.getElementById('userId').value;
  const email  = document.getElementById('userEmail').value;
  const name   = document.getElementById('userName').value;
  const status = document.getElementById('userStatus').value;
  let users = getUsers();
  if (!id) {
    users.push({ id: Date.now().toString(), email, name, status });
  } else {
    users = users.map(x => x.id===id ? { id, email, name, status } : x);
  }
  saveUsers(users);
  renderUserTable();
  closeUserModal();
};

tbodyUsers.addEventListener('click', e => {
  const id = e.target.dataset.id;
  if (!id) return;
  let users = getUsers();
  if (e.target.classList.contains('editUser')) {
    openUserModal(true, users.find(x => x.id === id));
  }
  if (e.target.classList.contains('toggleStatus')) {
    users = users.map(x => x.id===id
      ? { ...x, status: x.status==='activo'?'baja':'activo' }
      : x
    );
    saveUsers(users);
    renderUserTable();
  }
});
renderUserTable();
