import { createApp } from './server';

function bootstrap(): void {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3001);
  
  app.listen(port, () => {
    console.log(`Node hexagonal example listening on http://localhost:${port}`);
  });
}

bootstrap();
