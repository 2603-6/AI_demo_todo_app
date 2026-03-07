import express, { Express, NextFunction, Request, Response } from 'express';
import { createUserRoutes } from './user/routes/userRoutes';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { createUserRepository } from './user/repository/userRepositoryFactory';
import { UserService } from './user/service/UserService';
import { getDBClient } from './shared/DBClient';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error';
}

const DB_CLIENT_CREATORS = {
  file: (): null => null,
  postgres: (): Pool => {
    const connectionString = process.env.DATABASE_URL ?? '';
    if (!connectionString.trim()) {
      throw new Error('DATABASE_URL is required for postgres repository');
    }
    return new Pool({ connectionString });
  },
  mongodb: (): MongoClient => {
    const connectionString = process.env.MONGODB_URL ?? process.env.DATABASE_URL ?? '';
    if (!connectionString.trim()) {
      throw new Error('MONGODB_URL or DATABASE_URL is required for mongodb repository');
    }
    return new MongoClient(connectionString);
  },
} as const;

export async function createApp(): Promise<Express> {
  const dbClient = getDBClient();

  if (dbClient.type === 'mongodb') {
    await dbClient.client.connect();
  }

  const userRepository = createUserRepository(dbClient);
  const userService = new UserService(userRepository);

  const app = express();
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  const router = express.Router();
  app.use('/api', createUserRoutes({ userService, router }));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = getErrorMessage(err);
    const status = err instanceof Error ? 400 : 500;

    res.status(status).json({ error: message });
  });

  return app;
}
