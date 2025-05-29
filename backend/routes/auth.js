const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('name').notEmpty().withMessage('Name required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('confirmPassword')
      .custom((val, { req }) => val === req.body.password)
      .withMessage('Passwords must match'),
  ],
  validate,
  authController.register
);

router.get('/activate/:token', authController.activate);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').exists(),
  ],
  validate,
  authController.login
);

router.post(
  '/forgot-password',
  [body('email').isEmail()],
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  [
    body('password').isLength({ min: 6 }),
    body('confirmPassword')
      .custom((val, { req }) => val === req.body.password)
      .withMessage('Passwords must match'),
  ],
  validate,
  authController.resetPassword
);

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [payload.userId]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});


module.exports = router;
