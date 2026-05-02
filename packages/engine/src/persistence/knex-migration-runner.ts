import { DatabaseAdapter } from './adapters';
import * as path from 'path';

/**
 * Result of running Knex migrations
 */
export interface KnexMigrationResult {
  success: boolean;
  message: string;
  migrationsRun: string[];
}

/**
 * Run all pending Knex migrations
 * 
 * @param adapter - The database adapter to use
 * @returns KnexMigrationResult indicating success/failure and migrations run
 */
export async function runKnexMigrations(
  adapter: DatabaseAdapter
): Promise<KnexMigrationResult> {
  try {
    const knex = adapter.getKnex();
    
    const migrationConfig = {
      directory: path.join(__dirname, 'migrations'),
      extension: 'js',
      tableName: 'knex_migrations',
      loadExtensions: ['.js']
    };

    const [batchNo, migrations] = await knex.migrate.latest(migrationConfig);
    
    if (migrations.length === 0) {
      return {
        success: true,
        message: 'Database is already up to date. No migrations needed.',
        migrationsRun: []
      };
    }

    return {
      success: true,
      message: `Successfully ran ${migrations.length} migration(s) in batch ${batchNo}.`,
      migrationsRun: migrations
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during migration';
    return {
      success: false,
      message: `Migration failed: ${message}`,
      migrationsRun: []
    };
  }
}

/**
 * Check the current migration status
 * 
 * @param adapter - The database adapter to use
 * @returns Information about pending and completed migrations
 */
export async function getMigrationStatus(adapter: DatabaseAdapter): Promise<{
  completed: string[];
  pending: string[];
}> {
  const knex = adapter.getKnex();
  
  const migrationConfig = {
    directory: path.join(__dirname, 'migrations'),
    extension: 'js',
    tableName: 'knex_migrations',
    loadExtensions: ['.js']
  };

  const [completed, pending] = await knex.migrate.list(migrationConfig);
  
  return {
    completed: completed.map((m: any) => m.file || m),
    pending: pending.map((m: any) => m.file || m)
  };
}

/**
 * Rollback the last batch of migrations
 * 
 * @param adapter - The database adapter to use
 * @returns KnexMigrationResult indicating success/failure
 */
export async function rollbackMigrations(
  adapter: DatabaseAdapter
): Promise<KnexMigrationResult> {
  try {
    const knex = adapter.getKnex();
    
    const migrationConfig = {
      directory: path.join(__dirname, 'migrations'),
      extension: 'js',
      tableName: 'knex_migrations',
      loadExtensions: ['.js']
    };

    const [batchNo, migrations] = await knex.migrate.rollback(migrationConfig);
    
    if (migrations.length === 0) {
      return {
        success: true,
        message: 'No migrations to rollback.',
        migrationsRun: []
      };
    }

    return {
      success: true,
      message: `Successfully rolled back ${migrations.length} migration(s) from batch ${batchNo}.`,
      migrationsRun: migrations
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during rollback';
    return {
      success: false,
      message: `Rollback failed: ${message}`,
      migrationsRun: []
    };
  }
}
