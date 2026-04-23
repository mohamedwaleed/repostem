import { Knex } from 'knex';
import { DatabaseAdapter } from './database-adapter.interface';
import knex from 'knex';

/**
 * SQLite database adapter implementation
 */
export class SQLiteAdapter implements DatabaseAdapter {
  private knex: Knex;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.knex = knex({
      client: 'sqlite3',
      connection: {
        filename: dbPath,
      },
      useNullAsDefault: true,
    });
  }

  getKnex(): Knex {
    return this.knex;
  }

  async connect(): Promise<void> {
    // Test the connection by running a simple query
    await this.knex.raw('SELECT 1');
  }

  async disconnect(): Promise<void> {
    await this.knex.destroy();
  }

  async runMigration(sql: string): Promise<void> {
    // SQLite can execute multiple statements in one raw call
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await this.knex.raw(statement);
    }
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (params) {
      const result = await this.knex.raw(sql, params);
      return result as T[];
    }
    const result = await this.knex.raw(sql);
    return result as T[];
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    if (params) {
      await this.knex.raw(sql, params);
    } else {
      await this.knex.raw(sql);
    }
  }

  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.knex.raw(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return result.length > 0;
  }
}
