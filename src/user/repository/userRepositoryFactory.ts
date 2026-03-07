import { exhaustiveGuard } from '../../shared/exhaustiveGuard';
import { InMemoryUserRepository } from './InMemoryUserRepository';
import { PostgresUserRepository } from './PostgresUserRepository';
import { MongoDBUserRepository } from './MongoDBUserRepository';
import { UserRepositoryPort } from '../UserRepositoryPort';
import { DBClient } from '../../shared/DBClient';

export function createUserRepository(dbClient: DBClient): UserRepositoryPort {
  
  switch (dbClient.type) {
    case 'file':
      return new InMemoryUserRepository();
    
    case 'postgres':
      return new PostgresUserRepository(dbClient.client);
    
    case 'mongodb':
      const connectionString = process.env.MONGODB_URL ?? process.env.DATABASE_URL ?? '';
      const url = new URL(connectionString);
      const dbName = url.pathname.slice(1) || 'hexagonal_demo';
      return new MongoDBUserRepository(dbClient.client, dbName);
    
    default:
      return exhaustiveGuard(dbClient, 'Unhandled repository type');
  }
}
