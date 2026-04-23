import { Knex } from 'knex';

/**
 * Database adapter interface for supporting multiple database backends
 */
export interface DatabaseAdapter {
  /**
   * Get the Knex instance for direct database operations
   */
  getKnex(): Knex;

  /**
   * Connect to the database
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the database
   */
  disconnect(): Promise<void>;

  /**
   * Run a raw SQL migration
   * @param sql - The SQL to execute
   */
  runMigration(sql: string): Promise<void>;

  /**
   * Execute a raw SQL query
   * @param sql - The SQL query
   * @param params - Optional parameters for prepared statements
   */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * Execute a raw SQL statement (for INSERT, UPDATE, DELETE)
   * @param sql - The SQL statement
   * @param params - Optional parameters for prepared statements
   */
  execute(sql: string, params?: any[]): Promise<void>;

  /**
   * Check if a table exists
   * @param tableName - The name of the table to check
   */
  tableExists(tableName: string): Promise<boolean>;
}
