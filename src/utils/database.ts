import mongoose from 'mongoose';
import config from '../config/config';

// MongoDB connection options
const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
};

// Connect to MongoDB
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri, connectionOptions);
    console.log('📦 Connected to MongoDB successfully');

    // Set up event listeners
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📦 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('📦 MongoDB reconnected');
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

// Disconnect from MongoDB
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

// Check database connection status
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Initialize database with seed data
export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!isDatabaseConnected()) {
      await connectDatabase();
    }

    console.log('📦 Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default mongoose;
