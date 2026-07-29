import { PaymentModel, type PaymentDocument } from './payment.model.js';

export class PaymentRepository {
  constructor(private readonly paymentModel = PaymentModel) {}

  get model(): typeof this.paymentModel {
    return this.paymentModel;
  }
}

export const paymentRepository = new PaymentRepository();

export type { PaymentDocument };
