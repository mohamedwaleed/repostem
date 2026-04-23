import { Knex } from 'knex';
import { DatabaseAdapter } from './database-adapter.interface';
import knex from 'knex';

/**
 * PostgreSQL database adapter implementation
 */
export class PostgreSQLAdapter implements DatabaseAdapter {
  private knex: Knex;
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
    this.knex = knex({
      client: 'pg',
      connection: connectionString,
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
    // PostgreSQL can execute multiple statements in one raw call
    // Filter out SQLite-specific PRAGMA statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.toUpperCase().startsWith('PRAGMA'));

    for (const statement of statements) {
      await this.knex.raw(statement);
    }
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (params) {
      const result = await this.knex.raw(sql, params);
      return result.rows;
    }
    const result = await this.knex.raw(sql);
    return result.rows;
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
      "SELECT to_regclass(?) as name",
      [tableName]
    );
    return result.rows.length > 0 && result.rows[0].name !== null;
  }
}
