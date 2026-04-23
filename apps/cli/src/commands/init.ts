import { Command } from "commander";
import inquirer from "inquirer";
import { 
  initializeRepo, 
  isRepoInitialized, 
  checkConfigFile, 
  StorageType, 
  resetPersistence, 
  getConfig,
  AdapterFactory,
  RepoRepository
} from "@repostem/engine";
import path from "path";
import { InitOptions } from "../types";

const STORAGE_TYPE_SQLITE = "sqlite";
const STORAGE_TYPE_POSTGRESQL = "postgresql";
const DEFAULT_SQLITE_PATH = ".repostem.db";

/**
 * Check if repository is already initialized and show menu
 */
async function handleExistingConfig(repoPath: string): Promise<string | null> {
  const configExists = checkConfigFile(repoPath);
  const alreadyInitialized = isRepoInitialized(repoPath);

  if (configExists && alreadyInitialized) {
    const config = getConfig(repoPath);
    
    // Validate that repo_id exists in database
    if (config.repo_id && config.storage_type && config.storage_path) {
      const repoIdExists = await validateRepoIdExists(config.repo_id, config.storage_type, config.storage_path);
      
      if (!repoIdExists) {
        console.log("Warning: Config file exists but repo_id not found in database.");
        console.log("This may indicate a corrupted or incomplete initialization.");
        const { reinit } = await inquirer.prompt([
          {
            type: "confirm",
            name: "reinit",
            message: "Would you like to reinitialize the repository?",
            default: true,
          },
        ]);
        
        if (reinit) {
          return "reconfigure";
        } else {
          return "cancel";
        }
      }
    }
    
    console.log("This project is already initialized.");
    
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Options:",
        choices: [
          { name: "Reconfigure storage backend", value: "reconfigure" },
          { name: "Reset persistence (delete existing snapshots)", value: "reset" },
          { name: "Cancel", value: "cancel" },
        ],
      },
    ]);

    return action;
  }

  return null;
}

/**
 * Validate that a repo_id exists in the database
 */
async function validateRepoIdExists(repoId: string, storageType: StorageType, storagePath: string): Promise<boolean> {
  try {
    const adapter = AdapterFactory.createAdapterFromString(storageType, storagePath);
    await adapter.connect();
    
    const repoRepository = new RepoRepository(adapter);
    const repo = await repoRepository.getRepoById(repoId);
    
    await adapter.disconnect();
    
    return repo !== undefined;
  } catch (error) {
    return false;
  }
}

/**
 * Collect storage type from flag or prompt
 */
async function collectStorageType(storageFlag?: string): Promise<StorageType> {
  if (storageFlag) {
    const normalized = storageFlag.toLowerCase();
    if (normalized !== STORAGE_TYPE_SQLITE && normalized !== STORAGE_TYPE_POSTGRESQL) {
      console.error(`Invalid storage type: ${storageFlag}. Must be '${STORAGE_TYPE_SQLITE}' or '${STORAGE_TYPE_POSTGRESQL}'.`);
      process.exit(1);
    }
    return normalized as StorageType;
  }

  const { selectedStorage } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedStorage",
      message: "Select storage type:",
      choices: [
        { name: "SQLite (local file)", value: STORAGE_TYPE_SQLITE },
        { name: "PostgreSQL (remote database)", value: STORAGE_TYPE_POSTGRESQL },
      ],
      default: STORAGE_TYPE_SQLITE,
    },
  ]);

  return selectedStorage as StorageType;
}

/**
 * Collect storage path from flag or prompt based on storage type
 */
async function collectStoragePath(
  repoPath: string,
  storageType: StorageType,
  dbPathFlag?: string
): Promise<string> {
  if (dbPathFlag) {
    return dbPathFlag;
  }

  if (storageType === STORAGE_TYPE_SQLITE) {
    const defaultPath = path.join(repoPath, DEFAULT_SQLITE_PATH);
    const { dbPathInput } = await inquirer.prompt([
      {
        type: "input",
        name: "dbPathInput",
        message: "Enter SQLite database path:",
        default: defaultPath,
        validate: (input: string) => {
          if (!input.trim()) {
            return "Path cannot be empty";
          }
          return true;
        },
      },
    ]);
    return dbPathInput;
  } else {
    const { connectionString } = await inquirer.prompt([
      {
        type: "input",
        name: "connectionString",
        message: "Enter PostgreSQL connection string (e.g., postgresql://user:password@localhost:5432/dbname):",
        validate: (input: string) => {
          if (!input.trim()) {
            return "Connection string cannot be empty";
          }
          if (!input.startsWith("postgresql://") && !input.startsWith("postgres://")) {
            return "Connection string must start with postgresql:// or postgres://";
          }
          return true;
        },
      },
    ]);
    return connectionString;
  }
}

/**
 * Normalize storage path to absolute for SQLite
 */
function normalizeStoragePath(repoPath: string, storageType: StorageType, storagePath: string): string {
  if (storageType === STORAGE_TYPE_SQLITE && !path.isAbsolute(storagePath)) {
    return path.resolve(repoPath, storagePath);
  }
  return storagePath;
}

/**
 * Initialize repository and display results
 */
async function performInitialization(
  repoPath: string,
  storageType: StorageType,
  storagePath: string,
  repoId?: string
): Promise<void> {
  console.log(`\nInitializing repository...`);
  console.log(`  Repository: ${repoPath}`);
  console.log(`  Storage: ${storageType}`);
  console.log(`  Path: ${storagePath}\n`);

  const result = await initializeRepo(repoPath, {
    storageType,
    storagePath,
    repoId,
  });

  if (result.success) {
    console.log("Success! Repository initialized for persistence.");
    console.log(`\n${result.message}`);
    console.log(`\nConfiguration saved to: ${path.join(repoPath, ".repostem.json")}`);
  } else {
    console.error("Initialization failed:", result.message);
    process.exit(1);
  }
}

export default new Command()
  .name("init")
  .description("Initialize repository for snapshot persistence with SQLite or PostgreSQL")
  .option("-r, --repo <path>", "Path to repository")
  .option("-s, --storage <type>", "Storage type (sqlite or postgresql)")
  .option("-p, --db-path <path>", "Database path (for SQLite) or connection string (for PostgreSQL)")
  .action(async (options: InitOptions) => {
    const repoPath = options.repo || process.cwd();

    try {
      const action = await handleExistingConfig(repoPath);

      if (action === "cancel") {
        console.log("Operation cancelled.");
        return;
      }

      if (action === "reset") {
        const { confirmReset } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirmReset",
            message: "This will delete all existing snapshots. Are you sure?",
            default: false,
          },
        ]);

        if (!confirmReset) {
          console.log("Reset cancelled.");
          return;
        }

        try {
          const result = await resetPersistence(repoPath);
          console.log(result.message);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Error resetting persistence: ${message}`);
          process.exit(1);
        }
        return;
      }

      // For both new init and reconfigure
      const storageType = await collectStorageType(options.storage);
      let storagePath = await collectStoragePath(repoPath, storageType, options.dbPath);
      storagePath = normalizeStoragePath(repoPath, storageType, storagePath);

      // Get existing repo_id if reconfiguring
      let repoId: string | undefined;
      if (action === "reconfigure") {
        const config = getConfig(repoPath);
        repoId = config.repo_id;
      }

      await performInitialization(
        repoPath,
        storageType,
        storagePath,
        repoId
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
