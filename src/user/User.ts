export interface UserProps {
  id: string;
  name: string;
  email: string;
}

export class User {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;

  public constructor({ id, name, email }: UserProps) {
    if (!name || name.trim().length < 2) {
      throw new Error('Name must contain at least 2 characters');
    }

    if (!email || !email.includes('@')) {
      throw new Error('Email is invalid');
    }

    this.id = id;
    this.name = name.trim();
    this.email = email.trim().toLowerCase();
  }
}
