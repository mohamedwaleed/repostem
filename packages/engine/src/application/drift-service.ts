import { SnapshotAggregate } from '../types';

/**
 * Compare the two most recent snapshots to detect architectural drift
 */
export async function detectDrift(_repoPath: string): Promise<SnapshotAggregate | null> {
  throw new Error("Not implemented");
}
