import { body } from 'express-validator';

import { requiredStringBody } from '../../../shared/validators/common.js';

export const registerValidators = [
  requiredStringBody('name', 80),
  body('email').isEmail().normalizeEmail().withMessage('email must be valid'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('password must be 8-128 characters')
];

export const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('email must be valid'),
  body('password').isString().notEmpty().withMessage('password is required')
];
