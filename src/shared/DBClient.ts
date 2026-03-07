import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { exhaustiveGuard } from './exhaustiveGuard';

type RepositoryType = 'file' | 'postgres' | 'mongodb';
const VALID_REPOSITORIES = ['file', 'postgres', 'mongodb'] as const;

function getRepositoryType(): RepositoryType {
  const repo = process.env.DB_TYPE?.trim().toLowerCase();
  
  if (!repo || (VALID_REPOSITORIES as readonly string[]).includes(repo)) {
    return (repo as RepositoryType) || 'file';
  }
  
  throw new Error(
    `Invalid DB_TYPE: "${repo}". Valid options: ${VALID_REPOSITORIES.join(', ')}`
  );
}

export type DBClient =
  | { type: 'file'; client: null }
  | { type: 'postgres'; client: Pool }
  | { type: 'mongodb'; client: MongoClient };


export function getDBClient(): DBClient {
  const type = getRepositoryType();
  
  switch (type) {
    case 'file':
      return { type: 'file', client: null };
    case 'postgres': {
      const connectionString = process.env.DATABASE_URL ?? '';
      if (!connectionString.trim()) {
        throw new Error('DATABASE_URL is required for postgres repository');
      }
      return { type: 'postgres', client: new Pool({ connectionString }) };
    }
    case 'mongodb': {
      const connectionString = process.env.MONGODB_URL ?? process.env.DATABASE_URL ?? '';
      if (!connectionString.trim()) {
        throw new Error('MONGODB_URL or DATABASE_URL is required for mongodb repository');
      }
      return { type: 'mongodb', client: new MongoClient(connectionString) };
    }
    default:
      return exhaustiveGuard(type, 'Unhandled DB client type');
  }
}
