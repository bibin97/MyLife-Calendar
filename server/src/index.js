import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { seedDefaultCategories } from './services/seedService.js';
import { env } from './config/env.js';

const startServer = async () => {
  await connectDB();
  await seedDefaultCategories();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 MyLife Calendar Server running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
    console.log(`📦 Connected to Local MongoDB Community Server: ${env.MONGODB_URI}`);
  });

  const gracefulShutdown = () => {
    console.log('Stopping server gracefully...');
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
