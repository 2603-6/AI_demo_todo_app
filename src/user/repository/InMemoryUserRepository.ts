
import { User } from '../User';
import { UserRepositoryPort } from '../UserRepositoryPort';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export class InMemoryUserRepository extends UserRepositoryPort {
  private readonly filePath: string;

  public constructor() {
    super();
    this.filePath = resolve(process.cwd(), '.data', 'users.json');
  }

  public async save(user: User): Promise<User> {
    const users = await this.readUsers();
    users.push(user);
    await this.writeUsers(users);
    return user;
  }

  public async findAll(): Promise<User[]> {
    return this.readUsers();
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    const users = await this.readUsers();
    return users.some((user) => user.email === normalized);
  }

  private async readUsers(): Promise<User[]> {
    try {
      const content = await readFile(this.filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item) => {
        if (this.isUser(item)) {
          return new User(item);
        }

        throw new Error('Corrupted user storage file');
      });
    } catch (error: unknown) {
      if (this.isNodeError(error) && error.code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  private async writeUsers(users: ReadonlyArray<User>): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(users, null, 2), 'utf8');
  }

  private isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && 'code' in error;
  }

  // shouldn't `isUser` show that `value is User`? I believe that a User interface should be created
  private isUser(value: unknown): value is { id: string; name: string; email: string } {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      typeof candidate.email === 'string'
    );
  }
}
