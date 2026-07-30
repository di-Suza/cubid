import { api } from '../../../shared/api/api';
import type { ApiSuccessResponse, PaginatedResponse } from '../../../shared/contracts';
import type { AuctionStatus, AuctionSummary } from '../../../entities/auction';
import type { CreateAuctionPayload } from '../model/auction.types';

export interface ListAuctionsArgs {
  page?: number;
  limit?: number;
  status?: AuctionStatus;
  search?: string;
}

const buildAuctionListQuery = ({ page = 1, limit = 20, status, search }: ListAuctionsArgs = {}): string => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  if (status) {
    params.set('status', status);
  }

  if (search?.trim()) {
    params.set('search', search.trim());
  }

  return `/auctions?${params.toString()}`;
};

export const auctionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listAuctions: builder.query<PaginatedResponse<AuctionSummary>, ListAuctionsArgs | void>({
      query: (args) => buildAuctionListQuery(args ?? {}),
      transformResponse: (response: ApiSuccessResponse<PaginatedResponse<AuctionSummary>>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((auction) => ({ type: 'Auction' as const, id: auction.id })),
              { type: 'Auction' as const, id: 'LIST' }
            ]
          : [{ type: 'Auction' as const, id: 'LIST' }]
    }),
    getAuctionDetail: builder.query<AuctionSummary, string>({
      query: (auctionId) => `/auctions/${auctionId}`,
      transformResponse: (response: ApiSuccessResponse<{ auction: AuctionSummary }>) => response.data.auction,
      providesTags: (_result, _error, auctionId) => [{ type: 'Auction', id: auctionId }]
    }),
    listMyAuctions: builder.query<PaginatedResponse<AuctionSummary>, ListAuctionsArgs | void>({
      query: (args) => {
        const query = buildAuctionListQuery(args ?? {});
        return query.replace('/auctions?', '/auctions/me?');
      },
      transformResponse: (response: ApiSuccessResponse<PaginatedResponse<AuctionSummary>>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((auction) => ({ type: 'Auction' as const, id: auction.id })),
              { type: 'Auction' as const, id: 'MINE' }
            ]
          : [{ type: 'Auction' as const, id: 'MINE' }]
    }),
    createAuction: builder.mutation<AuctionSummary, CreateAuctionPayload>({
      query: (body) => ({
        url: '/auctions',
        method: 'POST',
        body
      }),
      transformResponse: (response: ApiSuccessResponse<{ auction: AuctionSummary }>) => response.data.auction,
      invalidatesTags: [{ type: 'Auction', id: 'LIST' }, { type: 'Auction', id: 'MINE' }, 'Timeline']
    })
  })
});

export const {
  useCreateAuctionMutation,
  useGetAuctionDetailQuery,
  useListAuctionsQuery,
  useListMyAuctionsQuery
} = auctionApi;
