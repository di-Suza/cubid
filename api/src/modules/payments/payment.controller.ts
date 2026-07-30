import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { paymentService, type PaymentService } from './payment.service.js';

export class PaymentController {
  constructor(private readonly service: PaymentService = paymentService) {}

  myWins = async (req: Request, res: Response): Promise<void> => {
    const wins = await this.service.listMyWins({
      userId: req.user?.id,
      role: req.user?.role
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        items: wins
      }
    });
  };

  mockCheckout = async (req: Request, res: Response): Promise<void> => {
    const payment = await this.service.completeMockCheckout(
      {
        paymentId: String(req.params.paymentId),
        outcome: req.body.outcome
      },
      {
        userId: req.user?.id,
        role: req.user?.role
      }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        payment
      }
    });
  };
}

export const paymentController = new PaymentController();
