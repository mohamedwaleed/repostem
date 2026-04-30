import { SnapshotAggregate, FileSnapshot, ProjectAnalysisResult } from "../types";
import { rankBy } from "../utils/common";

export function buildSnapshotSummary(
  snapshot: SnapshotAggregate
): ProjectAnalysisResult {
  const files = Array.from(snapshot.files.values());
  const rankFiles = (selector: (file: FileSnapshot) => number) =>
    rankBy(files, selector, 5).map(f => ({ file: f.path, score: selector(f) }));

  return {
    totalFiles: snapshot.files.size,
    totalDependencies: snapshot.edges.size,
    cycleCount: snapshot.cycles.length,
    topCentralFiles: rankFiles(f => f.metrics.centrality),
    highChurnFiles: rankFiles(f => f.metrics.churn),
    topRiskFiles: rankFiles(f => f.riskScore)
  };
}
