import { UserController } from './controllers/user-controller';
import { UserService } from './services/user-service';
import { DatabaseService } from './services/database-service';
import { CacheService } from './services/cache-service';
import { createLogger } from './utils/logger';
import type { Type } from 'typescript';

export class App {
  private logger = createLogger('App');
  private userController: UserController;

  constructor() {
    const cache = new CacheService(3600);
    const db = new DatabaseService(cache);
    const userService = new UserService(db);
    this.userController = new UserController(userService);
  }

  async start(): Promise<void> {
    this.logger.log('Application starting...');
    
    const result = await this.userController.handleCreateUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    this.logger.log(`User created: ${JSON.stringify(result)}`);
  }

  async stop(): Promise<void> {
    this.logger.log('Application stopping...');
  }
}

const app = new App();
app.start().catch(console.error);
