import { Validator } from '../utils/validator';
import { createLogger } from '../utils/logger';

export interface UserData {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export class User {
  private validator: Validator;
  private data: UserData;

  constructor(data: UserData) {
    this.validator = new Validator(createLogger('User'));
    this.data = data;
  }

  validate(): boolean {
    return (
      this.validator.validateRequired(this.data.id, 'id') &&
      this.validator.validateRequired(this.data.name, 'name') &&
      this.validator.validateEmail(this.data.email)
    );
  }

  getId(): string {
    return this.data.id;
  }

  getEmail(): string {
    return this.data.email;
  }

  getName(): string {
    return this.data.name;
  }
}
