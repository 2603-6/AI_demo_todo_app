import { createApp } from './server';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3001);
  
  app.listen(port, () => {
    console.log(`Node hexagonal example listening on http://localhost:${port}`);
  });
}

bootstrap();
