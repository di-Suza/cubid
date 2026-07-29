import { paymentRepository, type PaymentRepository } from './payment.repository.js';

export class PaymentService {
  constructor(private readonly repository: PaymentRepository = paymentRepository) {}
}

export const paymentService = new PaymentService();
