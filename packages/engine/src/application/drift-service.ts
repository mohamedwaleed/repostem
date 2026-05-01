import { DriftResult, DriftServiceOptions, SnapshotAggregate, MetricClassification } from '../types';
import { withServiceContext } from '../utils/service-context';
import { detectDrift as detectDriftEngine } from '../temporal/drift-engine/drift-engine';
import { FileSnapshotRepository, EdgeRepository, CycleRepository } from '../persistence/repositories';

/**
 * Reconstructs a SnapshotAggregate from database records
 */
async function reconstructSnapshot(
  snapshotRecord: any,
  fileSnapshotRepo: FileSnapshotRepository,
  edgeRepo: EdgeRepository,
  cycleRepo: CycleRepository
): Promise<SnapshotAggregate> {
  // Load file snapshots
  const fileRecords = await fileSnapshotRepo.getFileSnapshots(snapshotRecord.id);
  const filesMap = new Map();
  
  for (const fileRecord of fileRecords) {
    filesMap.set(fileRecord.file_path, {
      path: fileRecord.file_path,
      metrics: {
        centrality: fileRecord.dependency_importance || 0,
        coupling: fileRecord.connectivity || 0,
        churn: fileRecord.churn || 0,
        circularDependency: 0 // Will be set based on cycles
      },
      riskScore: fileRecord.risk_score || 0,
      riskLevel: (fileRecord.risk_level as MetricClassification) || MetricClassification.LOW
    });
  }

  // Load edges
  const edgeRecords = await edgeRepo.getEdges(snapshotRecord.id);
  const edgesMap = new Map<string, Set<string>>();
  
  for (const edge of edgeRecords) {
    if (!edgesMap.has(edge.from_file)) {
      edgesMap.set(edge.from_file, new Set());
    }
    edgesMap.get(edge.from_file)!.add(edge.to_file);
  }

  // Load cycles
  const cycleRecords = await cycleRepo.getCycles(snapshotRecord.id);
  const cycles = cycleRecords.map(cycle => ({ nodes: cycle.nodes }));
  
  // Mark files in cycles
  const filesInCycles = new Set<string>();
  for (const cycle of cycles) {
    for (const node of cycle.nodes) {
      filesInCycles.add(node);
    }
  }
  
  // Update circular dependency metric for files in cycles
  for (const filePath of filesInCycles) {
    const fileSnapshot = filesMap.get(filePath);
    if (fileSnapshot) {
      fileSnapshot.metrics.circularDependency = 1;
    }
  }

  return {
    repositoryRoot: snapshotRecord.repository_root || '',
    metadata: {
      branch: snapshotRecord.branch,
      commitHash: snapshotRecord.commit_hash,
      dirty: snapshotRecord.working_tree_dirty,
      createdAt: snapshotRecord.created_at
    },
    summary: {
      totalFiles: snapshotRecord.total_files || filesMap.size,
      totalDependencies: edgeRecords.length,
      cycleCount: snapshotRecord.cycle_count || cycles.length
    },
    files: filesMap,
    edges: edgesMap,
    cycles
  };
}

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
