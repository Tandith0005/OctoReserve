// src/config/database.ts
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { envVars } from './envVars.js';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = envVars.DATABASE_URL || 'mongodb://localhost:27017/octo-reserve';
    
    await mongoose.connect(mongoURI);
    
    logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};