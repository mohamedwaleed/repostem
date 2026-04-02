import { App } from './app';

const app = new App();

process.on('SIGINT', async () => {
  await app.stop();
  process.exit(0);
});

app.start();
