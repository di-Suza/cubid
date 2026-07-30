import { useCreateCheckoutOrderMutation, useVerifyCheckoutMutation } from '../../api/payment.api';
import type { PaymentCheckoutOrder, VerifyPaymentPayload } from '../../model/payment.types';

export const useWinnerPayment = () => {
  const [createCheckoutOrder, createState] = useCreateCheckoutOrderMutation();
  const [verifyCheckout, verifyState] = useVerifyCheckoutMutation();

  return {
    createCheckoutOrder: (paymentId: string): Promise<PaymentCheckoutOrder> => createCheckoutOrder({ paymentId }).unwrap(),
    isProcessing: createState.isLoading || verifyState.isLoading,
    verifyCheckout: (payload: VerifyPaymentPayload) => verifyCheckout(payload).unwrap()
  };
};
