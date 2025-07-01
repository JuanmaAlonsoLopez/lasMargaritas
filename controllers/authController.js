const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const transporter = require('../utils/mailer');

// ✅ URL de producción para todas las redirecciones y enlaces
const PRODUCTION_URL = 'https://las-margaritas.vercel.app';

exports.googleCallback = (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const user = req.user;
  // ✅ Redirige a la URL de producción
  res.redirect(`${PRODUCTION_URL}/index.html?token=${token}&user=${encodeURIComponent(JSON.stringify({ name: user.name, email: user.email }))}`);
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)',
      [name, email, hashedPassword, 2, 1] // rol 2 = cliente, status 1 = Pendiente
    );

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    // ✅ Usa la URL de producción para el enlace de activación
    const link = `${PRODUCTION_URL}/api/auth/activate/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Activa tu cuenta en Las Margaritas',
      html: `<p>¡Gracias por registrarte! Haz clic <a href="${link}">aquí</a> para activar tu cuenta.</p>`
    });

    res.status(201).json({ message: 'Registro exitoso. Revisa tu correo para activar la cuenta.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
};

exports.activate = async (req, res) => {
  const { token } = req.params;
  try {
    const { email } = jwt.verify(token, process.env.JWT_SECRET);
    await pool.query(
      'UPDATE users SET status = 2 WHERE email = $1', // status 2 = Activo
      [email]
    );
    // ✅ Redirige a la página de login después de activar
    res.redirect(`${PRODUCTION_URL}/login.html?activated=true`);
  } catch (err) {
    console.error(err);
    // ✅ Redirige a una página de error si el token es inválido
    res.redirect(`${PRODUCTION_URL}/pages/error.html?message=link_invalido`);
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (!userRes.rowCount)
      return res.status(400).json({ message: 'Credenciales inválidas' });

    const user = userRes.rows[0];
    if (user.status !== 2)
      return res.status(403).json({ message: 'La cuenta no ha sido activada' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (!userRes.rowCount)
      return res.status(400).json({ message: 'Email no encontrado' });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    // ✅ Usa la URL de producción para el enlace de reseteo
    const link = `${PRODUCTION_URL}/reset-password.html?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Restablece tu contraseña',
      html: `<p>Haz clic <a href="${link}">aquí</a> para restablecer tu contraseña. El enlace expira en 15 minutos.</p>`
    });
    res.json({ message: 'Enlace de restablecimiento enviado' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const { email } = jwt.verify(token, process.env.JWT_SECRET);
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password=$1 WHERE email=$2', [hash, email]);
    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Token inválido o expirado' });
  }
};