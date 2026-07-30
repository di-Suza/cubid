import { api } from '../../../shared/api/api';
import type { ApiSuccessResponse, PaginatedResponse } from '../../../shared/contracts';
import { SOCKET_EVENTS, socketClient } from '../../../shared/services/socket';
import type { AuctionStatus, AuctionSummary } from '../../../entities/auction';
import type { AuctionMarketplaceUpdate, CreateAuctionPayload } from '../model/auction.types';

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

const normalizeListArgs = (args: ListAuctionsArgs | void) => ({
  page: args?.page ?? 1,
  limit: args?.limit ?? 20,
  status: args?.status,
  search: args?.search?.trim().toLowerCase() ?? ''
});

const matchesList = (
  auction: AuctionSummary,
  status: AuctionStatus | undefined,
  search: string
): boolean => {
  if (status && auction.status !== status) {
    return false;
  }

  if (!search) {
    return true;
  }

  return `${auction.title} ${auction.description}`.toLowerCase().includes(search);
};

const applyMarketplaceUpdate = (
  draft: PaginatedResponse<AuctionSummary>,
  args: ListAuctionsArgs | void,
  update: AuctionMarketplaceUpdate
) => {
  const { page, limit, status, search } = normalizeListArgs(args);
  const previousStatus = update.previousStatus ?? (update.reason === 'CREATED' ? null : update.auction.status);
  const previousAuction = previousStatus ? { ...update.auction, status: previousStatus } : null;
  const currentlyMatches = matchesList(update.auction, status, search);
  const previouslyMatched = previousAuction ? matchesList(previousAuction, status, search) : false;
  const existingIndex = draft.items.findIndex((auction) => auction.id === update.auction.id);
  const existingAuction = existingIndex >= 0 ? draft.items[existingIndex] : null;

  if (existingIndex >= 0) {
    draft.items.splice(existingIndex, 1);
  }

  if (currentlyMatches) {
    draft.items.unshift({
      ...existingAuction,
      ...update.auction,
      updatedAt: update.auction.updatedAt ?? update.serverNow
    });

    if (draft.items.length > limit) {
      draft.items.splice(limit);
    }
  }

  if (currentlyMatches && !previouslyMatched && !existingAuction) {
    draft.meta.total += 1;
  }

  if (!currentlyMatches && previouslyMatched) {
    draft.meta.total = Math.max(0, draft.meta.total - 1);
  }

  draft.meta.hasNextPage = page * limit < draft.meta.total;
};

export const auctionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listAuctions: builder.query<PaginatedResponse<AuctionSummary>, ListAuctionsArgs | void>({
      query: (args) => buildAuctionListQuery(args ?? {}),
      transformResponse: (response: ApiSuccessResponse<PaginatedResponse<AuctionSummary>>) => response.data,
      async onCacheEntryAdded(args, { cacheDataLoaded, cacheEntryRemoved, updateCachedData }) {
        try {
          await cacheDataLoaded;
          socketClient.connect();
          const handleMarketplaceUpdate = (payload: AuctionMarketplaceUpdate) => {
            updateCachedData((draft) => {
              applyMarketplaceUpdate(draft, args, payload);
            });
          };

          socketClient.on<[AuctionMarketplaceUpdate]>(SOCKET_EVENTS.AUCTION_MARKETPLACE_UPDATE, handleMarketplaceUpdate);
          await cacheEntryRemoved;
          socketClient.off<[AuctionMarketplaceUpdate]>(SOCKET_EVENTS.AUCTION_MARKETPLACE_UPDATE, handleMarketplaceUpdate);
        } catch {
          await cacheEntryRemoved;
        }
      },
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
