import { UserService } from '../services/user-service';
import { UserData } from '../models/user';
import { createLogger } from '../utils/logger';

export class UserController {
  private logger = createLogger('UserController');
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  async handleCreateUser(requestData: any): Promise<any> {
    try {
      this.logger.log('Handling create user request');
      
      const userData: UserData = {
        id: requestData.id || this.generateId(),
        email: requestData.email,
        name: requestData.name,
        createdAt: new Date(),
      };

      const user = await this.userService.createUser(userData);
      
      return {
        success: true,
        data: {
          id: user.getId(),
          email: user.getEmail(),
          name: user.getName(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to create user: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleGetUser(id: string): Promise<any> {
    try {
      this.logger.log(`Handling get user request: ${id}`);
      const user = await this.userService.getUser(id);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        data: {
          id: user.getId(),
          email: user.getEmail(),
          name: user.getName(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get user: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
