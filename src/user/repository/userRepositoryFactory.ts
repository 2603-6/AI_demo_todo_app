import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { getRepositoryType } from '../../config';
import { exhaustiveGuard } from '../../shared/exhaustiveGuard';
import { InMemoryUserRepository } from './InMemoryUserRepository';
import { PostgresUserRepository } from './PostgresUserRepository';
import { MongoDBUserRepository } from './MongoDBUserRepository';
import { UserRepositoryPort } from '../UserRepositoryPort';

type DBClient = Pool | MongoClient | null;

export function createUserRepository(dbClient: DBClient): UserRepositoryPort {
  const type = getRepositoryType();
  
  switch (type) {
    case 'file':
      return new InMemoryUserRepository();
    
    case 'postgres':
      if (!(dbClient instanceof Pool)) {
        throw new Error('Expected Pool for postgres repository');
      }
      return new PostgresUserRepository(dbClient);
    
    case 'mongodb':
      if (!(dbClient instanceof MongoClient)) {
        throw new Error('Expected MongoClient for mongodb repository');
      }
      const connectionString = process.env.MONGODB_URL ?? process.env.DATABASE_URL ?? '';
      const url = new URL(connectionString);
      const dbName = url.pathname.slice(1) || 'hexagonal_demo';
      return new MongoDBUserRepository(dbClient, dbName);
    
    default:
      return exhaustiveGuard(type, 'Unhandled repository type');
  }
}
