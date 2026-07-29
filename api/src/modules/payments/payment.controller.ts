import { paymentService, type PaymentService } from './payment.service.js';

export class PaymentController {
  constructor(private readonly service: PaymentService = paymentService) {}
}

export const paymentController = new PaymentController();
