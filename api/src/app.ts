import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { healthRoute } from './modules/health/index.js';
import {
  apiRateLimiter,
  errorHandler,
  notFoundHandler,
  requestLogger
} from './shared/middleware/index.js';

export const createApp = (): express.Express => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true
    })
  );
  app.use(apiRateLimiter);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.cookieSecret));

  app.use('/api/health', healthRoute.router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
