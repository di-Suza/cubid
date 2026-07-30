import type { Request, Response } from 'express';

import type { EngineAuctionRecord } from '../auction-engine/auctionEngine.types.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { auctionService, type AuctionService } from './auction.service.js';

const toAuctionDto = (auction: EngineAuctionRecord) => ({
  id: auction.id,
  seller: auction.seller,
  title: auction.title,
  description: auction.description,
  imageUrl: auction.imageUrl,
  currency: auction.currency,
  startingBidMinor: auction.startingBidMinor,
  currentHighestBidMinor: auction.currentHighestBidMinor,
  highestBidder: auction.highestBidder,
  minimumIncrementMinor: auction.minimumIncrementMinor,
  bidCount: auction.bidCount,
  status: auction.status,
  startAt: auction.startAt.toISOString(),
  endAt: auction.endAt.toISOString(),
  version: auction.version,
  lastSequence: auction.lastSequence,
  finalizedAt: auction.finalizedAt?.toISOString() ?? null,
  winner: auction.winner,
  createdAt: auction.createdAt?.toISOString(),
  updatedAt: auction.updatedAt?.toISOString()
});

export class AuctionController {
  constructor(private readonly service: AuctionService = auctionService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.listAuctions(req.query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        items: result.items.map(toAuctionDto),
        meta: result.meta
      }
    });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const auction = await this.service.createAuction(req.body, {
      userId: req.user?.id,
      role: req.user?.role
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        auction: toAuctionDto(auction)
      }
    });
  };

  myAuctions = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.listMyAuctions(req.query, {
      userId: req.user?.id,
      role: req.user?.role
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        items: result.items.map(toAuctionDto),
        meta: result.meta
      }
    });
  };

  detail = async (req: Request, res: Response): Promise<void> => {
    const auction = await this.service.getAuctionDetail(String(req.params.auctionId));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        auction: toAuctionDto(auction)
      }
    });
  };
}

export const auctionController = new AuctionController();
