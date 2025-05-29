const header = document.getElementById('mainHeader');
const toggleBtn = document.createElement('div');
toggleBtn.className = 'menu-toggle';
toggleBtn.innerHTML = '&#9776;'; // ícono ☰

toggleBtn.onclick = () => {
  document.getElementById('mainNav').classList.toggle('active');
};

const headerInner = document.querySelector('.header-inner');
headerInner.insertBefore(toggleBtn, headerInner.querySelector('.icons'));

window.addEventListener('scroll', () => {
  if (window.scrollY > 30) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});
