import { createServer } from 'node:http';

import { createApp } from './app.js';
import { databaseConnection } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { realtimeService } from './infrastructure/realtime/index.js';

const bootstrap = async (): Promise<void> => {
  await databaseConnection.connect();

  const app = createApp();
  const httpServer = createServer(app);

  realtimeService.attach(httpServer);

  httpServer.listen(env.port, () => {
    logger.info({ port: env.port, env: env.nodeEnv }, 'Cubid API listening');
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');
    httpServer.close(async () => {
      await databaseConnection.disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

void bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to start Cubid API');
  process.exit(1);
});
