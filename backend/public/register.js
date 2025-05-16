// Suponé que tenés un formulario con id="registerForm"
const form = document.getElementById('registerForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = form.name.value;
  const email = form.email.value;
  const password = form.password.value;

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert('User registered successfully!');
    } else {
      alert('Error: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    alert('Network error');
  }
});
