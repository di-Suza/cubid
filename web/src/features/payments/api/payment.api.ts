import { api } from '../../../shared/api/api';
import type { ApiSuccessResponse } from '../../../shared/contracts';
import type { Payment, WinnerPayment } from '../../../entities/payment';
import type { MockCheckoutPayload, PaymentCheckoutOrder, VerifyPaymentPayload } from '../model/payment.types';

export const paymentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listMyWins: builder.query<WinnerPayment[], void>({
      query: () => '/payments/me/wins',
      transformResponse: (response: ApiSuccessResponse<{ items: WinnerPayment[] }>) => response.data.items,
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({ type: 'Payment' as const, id: item.payment.id })),
              { type: 'Payment' as const, id: 'MY_WINS' }
            ]
          : [{ type: 'Payment' as const, id: 'MY_WINS' }]
    }),
    createCheckoutOrder: builder.mutation<PaymentCheckoutOrder, { paymentId: string }>({
      query: ({ paymentId }) => ({
        url: `/payments/${paymentId}/order`,
        method: 'POST'
      }),
      transformResponse: (response: ApiSuccessResponse<{ checkout: PaymentCheckoutOrder }>) => response.data.checkout
    }),
    verifyCheckout: builder.mutation<Payment, VerifyPaymentPayload>({
      query: ({ paymentId, ...body }) => ({
        url: `/payments/${paymentId}/verify`,
        method: 'POST',
        body
      }),
      transformResponse: (response: ApiSuccessResponse<{ payment: Payment }>) => response.data.payment,
      invalidatesTags: (_result, _error, payload) => [
        { type: 'Payment', id: payload.paymentId },
        { type: 'Payment', id: 'MY_WINS' },
        'Auction',
        'Timeline'
      ]
    }),
    mockCheckout: builder.mutation<Payment, MockCheckoutPayload>({
      query: ({ paymentId, outcome }) => ({
        url: `/payments/${paymentId}/mock-checkout`,
        method: 'POST',
        body: {
          outcome
        }
      }),
      transformResponse: (response: ApiSuccessResponse<{ payment: Payment }>) => response.data.payment,
      invalidatesTags: (_result, _error, payload) => [
        { type: 'Payment', id: payload.paymentId },
        { type: 'Payment', id: 'MY_WINS' },
        'Auction',
        'Timeline'
      ]
    })
  })
});

export const {
  useCreateCheckoutOrderMutation,
  useListMyWinsQuery,
  useMockCheckoutMutation,
  useVerifyCheckoutMutation
} = paymentApi;
