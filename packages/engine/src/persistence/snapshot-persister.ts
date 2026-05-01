import { DatabaseAdapter } from "./adapters";
import { SnapshotAggregate } from "../types";
import { SnapshotRepository, FileSnapshotRepository, EdgeRepository, CycleRepository } from "./repositories";
import { AdapterFactory } from "./adapters";
import { getConfig, isPersistenceConfigured, checkConfigFile } from "../config/config-loader";

export interface PersistResult {
  snapshotId?: string;
  persisted: boolean;
  warning?: string;
}

/**
 * Attempt to persist a snapshot to the database
 * 
 * Handles config validation, connection management, and error handling.
 * Returns a result object indicating success/failure and any warning message.
 * 
 * @param repoPath - The repository path
 * @param snapshot - The snapshot aggregate to persist
 * @returns PersistResult with snapshotId, persisted status, and optional warning
 */
export async function tryPersistSnapshot(
  repoPath: string,
  snapshot: SnapshotAggregate
): Promise<PersistResult> {
  const configExists = checkConfigFile(repoPath);
  const persistenceConfigured = isPersistenceConfigured(repoPath);

  if (!configExists || !persistenceConfigured) {
    return {
      persisted: false,
      warning: "Snapshot will not be persisted. Run 'repostem init' to configure persistence."
    };
  }

  const config = getConfig(repoPath);
  const { storage_type, storage_path, repo_id } = config;

  if (!storage_type || !storage_path || !repo_id) {
    return {
      persisted: false,
      warning: "Snapshot will not be persisted. Storage configuration is incomplete."
    };
  }

  const adapter = AdapterFactory.createAdapterFromString(storage_type, storage_path);

  try {
    await adapter.connect();
    const snapshotId = await persistSnapshot(adapter, repo_id, snapshot);
    await adapter.disconnect();

    return {
      snapshotId,
      persisted: true
    };
  } catch (error) {
    try {
      await adapter.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    return {
      persisted: false,
      warning: `Failed to persist snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Persist a complete snapshot to the database
 * 
 * @param adapter - The database adapter
 * @param repoId - The repository ID
 * @param snapshot - The snapshot aggregate to persist
 * @returns The generated snapshot ID
 */
export async function persistSnapshot(
  adapter: DatabaseAdapter,
  repoId: string,
  snapshot: SnapshotAggregate
): Promise<string> {
  const snapshotId = crypto.randomUUID();

  const snapshotRepository = new SnapshotRepository(adapter);
  const fileSnapshotRepository = new FileSnapshotRepository(adapter);
  const edgeRepository = new EdgeRepository(adapter);
  const cycleRepository = new CycleRepository(adapter);

  // Create snapshot record
  await snapshotRepository.createSnapshot({
    id: snapshotId,
    repoId,
    repositoryRoot: snapshot.repositoryRoot,
    branch: snapshot.metadata.branch,
    commitHash: snapshot.metadata.commitHash,
    workingTreeDirty: snapshot.metadata.dirty,
    totalFiles: snapshot.summary.totalFiles,
    cycleCount: snapshot.summary.cycleCount
  });

  // Batch insert file snapshots (chunked to avoid SQLite compound SELECT limit)
  const fileData = Array.from(snapshot.files.values()).map(f => ({
    filePath: f.path,
    dependencyImportance: f.metrics.centrality,
    connectivity: f.metrics.coupling,
    churn: f.metrics.churn,
    riskScore: f.riskScore,
    riskLevel: f.riskLevel.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW'
  }));
  
  const CHUNK_SIZE = 500;
  for (let i = 0; i < fileData.length; i += CHUNK_SIZE) {
    const chunk = fileData.slice(i, i + CHUNK_SIZE);
    await fileSnapshotRepository.batchInsertFileSnapshots(snapshotId, chunk);
  }

  // Batch insert edges (chunked)
  const edges: { fromFile: string; toFile: string }[] = [];
  for (const [fromFile, toFiles] of snapshot.edges.entries()) {
    for (const toFile of toFiles) {
      edges.push({ fromFile, toFile });
    }
  }
  for (let i = 0; i < edges.length; i += CHUNK_SIZE) {
    const chunk = edges.slice(i, i + CHUNK_SIZE);
    await edgeRepository.batchInsertEdges(snapshotId, chunk);
  }

  // Batch insert cycles (chunked)
  const cycles = snapshot.cycles.map(c => c.nodes);
  for (let i = 0; i < cycles.length; i += CHUNK_SIZE) {
    const chunk = cycles.slice(i, i + CHUNK_SIZE);
    await cycleRepository.batchInsertCycles(snapshotId, chunk, () => crypto.randomUUID());
  }

  return snapshotId;
}
