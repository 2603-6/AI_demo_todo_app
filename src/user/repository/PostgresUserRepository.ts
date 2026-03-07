import { Pool } from 'pg';
import { User } from '../User';
import { UserRepositoryPort } from '../UserRepositoryPort';

interface UserRow {
  id: string;
  name: string;
  email: string;
}

export class PostgresUserRepository extends UserRepositoryPort {
  private readonly pool: Pool;

  public constructor(pool: Pool) {
    super();
    this.pool = pool;
  }

  public async save(user: User): Promise<User> {
    await this.pool.query(
      `
      INSERT INTO users (id, name, email)
      VALUES ($1, $2, $3)
      `,
      [user.id, user.name, user.email],
    );

    return user;
  }

  public async findAll(): Promise<User[]> {
    const result = await this.pool.query<UserRow>(
      `
      SELECT id, name, email
      FROM users
      ORDER BY created_at ASC
      `,
    );

    return result.rows.map((row) => new User(row));
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await this.pool.query<{ exists: boolean }>(
      `
      SELECT EXISTS(
        SELECT 1
        FROM users
        WHERE email = $1
      ) AS exists
      `,
      [normalizedEmail],
    );

    return result.rows[0]?.exists ?? false;
  }
}
