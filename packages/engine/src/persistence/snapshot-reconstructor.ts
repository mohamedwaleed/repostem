import { SnapshotAggregate, MetricClassification } from '../types';
import { FileSnapshotRepository, EdgeRepository, CycleRepository, SnapshotRecord } from './repositories';

/**
 * Reconstructs a SnapshotAggregate from database records.
 * 
 * This utility loads all related data (file snapshots, edges, cycles) from the database
 * and rebuilds the in-memory SnapshotAggregate structure used by the drift engine and
 * other analysis components.
 * 
 * @param snapshotRecord - The snapshot record from the database
 * @param fileSnapshotRepo - Repository for loading file snapshots
 * @param edgeRepo - Repository for loading dependency edges
 * @param cycleRepo - Repository for loading cycles
 * @returns A fully reconstructed SnapshotAggregate
 */
export async function reconstructSnapshot(
  snapshotRecord: SnapshotRecord,
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
