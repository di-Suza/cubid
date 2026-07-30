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

  createCheckoutOrder = async (req: Request, res: Response): Promise<void> => {
    const checkout = await this.service.createCheckoutOrder(String(req.params.paymentId), {
      userId: req.user?.id,
      role: req.user?.role
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        checkout
      }
    });
  };

  verifyCheckout = async (req: Request, res: Response): Promise<void> => {
    const payment = await this.service.verifyCheckout(String(req.params.paymentId), req.body, {
      userId: req.user?.id,
      role: req.user?.role
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        payment
      }
    });
  };

  webhook = async (req: Request & { rawBody?: Buffer }, res: Response): Promise<void> => {
    const payment = await this.service.handleWebhook({
      signature: req.header('x-razorpay-signature') ?? req.header('stripe-signature') ?? undefined,
      rawBody: req.rawBody ?? Buffer.from(JSON.stringify(req.body)),
      body: req.body
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        payment
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
