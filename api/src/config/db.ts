import mongoose from 'mongoose';

import { env } from './env.js';
import { logger } from './logger.js';

export class DatabaseConnection {
  async connect(): Promise<void> {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongodbUri);
    logger.info({ database: mongoose.connection.name }, 'MongoDB connected');
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
}

export const databaseConnection = new DatabaseConnection();
