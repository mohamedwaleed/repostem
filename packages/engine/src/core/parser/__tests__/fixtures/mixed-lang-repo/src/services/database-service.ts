export class DatabaseService {
  connect(): void {
    console.log('Connected to database');
  }

  query(sql: string): any {
    console.log(`Executing query: ${sql}`);
    return { id: 1, name: 'John Doe' };
  }
}
