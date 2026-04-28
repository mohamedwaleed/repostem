import { AdapterFactory } from "../persistence/adapters";
import { runInitMigration } from "../persistence/migrations";
import { RepoRepository, SnapshotRepository } from "../persistence/repositories";
import { getConfig, updateConfigFile, isPersistenceConfigured } from "../config/config-loader";
import { InitRepoOptions, InitRepoResult, ResetPersistenceResult } from "../types";

/**
 * Initialize a repository for persistence
 * 
 * @param repositoryRoot - The root path of the repository
 * @param options - Initialization options (storageType, storagePath)
 * @returns InitRepoResult with repoId and config
 */
export async function initializeRepo(
  repositoryRoot: string,
  options: InitRepoOptions
): Promise<InitRepoResult> {
  const { storageType, storagePath, repoId: existingRepoId } = options;

  const adapter = AdapterFactory.createAdapterFromString(storageType, storagePath);

  try {
    await adapter.connect();

    const migrationResult = await runInitMigration(adapter);

    if (!migrationResult.success) {
      throw new Error(`Migration failed: ${migrationResult.message}`);
    }

    const repoRepository = new RepoRepository(adapter);
    let repoId: string;

    if (existingRepoId) {
      repoId = existingRepoId;
      
      const existingRepo = await repoRepository.getRepoById(repoId);
      
      if (!existingRepo) {
        await repoRepository.createRepo(repoId, repositoryRoot);
      }
    } else {
      repoId = crypto.randomUUID();
      await repoRepository.createRepo(repoId, repositoryRoot);
    }

    updateConfigFile(repositoryRoot, {
      storage_type: storageType,
      storage_path: storagePath,
      repo_id: repoId,
    });

    const updatedConfig = getConfig(repositoryRoot);

    await adapter.disconnect();

    return {
      success: true,
      repoId,
      config: updatedConfig,
      migrationResult,
      message: `Repository initialized successfully.\n` +
        `Repo ID: ${repoId}\n` +
        `Storage: ${storageType} at ${storagePath}\n` +
        `Tables created: ${migrationResult.tablesCreated.length}`,
    };
  } catch (error) {
    try {
      await adapter.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    throw error;
  }
}

/**
 * Check if a repository is initialized for persistence
 * 
 * @param repositoryRoot - The root path of the repository
 * @returns True if persistence is configured
 */
export function isRepoInitialized(repositoryRoot: string): boolean {
  return isPersistenceConfigured(repositoryRoot);
}

/**
 * Reset persistence by deleting all snapshots for a repository
 * This keeps the repo record but deletes all associated snapshots and their data
 * 
 * @param repositoryRoot - The root path of the repository
 * @returns ResetPersistenceResult indicating success and number of snapshots deleted
 */
export async function resetPersistence(repositoryRoot: string): Promise<ResetPersistenceResult> {
  const config = getConfig(repositoryRoot);

  if (!config.storage_type || !config.storage_path || !config.repo_id) {
    throw new Error("Repository is not properly initialized for persistence.");
  }

  const adapter = AdapterFactory.createAdapterFromString(config.storage_type, config.storage_path);

  try {
    await adapter.connect();

    const snapshotRepository = new SnapshotRepository(adapter);
    const snapshots = await snapshotRepository.getSnapshotsByRepoId(config.repo_id);

    const snapshotCount = snapshots.length;

    for (const snapshot of snapshots) {
      await snapshotRepository.deleteSnapshot(snapshot.id);
    }

    await adapter.disconnect();

    return {
      success: true,
      message: `Successfully reset persistence. Deleted ${snapshotCount} snapshot(s).`,
      snapshotsDeleted: snapshotCount,
    };
  } catch (error) {
    try {
      await adapter.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    throw error;
  }
}
