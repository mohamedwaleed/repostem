import { Knex } from 'knex';
import { DatabaseAdapter } from '../adapters';

/**
 * Snapshot record type
 */
export interface SnapshotRecord {
  id: string;
  repo_id: string;
  repository_root: string | null;
  git_remote_url: string | null;
  branch: string | null;
  commit_hash: string | null;
  working_tree_dirty: boolean;
  total_files: number | null;
  cycle_count: number | null;
  created_at: Date;
}

/**
 * Data for creating a new snapshot
 */
export interface CreateSnapshotData {
  id: string;
  repoId: string;
  repositoryRoot?: string | null;
  gitRemoteUrl?: string | null;
  branch?: string | null;
  commitHash?: string | null;
  workingTreeDirty?: boolean;
  totalFiles?: number | null;
  cycleCount?: number | null;
}

/**
 * Repository for snapshot table operations
 */
export class SnapshotRepository {
  private knex: Knex;
  private static TABLE_NAME = 'snapshot';

  constructor(adapter: DatabaseAdapter) {
    this.knex = adapter.getKnex();
  }

  /**
   * Create a new snapshot record
   * @param data - The snapshot data
   * @returns The created snapshot record
   */
  async createSnapshot(data: CreateSnapshotData): Promise<SnapshotRecord> {
    const record: SnapshotRecord = {
      id: data.id,
      repo_id: data.repoId,
      repository_root: data.repositoryRoot || null,
      git_remote_url: data.gitRemoteUrl || null,
      branch: data.branch || null,
      commit_hash: data.commitHash || null,
      working_tree_dirty: data.workingTreeDirty || false,
      total_files: data.totalFiles || null,
      cycle_count: data.cycleCount || null,
      created_at: new Date(),
    };

    await this.knex(SnapshotRepository.TABLE_NAME).insert({
      id: record.id,
      repo_id: record.repo_id,
      repository_root: record.repository_root,
      git_remote_url: record.git_remote_url,
      branch: record.branch,
      commit_hash: record.commit_hash,
      working_tree_dirty: record.working_tree_dirty,
      total_files: record.total_files,
      cycle_count: record.cycle_count,
      created_at: record.created_at,
    });

    return record;
  }

  /**
   * Get a snapshot by ID
   * @param id - The snapshot ID
   * @returns The snapshot record or undefined if not found
   */
  async getSnapshotById(repoId: string, id: string): Promise<SnapshotRecord | undefined> {
    const rows = await this.knex(SnapshotRepository.TABLE_NAME)
      .where({ repo_id: repoId, id })
      .select('*');
    
    return rows[0] as SnapshotRecord | undefined;
  }

  /**
   * Get the latest snapshot for a repo
   * @param repoId - The repo ID
   * @returns The latest snapshot record or undefined if not found
   */
  async getLatestSnapshot(repoId: string): Promise<SnapshotRecord | undefined> {
    const rows = await this.knex(SnapshotRepository.TABLE_NAME)
      .where({ repo_id: repoId })
      .orderBy('created_at', 'desc')
      .limit(1)
      .select('*');
    
    return rows[0] as SnapshotRecord | undefined;
  }

  /**
   * Get the two most recent snapshots for a repo (for drift comparison)
   * @param repoId - The repo ID
   * @returns Array of up to 2 snapshot records (most recent first)
   */
  async getRecentSnapshots(repoId: string): Promise<SnapshotRecord[]> {
    const rows = await this.knex(SnapshotRepository.TABLE_NAME)
      .where({ repo_id: repoId })
      .orderBy('created_at', 'desc')
      .limit(2)
      .select('*');
    
    return rows as SnapshotRecord[];
  }

  /**
   * Get all snapshots for a repo
   * @param repoId - The repo ID
   * @param limit - Optional limit for the number of snapshots to return
   * @returns Array of snapshot records
   */
  async getSnapshotsByRepoId(repoId: string, limit?: number): Promise<SnapshotRecord[]> {
    const query = this.knex(SnapshotRepository.TABLE_NAME)
      .where({ repo_id: repoId })
      .orderBy('created_at', 'desc');
    
    if (limit) {
      query.limit(limit);
    }
    
    const rows = await query.select('*');
    
    return rows as SnapshotRecord[];
  }

  /**
   * Get snapshots by branch
   * @param repoId - The repo ID
   * @param branch - The branch name
   * @param limit - Optional limit for the number of snapshots to return
   * @returns Array of snapshot records
   */
  async getSnapshotsByBranch(repoId: string, branch: string, limit?: number): Promise<SnapshotRecord[]> {
    const query = this.knex(SnapshotRepository.TABLE_NAME)
      .where({ repo_id: repoId, branch })
      .orderBy('created_at', 'desc');
    
    if (limit) {
      query.limit(limit);
    }
    
    const rows = await query.select('*');
    
    return rows as SnapshotRecord[];
  }

  /**
   * Get a snapshot by branch and ID
   * @param repoId - The repo ID
   * @param branch - The branch name
   * @param id - The snapshot ID
   * @returns The snapshot record or undefined if not found
   */
  async getSnapshotByBranchAndId(repoId: string, branch: string, id: string): Promise<SnapshotRecord | undefined> {
    const rows = await this.knex(SnapshotRepository.TABLE_NAME)
      .where({ repo_id: repoId, branch, id })
      .select('*');
    
    return rows[0] as SnapshotRecord | undefined;
  }

  /**
   * Count snapshots for a repo
   * @param repoId - The repo ID
   * @returns The count of snapshots
   */
  async countSnapshots(repoId: string): Promise<number> {
    const result = await this.knex(SnapshotRepository.TABLE_NAME)
      .where({ repo_id: repoId })
      .count('* as count')
      .first();
    
    return Number(result?.count || 0);
  }

  /**
   * Delete a snapshot by ID (cascades to related tables)
   * @param id - The snapshot ID
   */
  async deleteSnapshot(id: string): Promise<void> {
    await this.knex(SnapshotRepository.TABLE_NAME).where({ id }).delete();
  }
}
