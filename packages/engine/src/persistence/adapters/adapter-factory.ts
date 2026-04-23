import { DatabaseAdapter } from './database-adapter.interface';
import { SQLiteAdapter } from './sqlite-adapter';
import { PostgreSQLAdapter } from './postgresql-adapter';

/**
 * Enum for supported database types
 */
export enum DatabaseType {
  SQLite = 'sqlite',
  PostgreSQL = 'postgresql',
}

/**
 * Factory for creating database adapters
 */
export class AdapterFactory {
  /**
   * Create a database adapter based on the database type
   * @param type - The type of database (SQLite or PostgreSQL)
   * @param connectionString - Connection string or file path
   * @returns DatabaseAdapter instance
   */
  static createAdapter(type: DatabaseType, connectionString: string): DatabaseAdapter {
    switch (type) {
      case DatabaseType.SQLite:
        return new SQLiteAdapter(connectionString);
      case DatabaseType.PostgreSQL:
        return new PostgreSQLAdapter(connectionString);
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  /**
   * Create a database adapter from a string type
   * @param type - The type as a string ('sqlite' or 'postgresql')
   * @param connectionString - Connection string or file path
   * @returns DatabaseAdapter instance
   */
  static createAdapterFromString(type: string, connectionString: string): DatabaseAdapter {
    const normalizedType = type.toLowerCase();
    
    if (normalizedType === 'sqlite') {
      return this.createAdapter(DatabaseType.SQLite, connectionString);
    }
    
    if (normalizedType === 'postgresql' || normalizedType === 'postgres') {
      return this.createAdapter(DatabaseType.PostgreSQL, connectionString);
    }
    
    throw new Error(`Unsupported database type: ${type}. Supported types: sqlite, postgresql`);
  }
}
