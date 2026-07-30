import { api } from '../../../shared/api/api';
import type { ApiSuccessResponse } from '../../../shared/contracts';
import type { AuctionSummary } from '../../../entities/auction';
import type { CreateAuctionPayload } from '../model/auction.types';

export const auctionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createAuction: builder.mutation<AuctionSummary, CreateAuctionPayload>({
      query: (body) => ({
        url: '/auctions',
        method: 'POST',
        body
      }),
      transformResponse: (response: ApiSuccessResponse<{ auction: AuctionSummary }>) => response.data.auction,
      invalidatesTags: ['Auction', 'Timeline']
    })
  })
});

export const { useCreateAuctionMutation } = auctionApi;
