import * as fs from 'fs';
import * as path from 'path';
import { DatabaseAdapter } from './adapters';

/**
 * Result of running a migration
 */
export interface MigrationResult {
  success: boolean;
  message: string;
  tablesCreated: string[];
}

/**
 * Tables that should be created by the init migration
 */
const EXPECTED_TABLES = [
  'repo',
  'snapshot',
  'file_snapshot',
  'dependency_edge',
  'cycle',
];

/**
 * Run the init schema migration
 * This is idempotent - it checks if tables exist before creating
 * 
 * @param adapter - The database adapter to use
 * @param sqlFilePath - Optional path to the SQL file (defaults to schema/001_init_schema.sql)
 * @returns MigrationResult indicating success/failure and tables created
 */
export async function runInitMigration(
  adapter: DatabaseAdapter,
  sqlFilePath?: string
): Promise<MigrationResult> {
  try {
    // Check which tables already exist
    const existingTables: string[] = [];
    const tablesToCreate: string[] = [];

    for (const table of EXPECTED_TABLES) {
      const exists = await adapter.tableExists(table);
      if (exists) {
        existingTables.push(table);
      } else {
        tablesToCreate.push(table);
      }
    }

    // If all tables exist, migration is already complete
    if (existingTables.length === EXPECTED_TABLES.length) {
      return {
        success: true,
        message: 'All tables already exist. Migration skipped.',
        tablesCreated: [],
      };
    }

    // Read the SQL file
    const migrationPath = sqlFilePath || path.join(__dirname, 'schema', '001_init_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Run the migration
    await adapter.runMigration(sql);

    // Verify tables were created
    const createdTables: string[] = [];
    for (const table of tablesToCreate) {
      const exists = await adapter.tableExists(table);
      if (exists) {
        createdTables.push(table);
      }
    }

    return {
      success: true,
      message: `Migration completed successfully. Created ${createdTables.length} new tables.`,
      tablesCreated: createdTables,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during migration';
    return {
      success: false,
      message: `Migration failed: ${message}`,
      tablesCreated: [],
    };
  }
}

/**
 * Check if the database schema is initialized
 * 
 * @param adapter - The database adapter to use
 * @returns boolean indicating if all required tables exist
 */
export async function isSchemaInitialized(adapter: DatabaseAdapter): Promise<boolean> {
  for (const table of EXPECTED_TABLES) {
    const exists = await adapter.tableExists(table);
    if (!exists) {
      return false;
    }
  }
  return true;
}
