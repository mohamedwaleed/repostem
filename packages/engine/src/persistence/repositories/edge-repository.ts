import { Knex } from 'knex';
import { DatabaseAdapter } from '../adapters';

/**
 * Dependency edge record type
 */
export interface EdgeRecord {
  snapshot_id: string;
  from_file: string;
  to_file: string;
}

/**
 * Data for creating an edge
 */
export interface CreateEdgeData {
  snapshotId: string;
  fromFile: string;
  toFile: string;
}

/**
 * Repository for dependency_edge table operations
 */
export class EdgeRepository {
  private knex: Knex;
  private static TABLE_NAME = 'dependency_edge';

  constructor(adapter: DatabaseAdapter) {
    this.knex = adapter.getKnex();
  }

  /**
   * Insert a single edge record
   * @param data - The edge data
   * @returns The created record
   */
  async insertEdge(data: CreateEdgeData): Promise<EdgeRecord> {
    const record: EdgeRecord = {
      snapshot_id: data.snapshotId,
      from_file: data.fromFile,
      to_file: data.toFile,
    };

    await this.knex(EdgeRepository.TABLE_NAME).insert(record);

    return record;
  }

  /**
   * Batch insert edge records
   * @param snapshotId - The snapshot ID
   * @param edges - Array of edge data (fromFile, toFile pairs)
   */
  async batchInsertEdges(
    snapshotId: string,
    edges: { fromFile: string; toFile: string }[]
  ): Promise<void> {
    if (edges.length === 0) return;

    const records = edges.map(edge => ({
      snapshot_id: snapshotId,
      from_file: edge.fromFile,
      to_file: edge.toFile,
    }));

    await this.knex(EdgeRepository.TABLE_NAME).insert(records);
  }

  /**
   * Get all edges for a snapshot
   * @param snapshotId - The snapshot ID
   * @returns Array of edge records
   */
  async getEdges(snapshotId: string): Promise<EdgeRecord[]> {
    const rows = await this.knex(EdgeRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId })
      .select('*');
    
    return rows as EdgeRecord[];
  }

  /**
   * Get outgoing edges from a file
   * @param snapshotId - The snapshot ID
   * @param fromFile - The source file path
   * @returns Array of edge records
   */
  async getOutgoingEdges(snapshotId: string, fromFile: string): Promise<EdgeRecord[]> {
    const rows = await this.knex(EdgeRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId, from_file: fromFile })
      .select('*');
    
    return rows as EdgeRecord[];
  }

  /**
   * Get incoming edges to a file
   * @param snapshotId - The snapshot ID
   * @param toFile - The target file path
   * @returns Array of edge records
   */
  async getIncomingEdges(snapshotId: string, toFile: string): Promise<EdgeRecord[]> {
    const rows = await this.knex(EdgeRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId, to_file: toFile })
      .select('*');
    
    return rows as EdgeRecord[];
  }

  /**
   * Count edges for a snapshot
   * @param snapshotId - The snapshot ID
   * @returns The count of edges
   */
  async countEdges(snapshotId: string): Promise<number> {
    const result = await this.knex(EdgeRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId })
      .count('* as count')
      .first();
    
    return Number(result?.count || 0);
  }

  /**
   * Check if an edge exists
   * @param snapshotId - The snapshot ID
   * @param fromFile - The source file path
   * @param toFile - The target file path
   * @returns True if edge exists
   */
  async edgeExists(snapshotId: string, fromFile: string, toFile: string): Promise<boolean> {
    const count = await this.knex(EdgeRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId, from_file: fromFile, to_file: toFile })
      .count('* as count')
      .first();
    
    return Number(count?.count || 0) > 0;
  }

  /**
   * Delete all edges for a snapshot
   * @param snapshotId - The snapshot ID
   */
  async deleteEdges(snapshotId: string): Promise<void> {
    await this.knex(EdgeRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId })
      .delete();
  }
}
