import { DriftResult, DriftServiceOptions } from '../types';
import { withServiceContext } from '../utils/service-context';
import { detectDrift as detectDriftEngine } from '../temporal/drift-engine/drift-engine';
import { FileSnapshotRepository, EdgeRepository, CycleRepository } from '../persistence/repositories';
import { reconstructSnapshot } from '../persistence/snapshot-reconstructor';

/**
 * Compare two snapshots to detect architectural drift
 */
export async function detectDrift(options: DriftServiceOptions = {}): Promise<DriftResult | null> {
  return withServiceContext(options, async (context) => {
    let snapshotRecord1, snapshotRecord2;
    
    if (options.since) {
      snapshotRecord1 = context.branch 
        ? await context.repo.getSnapshotByBranchAndId(context.config.repo_id, context.branch, options.since)
        : await context.repo.getSnapshotById(context.config.repo_id, options.since);
      
      const latestSnapshot = context.branch
        ? await context.repo.getSnapshotsByBranch(context.config.repo_id, context.branch, 1)
        : await context.repo.getRecentSnapshots(context.config.repo_id);
      
      snapshotRecord2 = latestSnapshot[0];
      
      if (!snapshotRecord1 || !snapshotRecord2) {
        throw new Error('Not enough snapshots to detect drift, it needs at least 2 snapshots in the current branch or repository');
      }
    } else {
      const lastTwoSnapshots = context.branch
        ? await context.repo.getSnapshotsByBranch(context.config.repo_id, context.branch, 2)
        : await context.repo.getRecentSnapshots(context.config.repo_id);

      if (lastTwoSnapshots.length < 2) {
        throw new Error('Not enough snapshots to detect drift, it needs at least 2 snapshots in the current branch or repository');
      }
      
      snapshotRecord2 = lastTwoSnapshots[0]; // Most recent (current)
      snapshotRecord1 = lastTwoSnapshots[1]; // Previous
    }

    // Create repository instances for loading related data
    const fileSnapshotRepo = new FileSnapshotRepository(context.adapter);
    const edgeRepo = new EdgeRepository(context.adapter);
    const cycleRepo = new CycleRepository(context.adapter);

    // Reconstruct SnapshotAggregate from database records
    const previousSnapshot = await reconstructSnapshot(
      snapshotRecord1,
      fileSnapshotRepo,
      edgeRepo,
      cycleRepo
    );
    
    const currentSnapshot = await reconstructSnapshot(
      snapshotRecord2,
      fileSnapshotRepo,
      edgeRepo,
      cycleRepo
    );

    // Compare them using the drift engine
    const result = detectDriftEngine(previousSnapshot, currentSnapshot);

    return result;
  });
}
