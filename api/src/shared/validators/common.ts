import { body, param, query } from 'express-validator';

export const mongoIdParam = (name = 'id') => param(name).isMongoId().withMessage(`${name} must be a valid MongoDB id`);

export const positiveIntegerBody = (name: string) =>
  body(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`);

export const nonNegativeIntegerBody = (name: string) =>
  body(name).isInt({ min: 0 }).withMessage(`${name} must be a non-negative integer`);

export const requiredStringBody = (name: string, max = 500) =>
  body(name).trim().notEmpty().withMessage(`${name} is required`).isLength({ max }).withMessage(`${name} is too long`);

export const optionalIsoDateBody = (name: string) =>
  body(name).optional().isISO8601().withMessage(`${name} must be an ISO timestamp`);

export const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100')
];
