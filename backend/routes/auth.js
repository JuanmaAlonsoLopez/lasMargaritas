const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');

const router = express.Router();

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

module.exports = router;
