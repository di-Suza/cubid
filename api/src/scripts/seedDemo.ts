import { databaseConnection } from '../config/db.js';
import { logger } from '../config/logger.js';
import { AuctionModel } from '../modules/auctions/auction.model.js';
import { BidModel } from '../modules/bids/bid.model.js';
import { ChatMessageModel } from '../modules/chat/chatMessage.model.js';
import { PaymentModel } from '../modules/payments/payment.model.js';
import { AuctionResultModel } from '../modules/results/result.model.js';
import { TimelineEventModel } from '../modules/timeline/timeline.model.js';
import { UserModel } from '../modules/users/user.model.js';
import { DEFAULT_CURRENCY } from '../shared/constants/auction.js';
import { passwordService } from '../shared/utils/password.js';

const DEMO_PASSWORD = 'Password123!';
const demoEmails = ['seller@bidarena.demo', 'bidder@bidarena.demo', 'rival@bidarena.demo'];
const demoTitles = [
  'Demo Vintage Camera',
  'Demo Mechanical Keyboard',
  'Demo Studio Microphone'
];

const imageUrls = {
  camera: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
  keyboard: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=900&q=80',
  microphone: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=80'
};

const ensureDemoUser = async (input: { name: string; email: string }) => {
  const passwordHash = await passwordService.hashPassword(DEMO_PASSWORD);

  return UserModel.findOneAndUpdate(
    { email: input.email },
    {
      $set: {
        name: input.name,
        email: input.email,
        passwordHash,
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      }
    },
    { new: true, upsert: true }
  );
};

const resetDemoRecords = async (): Promise<void> => {
  const demoAuctions = await AuctionModel.find({ title: { $in: demoTitles } }).select('_id').lean();
  const auctionIds = demoAuctions.map((auction) => auction._id);

  await Promise.all([
    BidModel.deleteMany({ auctionId: { $in: auctionIds } }),
    TimelineEventModel.deleteMany({ auctionId: { $in: auctionIds } }),
    AuctionResultModel.deleteMany({ auctionId: { $in: auctionIds } }),
    PaymentModel.deleteMany({ auctionId: { $in: auctionIds } }),
    ChatMessageModel.deleteMany({ auctionId: { $in: auctionIds } }),
    AuctionModel.deleteMany({ _id: { $in: auctionIds } })
  ]);
};

const createTimeline = (auctionId: unknown, events: Array<{
  type:
    | 'AUCTION_CREATED'
    | 'AUCTION_STARTED'
    | 'BID_ACCEPTED'
    | 'AUCTION_ENDED'
    | 'WINNER_DECLARED'
    | 'PAYMENT_PENDING';
  sequence: number;
  actorPublicId: unknown | null;
  publicMetadata?: Record<string, unknown>;
}>) =>
  TimelineEventModel.insertMany(
    events.map((event) => ({
      auctionId,
      ...event
    }))
  );

const seed = async (): Promise<void> => {
  await databaseConnection.connect();
  await resetDemoRecords();

  const [seller, bidder, rival] = await Promise.all([
    ensureDemoUser({ name: 'Demo Seller', email: demoEmails[0] }),
    ensureDemoUser({ name: 'Demo Bidder', email: demoEmails[1] }),
    ensureDemoUser({ name: 'Demo Rival', email: demoEmails[2] })
  ]);

  const now = new Date();

  const activeAuction = await AuctionModel.create({
    sellerId: seller._id,
    title: 'Demo Vintage Camera',
    description: 'A live demo auction with accepted bids and room activity.',
    imageUrl: imageUrls.camera,
    currency: DEFAULT_CURRENCY,
    startingBidMinor: 50_000,
    minimumIncrementMinor: 5_000,
    currentHighestBidMinor: 65_000,
    highestBidderId: rival._id,
    bidCount: 2,
    startAt: new Date(now.getTime() - 10 * 60 * 1000),
    endAt: new Date(now.getTime() + 50 * 60 * 1000),
    status: 'ACTIVE',
    version: 2,
    lastSequence: 2,
    finalizedAt: null,
    winnerId: null
  });

  await BidModel.insertMany([
    {
      auctionId: activeAuction._id,
      bidderId: bidder._id,
      amountMinor: 50_000,
      requestId: 'demo-active-bid-1',
      sequence: 1,
      status: 'ACCEPTED'
    },
    {
      auctionId: activeAuction._id,
      bidderId: rival._id,
      amountMinor: 65_000,
      requestId: 'demo-active-bid-2',
      sequence: 2,
      status: 'ACCEPTED'
    }
  ]);
  await createTimeline(activeAuction._id, [
    { type: 'AUCTION_CREATED', sequence: 0, actorPublicId: seller._id },
    { type: 'AUCTION_STARTED', sequence: 1, actorPublicId: null },
    { type: 'BID_ACCEPTED', sequence: 2, actorPublicId: rival._id, publicMetadata: { amountMinor: 65_000 } }
  ]);

  const upcomingAuction = await AuctionModel.create({
    sellerId: seller._id,
    title: 'Demo Mechanical Keyboard',
    description: 'A scheduled auction ready to demonstrate upcoming discovery filters.',
    imageUrl: imageUrls.keyboard,
    currency: DEFAULT_CURRENCY,
    startingBidMinor: 80_000,
    minimumIncrementMinor: 10_000,
    currentHighestBidMinor: 0,
    highestBidderId: null,
    bidCount: 0,
    startAt: new Date(now.getTime() + 90 * 60 * 1000),
    endAt: new Date(now.getTime() + 150 * 60 * 1000),
    status: 'UPCOMING',
    version: 0,
    lastSequence: 0,
    finalizedAt: null,
    winnerId: null
  });
  await createTimeline(upcomingAuction._id, [
    { type: 'AUCTION_CREATED', sequence: 0, actorPublicId: seller._id }
  ]);

  const completedAuction = await AuctionModel.create({
    sellerId: seller._id,
    title: 'Demo Studio Microphone',
    description: 'A completed auction with a pending winner payment for the My Wins page.',
    imageUrl: imageUrls.microphone,
    currency: DEFAULT_CURRENCY,
    startingBidMinor: 100_000,
    minimumIncrementMinor: 10_000,
    currentHighestBidMinor: 130_000,
    highestBidderId: bidder._id,
    bidCount: 2,
    startAt: new Date(now.getTime() - 130 * 60 * 1000),
    endAt: new Date(now.getTime() - 70 * 60 * 1000),
    status: 'COMPLETED',
    version: 3,
    lastSequence: 5,
    finalizedAt: new Date(now.getTime() - 70 * 60 * 1000),
    winnerId: bidder._id
  });

  const [firstCompletedBid, winningBid] = await BidModel.insertMany([
    {
      auctionId: completedAuction._id,
      bidderId: rival._id,
      amountMinor: 110_000,
      requestId: 'demo-completed-bid-1',
      sequence: 1,
      status: 'ACCEPTED'
    },
    {
      auctionId: completedAuction._id,
      bidderId: bidder._id,
      amountMinor: 130_000,
      requestId: 'demo-completed-bid-2',
      sequence: 2,
      status: 'ACCEPTED'
    }
  ]);

  void firstCompletedBid;

  await AuctionResultModel.create({
    auctionId: completedAuction._id,
    winnerId: bidder._id,
    winningBidId: winningBid._id,
    winningAmountMinor: 130_000,
    declaredAt: completedAuction.finalizedAt
  });

  await PaymentModel.create({
    auctionId: completedAuction._id,
    winnerId: bidder._id,
    amountMinor: 130_000,
    currency: DEFAULT_CURRENCY,
    gateway: 'mock',
    status: 'PENDING',
    verifiedAt: null
  });

  await createTimeline(completedAuction._id, [
    { type: 'AUCTION_CREATED', sequence: 0, actorPublicId: seller._id },
    { type: 'AUCTION_STARTED', sequence: 1, actorPublicId: null },
    { type: 'BID_ACCEPTED', sequence: 2, actorPublicId: rival._id, publicMetadata: { amountMinor: 110_000 } },
    { type: 'BID_ACCEPTED', sequence: 3, actorPublicId: bidder._id, publicMetadata: { amountMinor: 130_000 } },
    { type: 'AUCTION_ENDED', sequence: 4, actorPublicId: null },
    { type: 'WINNER_DECLARED', sequence: 5, actorPublicId: bidder._id, publicMetadata: { amountMinor: 130_000 } },
    { type: 'PAYMENT_PENDING', sequence: 6, actorPublicId: bidder._id }
  ]);

  logger.info(
    {
      accounts: demoEmails,
      password: DEMO_PASSWORD,
      auctions: demoTitles
    },
    'BidArena demo data seeded'
  );

  await databaseConnection.disconnect();
};

void seed().catch(async (error) => {
  logger.error({ error }, 'Failed to seed BidArena demo data');
  await databaseConnection.disconnect();
  process.exit(1);
});
