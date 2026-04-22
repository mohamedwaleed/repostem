import { UserService } from './services/user-service';
import { Logger } from './utils/logger';
import './js-module';

export class App {
  private userService: UserService;
  private logger: Logger;

  constructor() {
    this.userService = new UserService();
    this.logger = new Logger();
  }

  start(): void {
    this.logger.log('Application started');
    this.userService.initialize();
  }
}
