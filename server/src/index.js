import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { seedDefaultCategories } from './services/seedService.js';
import { assertProductionEnv, env } from './config/env.js';
import { redactSecrets } from './utils/logRedact.js';

const startServer = async () => {
  assertProductionEnv();
  await connectDB();
  await seedDefaultCategories();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`MyLife Calendar Server listening on port ${env.PORT} (${env.NODE_ENV})`);
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
  console.error('Failed to start server:', redactSecrets(err.message || err));
  process.exit(1);
});
