import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { Router } from 'express';
import cors from 'cors';
import { TodoGrpcClient } from './grpc/TodoGrpcClient';
import { createTodoRoutes } from './routes/todoRoutes';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}

export function createApp(): Express {
  const todoGrpcClient = new TodoGrpcClient();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  const router = Router();
  app.use('/api', createTodoRoutes({ todoGrpcClient, router }));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: getErrorMessage(err) });
  });

  return app;
}
