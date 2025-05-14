const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('name').notEmpty().withMessage('Name required'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').exists().withMessage('Password required'),
  ],
  validate,
  authController.login
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Invalid email')],
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  [body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')],
  validate,
  authController.resetPassword
);

module.exports = router;