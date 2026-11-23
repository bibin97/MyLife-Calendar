import mongoose from 'mongoose';
import { env } from './env.js';

let _memoryServer = null;

export const connectDB = async () => {
  try {
    let uri = env.MONGODB_URI;

    // Use in-memory MongoDB when USE_IN_MEMORY_DB=true (no local MongoDB needed)
    if (env.USE_IN_MEMORY_DB) {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      _memoryServer = await MongoMemoryServer.create();
      uri = _memoryServer.getUri();
      console.log('Using in-memory MongoDB for tests or local fallback');
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connection established');
    return conn;
  } catch (err) {
    console.error('MongoDB connection failed');
    if (!env.USE_IN_MEMORY_DB) {
      console.error(`💡 Tip: Set USE_IN_MEMORY_DB=true in .env to run without a local MongoDB install.`);
    }
    throw err;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
  if (_memoryServer) {
    await _memoryServer.stop();
    _memoryServer = null;
  }
};
