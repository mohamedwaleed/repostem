import { Knex } from 'knex';
import { DatabaseAdapter } from '../adapters';

/**
 * Repository record type
 */
export interface RepoRecord {
  id: string;
  root_path: string;
  created_at: Date;
}

/**
 * Repository for repo table operations
 */
export class RepoRepository {
  private knex: Knex;
  private static TABLE_NAME = 'repo';

  constructor(adapter: DatabaseAdapter) {
    this.knex = adapter.getKnex();
  }

  /**
   * Create a new repo record
   * @param id - The UUID for the repo
   * @param rootPath - The root path of the repository
   * @returns The created repo record
   */
  async createRepo(id: string, rootPath: string): Promise<RepoRecord> {
    const record: RepoRecord = {
      id,
      root_path: rootPath,
      created_at: new Date(),
    };

    await this.knex(RepoRepository.TABLE_NAME).insert({
      id: record.id,
      root_path: record.root_path,
      created_at: record.created_at,
    });

    return record;
  }

  /**
   * Get a repo by ID
   * @param id - The repo ID
   * @returns The repo record or undefined if not found
   */
  async getRepoById(id: string): Promise<RepoRecord | undefined> {
    const rows = await this.knex(RepoRepository.TABLE_NAME)
      .where({ id })
      .select('*');
    
    return rows[0] as RepoRecord | undefined;
  }

  /**
   * Get a repo by root path
   * @param rootPath - The root path of the repository
   * @returns The repo record or undefined if not found
   */
  async getRepoByRootPath(rootPath: string): Promise<RepoRecord | undefined> {
    const rows = await this.knex(RepoRepository.TABLE_NAME)
      .where({ root_path: rootPath })
      .select('*');
    
    return rows[0] as RepoRecord | undefined;
  }

  /**
   * Check if a repo exists by root path
   * @param rootPath - The root path of the repository
   * @returns True if repo exists
   */
  async repoExists(rootPath: string): Promise<boolean> {
    const count = await this.knex(RepoRepository.TABLE_NAME)
      .where({ root_path: rootPath })
      .count('* as count')
      .first();
    
    return Number(count?.count || 0) > 0;
  }

  /**
   * Delete a repo by ID (cascades to all related tables)
   * @param id - The repo ID
   */
  async deleteRepo(id: string): Promise<void> {
    await this.knex(RepoRepository.TABLE_NAME).where({ id }).delete();
  }
}
