import { Knex } from 'knex';
import { DatabaseAdapter } from '../adapters';

/**
 * File snapshot record type
 */
export interface FileSnapshotRecord {
  snapshot_id: string;
  file_path: string;
  dependency_importance: number | null;
  connectivity: number | null;
  churn: number | null;
  risk_score: number | null;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  impact_count: number;
}

/**
 * Data for creating a file snapshot
 */
export interface CreateFileSnapshotData {
  snapshotId: string;
  filePath: string;
  dependencyImportance?: number | null;
  connectivity?: number | null;
  churn?: number | null;
  riskScore?: number | null;
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  impactCount?: number;
}

/**
 * Repository for file_snapshot table operations
 */
export class FileSnapshotRepository {
  private knex: Knex;
  private static TABLE_NAME = 'file_snapshot';

  constructor(adapter: DatabaseAdapter) {
    this.knex = adapter.getKnex();
  }

  /**
   * Insert a single file snapshot record
   * @param data - The file snapshot data
   * @returns The created record
   */
  async insertFileSnapshot(data: CreateFileSnapshotData): Promise<FileSnapshotRecord> {
    const record: FileSnapshotRecord = {
      snapshot_id: data.snapshotId,
      file_path: data.filePath,
      dependency_importance: data.dependencyImportance || null,
      connectivity: data.connectivity || null,
      churn: data.churn || null,
      risk_score: data.riskScore || null,
      risk_level: data.riskLevel || null,
      impact_count: data.impactCount || 0,
    };

    await this.knex(FileSnapshotRepository.TABLE_NAME).insert(record);

    return record;
  }

  /**
   * Batch insert file snapshot records
   * @param snapshotId - The snapshot ID
   * @param fileData - Array of file snapshot data
   */
  async batchInsertFileSnapshots(
    snapshotId: string,
    fileData: Omit<CreateFileSnapshotData, 'snapshotId'>[]
  ): Promise<void> {
    if (fileData.length === 0) return;

    const records = fileData.map(data => ({
      snapshot_id: snapshotId,
      file_path: data.filePath,
      dependency_importance: data.dependencyImportance || null,
      connectivity: data.connectivity || null,
      churn: data.churn || null,
      risk_score: data.riskScore || null,
      risk_level: data.riskLevel || null,
      impact_count: data.impactCount || 0,
    }));

    await this.knex(FileSnapshotRepository.TABLE_NAME).insert(records);
  }

  /**
   * Get all file snapshots for a snapshot
   * @param snapshotId - The snapshot ID
   * @returns Array of file snapshot records
   */
  async getFileSnapshots(snapshotId: string): Promise<FileSnapshotRecord[]> {
    const rows = await this.knex(FileSnapshotRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId })
      .select('*');
    
    return rows as FileSnapshotRecord[];
  }

  /**
   * Get a specific file snapshot
   * @param snapshotId - The snapshot ID
   * @param filePath - The file path
   * @returns The file snapshot record or undefined
   */
  async getFileSnapshot(
    snapshotId: string,
    filePath: string
  ): Promise<FileSnapshotRecord | undefined> {
    const rows = await this.knex(FileSnapshotRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId, file_path: filePath })
      .select('*');
    
    return rows[0] as FileSnapshotRecord | undefined;
  }

  /**
   * Get high risk files for a snapshot
   * @param snapshotId - The snapshot ID
   * @param threshold - Risk score threshold (default 0.6)
   * @returns Array of high risk file snapshot records
   */
  async getHighRiskFiles(
    snapshotId: string,
    threshold: number = 0.6
  ): Promise<FileSnapshotRecord[]> {
    const rows = await this.knex(FileSnapshotRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId })
      .where('risk_score', '>=', threshold)
      .orderBy('risk_score', 'desc')
      .select('*');
    
    return rows as FileSnapshotRecord[];
  }

  /**
   * Count file snapshots for a snapshot
   * @param snapshotId - The snapshot ID
   * @returns The count of file snapshots
   */
  async countFileSnapshots(snapshotId: string): Promise<number> {
    const result = await this.knex(FileSnapshotRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId })
      .count('* as count')
      .first();
    
    return Number(result?.count || 0);
  }

  /**
   * Delete all file snapshots for a snapshot
   * @param snapshotId - The snapshot ID
   */
  async deleteFileSnapshots(snapshotId: string): Promise<void> {
    await this.knex(FileSnapshotRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId })
      .delete();
  }
}
