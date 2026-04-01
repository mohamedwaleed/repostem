import { User, UserData } from '../models/user';
import { createLogger } from '../utils/logger';
import { DatabaseService } from './database-service';

export class UserService {
  private logger = createLogger('UserService');
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async createUser(userData: UserData): Promise<User> {
    this.logger.log(`Creating user: ${userData.email}`);
    
    const user = new User(userData);
    
    if (!user.validate()) {
      throw new Error('Invalid user data');
    }

    await this.db.save('users', user.getId(), userData);
    
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    this.logger.log(`Fetching user: ${id}`);
    const userData = await this.db.get('users', id);
    
    if (!userData) {
      return null;
    }

    return new User(userData as UserData);
  }

  async deleteUser(id: string): Promise<void> {
    this.logger.log(`Deleting user: ${id}`);
    await this.db.delete('users', id);
  }
}
