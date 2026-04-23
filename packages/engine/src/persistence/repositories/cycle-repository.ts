import { Knex } from 'knex';
import { DatabaseAdapter } from '../adapters';

/**
 * Cycle record type
 */
export interface CycleRecord {
  id: string;
  snapshot_id: string;
  nodes: string; // JSON stringified array of file paths
}

/**
 * Data for creating a cycle
 */
export interface CreateCycleData {
  id: string;
  snapshotId: string;
  nodes: string[];
}

/**
 * Parsed cycle with nodes as array
 */
export interface ParsedCycle {
  id: string;
  snapshotId: string;
  nodes: string[];
}

/**
 * Repository for cycle table operations
 */
export class CycleRepository {
  private knex: Knex;
  private static TABLE_NAME = 'cycle';

  constructor(adapter: DatabaseAdapter) {
    this.knex = adapter.getKnex();
  }

  /**
   * Insert a single cycle record
   * @param data - The cycle data
   * @returns The created record
   */
  async insertCycle(data: CreateCycleData): Promise<CycleRecord> {
    const record: CycleRecord = {
      id: data.id,
      snapshot_id: data.snapshotId,
      nodes: JSON.stringify(data.nodes),
    };

    await this.knex(CycleRepository.TABLE_NAME).insert(record);

    return record;
  }

  /**
   * Batch insert cycle records
   * @param snapshotId - The snapshot ID
   * @param cycles - Array of node arrays (each array represents one cycle)
   * @param idGenerator - Function to generate IDs (default: crypto.randomUUID)
   */
  async batchInsertCycles(
    snapshotId: string,
    cycles: string[][],
    idGenerator: () => string = () => crypto.randomUUID()
  ): Promise<void> {
    if (cycles.length === 0) return;

    const records = cycles.map(nodes => ({
      id: idGenerator(),
      snapshot_id: snapshotId,
      nodes: JSON.stringify(nodes),
    }));

    await this.knex(CycleRepository.TABLE_NAME).insert(records);
  }

  /**
   * Get all cycles for a snapshot
   * @param snapshotId - The snapshot ID
   * @returns Array of parsed cycle records
   */
  async getCycles(snapshotId: string): Promise<ParsedCycle[]> {
    const rows = await this.knex(CycleRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId })
      .select('*');
    
    return rows.map(row => ({
      id: row.id,
      snapshotId: row.snapshot_id,
      nodes: JSON.parse(row.nodes),
    }));
  }

  /**
   * Get a specific cycle by ID
   * @param id - The cycle ID
   * @returns The parsed cycle record or undefined
   */
  async getCycleById(id: string): Promise<ParsedCycle | undefined> {
    const rows = await this.knex(CycleRepository.TABLE_NAME)
      .where({ id })
      .select('*');
    
    if (!rows[0]) return undefined;

    return {
      id: rows[0].id,
      snapshotId: rows[0].snapshot_id,
      nodes: JSON.parse(rows[0].nodes),
    };
  }

  /**
   * Count cycles for a snapshot
   * @param snapshotId - The snapshot ID
   * @returns The count of cycles
   */
  async countCycles(snapshotId: string): Promise<number> {
    const result = await this.knex(CycleRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId })
      .count('* as count')
      .first();
    
    return Number(result?.count || 0);
  }

  /**
   * Find cycles that contain a specific file
   * @param snapshotId - The snapshot ID
   * @param filePath - The file path to search for
   * @returns Array of parsed cycles containing the file
   */
  async getCyclesContainingFile(snapshotId: string, filePath: string): Promise<ParsedCycle[]> {
    const cycles = await this.getCycles(snapshotId);
    return cycles.filter(cycle => cycle.nodes.includes(filePath));
  }

  /**
   * Delete all cycles for a snapshot
   * @param snapshotId - The snapshot ID
   */
  async deleteCycles(snapshotId: string): Promise<void> {
    await this.knex(CycleRepository.TABLE_NAME)
      .where({ snapshot_id: snapshotId })
      .delete();
  }

  /**
   * Delete a specific cycle by ID
   * @param id - The cycle ID
   */
  async deleteCycleById(id: string): Promise<void> {
    await this.knex(CycleRepository.TABLE_NAME).where({ id }).delete();
  }
}
