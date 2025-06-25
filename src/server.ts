import app from './app';
import config from './config/config';
import { connectDatabase, disconnectDatabase } from './utils/database';
import fs from 'fs';
import path from 'path';

// Create necessary directories
const createDirectories = (): void => {
  try {
    const uploadDir = config.uploadDir;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created upload directory: ${uploadDir}`);
    }
  } catch (error) {
    console.error('Error creating directories:', error);
  }
};

// Initialize server
const startServer = async (): Promise<void> => {
  try {
    // Create necessary directories
    createDirectories();

    // Initialize database connection
    await connectDatabase();

    // Start server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📁 Environment: ${config.nodeEnv}`);
      console.log(`📂 Upload directory: ${config.uploadDir}`);
      console.log(
        `🔒 Max file size: ${(config.maxFileSize / 1024 / 1024).toFixed(1)}MB`,
      );
      console.log(`🌐 CORS origins: ${config.cors.origin.join(', ')}`);
      console.log(
        `🗃️  MongoDB: ${config.mongoUri.replace(/\/\/.*@/, '//<credentials>@')}`,
      );
      console.log(`❤️  Health Check: http://localhost:${config.port}/health`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down gracefully`);

      server.close(async () => {
        console.log('HTTP server closed');

        try {
          await disconnectDatabase();
          console.log('Database disconnected');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        console.error(
          'Could not close connections in time, forcefully shutting down',
        );
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
