import { body } from 'express-validator';

export const sendChatMessageValidators = [
  body('auctionId').isMongoId().withMessage('auctionId must be valid'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('message must be 1-1000 characters')
];
