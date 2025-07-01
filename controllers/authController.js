const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const transporter = require('../utils/mailer');

// ✅ URL de producción para todas las redirecciones y enlaces.
const PRODUCTION_URL = 'https://las-margaritas.vercel.app';
const JWT_SECRET = process.env.JWT_SECRET;

// Verificación de seguridad: Asegura que la clave JWT esté definida al iniciar.
if (!JWT_SECRET) {
  console.error("Error crítico: La variable de entorno JWT_SECRET no está definida.");
  process.exit(1); // Detiene la aplicación si la clave secreta no existe.
}

// ==================================
// CALLBACK DE GOOGLE
// ==================================
exports.googleCallback = (req, res) => {
  try {
    // Passport.js ya ha verificado al usuario y lo ha adjuntado a `req.user`.
    if (!req.user) {
      throw new Error('No se encontró información del usuario después de la autenticación de Google.');
    }

    const user = req.user;
    // Se crea un token JWT con la información esencial y estandarizada.
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Se redirige al frontend, pasando el token como un parámetro de consulta (query param).
    // El frontend será responsable de leer este token y guardarlo.
    res.redirect(`${PRODUCTION_URL}/index.html?token=${token}`);

  } catch (error) {
    console.error('Error en el callback de Google:', error);
    // En caso de error, redirige a una página de error amigable.
    res.redirect(`${PRODUCTION_URL}/pages/error.html?message=google_auth_failed`);
  }
};

// ==================================
// REGISTRO LOCAL
// ==================================
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (userExists.rowCount > 0) {
      return res.status(409).json({ message: 'El correo electrónico ya está registrado.' }); // 409 Conflict es más específico.
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Se inserta el nuevo usuario con rol de 'cliente' y estado 'pendiente'.
    await pool.query(
      'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)',
      [name, email, hashedPassword, 2, 1] 
    );

    // Se crea un token de activación con el email.
    const activationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });
    const activationLink = `${PRODUCTION_URL}/api/auth/activate/${activationToken}`;

    // Se envía el correo de activación.
    await transporter.sendMail({
      from: `Las Margaritas <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Activa tu cuenta en Las Margaritas',
      html: `<p>¡Gracias por registrarte! Por favor, haz clic <a href="${activationLink}">aquí</a> para activar tu cuenta.</p>`
    });

    res.status(201).json({ message: 'Registro exitoso. Revisa tu correo para activar la cuenta.' });
  } catch (err) {
    console.error('Error en el registro:', err);
    res.status(500).json({ message: 'Ocurrió un error en el servidor al intentar registrar el usuario.' });
  }
};

// ==================================
// ACTIVACIÓN DE CUENTA
// ==================================
exports.activate = async (req, res) => {
  const { token } = req.params;
  try {
    const { email } = jwt.verify(token, JWT_SECRET);
    // Se actualiza el estado del usuario a 'activo'.
    const result = await pool.query(
      "UPDATE users SET status = 2 WHERE email = $1 AND status = 1 RETURNING id",
      [email]
    );

    if (result.rowCount === 0) {
      // Si no se actualiza ninguna fila, puede ser que el usuario ya estuviera activo.
      return res.redirect(`${PRODUCTION_URL}/login.html?message=account_already_active`);
    }

    res.redirect(`${PRODUCTION_URL}/login.html?activated=true`);
  } catch (err) {
    console.error('Error en la activación:', err);
    res.redirect(`${PRODUCTION_URL}/pages/error.html?message=invalid_or_expired_link`);
  }
};

// ==================================
// LOGIN LOCAL
// ==================================
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos.' }); // 401 Unauthorized
    }

    const user = userRes.rows[0];

    // Se verifica si la cuenta ha sido activada.
    if (user.status !== 2) {
      return res.status(403).json({ message: 'La cuenta no ha sido activada. Por favor, revisa tu correo.' }); // 403 Forbidden
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
    }

    // Se crea el token de sesión con información estandarizada.
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Se devuelve el token y un objeto de usuario sin la contraseña.
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Error en el login:', err);
    res.status(500).json({ message: 'Ocurrió un error en el servidor durante el inicio de sesión.' });
  }
};


// ==================================
// OLVIDO DE CONTRASEÑA
// ==================================
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (userRes.rowCount === 0) {
      // Por seguridad, no revelamos si el email existe o no.
      return res.json({ message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.' });
    }

    const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '15m' });
    const resetLink = `${PRODUCTION_URL}/reset-password.html?token=${resetToken}`;
    
    await transporter.sendMail({
      from: `Las Margaritas <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Restablece tu contraseña',
      html: `<p>Haz clic <a href="${resetLink}">aquí</a> para restablecer tu contraseña. El enlace expira en 15 minutos.</p>`
    });

    res.json({ message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.' });
  } catch (err) {
    console.error('Error en forgotPassword:', err);
    // No enviar un error 500 al cliente, para no revelar fallos internos.
    res.json({ message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.' });
  }
};

// ==================================
// RESETEO DE CONTRASEÑA
// ==================================
exports.resetPassword = async (req, res) => {
  // El token ahora se pasa en el header para más seguridad
  const token = req.body.token;
  const { password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Faltan el token o la nueva contraseña.' });
  }

  try {
    const { email } = jwt.verify(token, JWT_SECRET);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query('UPDATE users SET password=$1 WHERE email=$2', [hashedPassword, email]);
    
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('Error en resetPassword:', err);
    res.status(400).json({ message: 'El token es inválido o ha expirado.' });
  }
};