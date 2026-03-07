import { User } from './User';

export abstract class UserRepositoryPort {
  public abstract save(user: User): Promise<User>;
  public abstract findAll(): Promise<User[]>;
  public abstract existsByEmail(email: string): Promise<boolean>;
}
