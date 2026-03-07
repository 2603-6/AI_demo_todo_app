import { randomUUID } from 'node:crypto';
import { User } from '../User';
import { UserRepositoryPort } from '../UserRepositoryPort';

export interface CreateUserInput {
  name: string;
  email: string;
}

export class UserService {
  public constructor(private readonly userRepository: UserRepositoryPort) {}

  public async createUser({ name, email }: CreateUserInput): Promise<User> {
    const exists = await this.userRepository.existsByEmail(email);
    if (exists) {
      throw new Error('Email already exists');
    }

    const user = new User({
      id: randomUUID(),
      name,
      email,
    });

    return this.userRepository.save(user);
  }

  public async listUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
