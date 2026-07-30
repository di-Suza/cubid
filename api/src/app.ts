import cookieParser from 'cookie-parser';
import cors, { type CorsOptions } from 'cors';
import express, { type Request } from 'express';
import helmet from 'helmet';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { env } from './config/env.js';
import { auctionRoute } from './modules/auctions/index.js';
import { authRoute } from './modules/auth/index.js';
import { healthRoute } from './modules/health/index.js';
import { paymentRoute } from './modules/payments/index.js';
import { userRoute } from './modules/users/index.js';
import {
  apiRateLimiter,
  errorHandler,
  notFoundHandler,
  requestLogger
} from './shared/middleware/index.js';

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || env.corsOrigin.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true
};
const currentDir = dirname(fileURLToPath(import.meta.url));
const clientViewsPath = join(currentDir, '../views');
const clientIndexPath = join(clientViewsPath, 'index.html');

export const createApp = (): express.Express => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(apiRateLimiter);
  app.use(
    express.json({
      limit: '5mb',
      verify: (req: Request & { rawBody?: Buffer }, _res, buffer) => {
        req.rawBody = Buffer.from(buffer);
      }
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.cookieSecret));

  app.use('/api/health', healthRoute.router);
  app.use('/api/auth', authRoute.router);
  app.use('/api/users', userRoute.router);
  app.use('/api/auctions', auctionRoute.router);
  app.use('/api/payments', paymentRoute.router);
  app.use(express.static(clientViewsPath, {
    maxAge: env.isProduction ? '1d' : 0
  }));
  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res, next) => {
    res.sendFile(clientIndexPath, (error) => {
      if (error) {
        next();
      }
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
