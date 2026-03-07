/**
 * Repository selection via environment variable.
 * 
 * Set DB_TYPE to one of: 'file', 'postgres', 'mongodb'
 * Defaults to 'file' if not set.
 * 
 * Examples:
 *   DB_TYPE=file npm run dev
 *   DB_TYPE=postgres npm run dev:postgres
 *   DB_TYPE=mongodb npm run dev:mongodb
 */

export type RepositoryType = 'file' | 'postgres' | 'mongodb';

export const VALID_REPOSITORIES = ['file', 'postgres', 'mongodb'] as const;

export function getRepositoryType(): RepositoryType {
  const repo = process.env.DB_TYPE?.trim().toLowerCase();
  
  if (!repo || (VALID_REPOSITORIES as readonly string[]).includes(repo)) {
    return (repo as RepositoryType) || 'file';
  }
  
  throw new Error(
    `Invalid DB_TYPE: "${repo}". Valid options: ${VALID_REPOSITORIES.join(', ')}`
  );
}
