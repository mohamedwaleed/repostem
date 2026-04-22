import { DatabaseService } from './database-service';

export class UserService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  initialize(): void {
    this.db.connect();
  }

  getUser(id: string): any {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}
