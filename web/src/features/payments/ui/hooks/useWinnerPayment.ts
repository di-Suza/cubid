import { useMockCheckoutMutation } from '../../api/payment.api';
import type { MockCheckoutPayload } from '../../model/payment.types';

export const useWinnerPayment = () => {
  const [mockCheckout, state] = useMockCheckoutMutation();

  return {
    completePayment: (payload: MockCheckoutPayload) => mockCheckout(payload).unwrap(),
    isProcessing: state.isLoading
  };
};
