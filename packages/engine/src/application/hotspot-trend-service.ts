import { HotspotTrendItem, HotspotTrendServiceOptions } from '../types';
import { withServiceContext } from '../utils/service-context';
import { FileSnapshotRepository, EdgeRepository, CycleRepository } from '../persistence/repositories';
import { reconstructSnapshot } from '../persistence/snapshot-reconstructor';
import { computeHotspotTrends } from '../core/hostspot-engine/hotspot-trend-engine';
import { ProgressEmitter } from '../utils/progress-emitter';

export async function calculateHotspotTrends(
  options: HotspotTrendServiceOptions = {},
  trendThreshold: number = 0.05,
  limit: number = 5,
  progressEmitter?: ProgressEmitter
): Promise<HotspotTrendItem[]> {
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
        throw new Error('Not enough snapshots to calculate trends. At least 2 snapshots are required.');
      }
    } else {
      const lastTwoSnapshots = context.branch
        ? await context.repo.getSnapshotsByBranch(context.config.repo_id, context.branch, 2)
        : await context.repo.getRecentSnapshots(context.config.repo_id);

      if (lastTwoSnapshots.length < 2) {
        throw new Error('Not enough snapshots to calculate trends. At least 2 snapshots are required.');
      }

      snapshotRecord2 = lastTwoSnapshots[0];
      snapshotRecord1 = lastTwoSnapshots[1];
    }

    const fileSnapshotRepo = new FileSnapshotRepository(context.adapter);
    const edgeRepo = new EdgeRepository(context.adapter);
    const cycleRepo = new CycleRepository(context.adapter);

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

    return computeHotspotTrends(previousSnapshot, currentSnapshot, trendThreshold, limit);
  });
}
