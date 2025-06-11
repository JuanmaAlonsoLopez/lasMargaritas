const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const transporter = require('../utils/mailer');

exports.googleCallback = (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // Redirigir a la página de inicio con el token y los datos del usuario (nombre, email)
  const user = req.user;
  res.redirect(`http://localhost:3000/index.html?token=${token}&user=${encodeURIComponent(JSON.stringify({ name: user.name, email: user.email }))}`);
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)',
      [name, email, hashedPassword, 2, 1]   // rol 2 = cliente status 1 = Habilitación pendiente
    );

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const link = `http://localhost:3000/api/auth/activate/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Activate your account',
      html: `<p>Click <a href="${link}">here</a> to activate your account.</p>`
    });

    res.status(201).json({ message: 'Registered. Check email to activate.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.activate = async (req, res) => {
  const { token } = req.params;
  try {
    const { email } = jwt.verify(token, process.env.JWT_SECRET);
    await pool.query(
      'UPDATE users SET status = 2 WHERE email = $1',
      [email]
    );
    // puedes redirigir a una página estática de éxito
    return res.send('Account activated! You can now log in.');
  } catch (err) {
    console.error(err);
    return res.status(400).send('Invalid or expired activation link');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (!userRes.rowCount) 
      return res.status(400).json({ message: 'Invalid credentials' });

    const user = userRes.rows[0];
    if (user.status !== 2)
      return res.status(403).json({ message: 'Account not activated' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (!userRes.rowCount)
      return res.status(400).json({ message: 'Email not found' });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const link = `http://localhost:3000/reset-password.html?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${link}">here</a> to reset. Expires in 15m.</p>`
    });
    res.json({ message: 'Reset link sent' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const { email } = jwt.verify(token, process.env.JWT_SECRET);
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password=$1 WHERE email=$2', [hash, email]);
    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
};