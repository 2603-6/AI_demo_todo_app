import { Collection, Db, MongoClient } from 'mongodb';
import { User } from '../User';
import { UserRepositoryPort } from '../UserRepositoryPort';

interface UserDocument {
  _id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export class MongoDBUserRepository extends UserRepositoryPort {
  private readonly client: MongoClient;
  private readonly dbName: string;

  public constructor(client: MongoClient, dbName: string) {
    super();
    this.client = client;
    this.dbName = dbName;
  }

  public async save(user: User): Promise<User> {
    const collection = await this.getCollection();

    await collection.insertOne({
      _id: user.id,
      name: user.name,
      email: user.email,
      createdAt: new Date(),
    });

    return user;
  }

  public async findAll(): Promise<User[]> {
    const collection = await this.getCollection();

    const documents = await collection
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    return documents.map((doc) => new User({
      id: doc._id,
      name: doc.name,
      email: doc.email,
    }));
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const collection = await this.getCollection();
    const normalized = email.trim().toLowerCase();

    const count = await collection.countDocuments({ email: normalized });
    return count > 0;
  }

  private async getCollection(): Promise<Collection<UserDocument>> {
    await this.client.connect();
    const db: Db = this.client.db(this.dbName);
    return db.collection<UserDocument>('users');
  }
}
