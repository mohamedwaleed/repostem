import { SnapshotAggregate, FileSnapshot, FileMetrics, ProjectAnalysisResult } from "../types";
import parseRepository from "./parser/parser";
import { buildDependencyGraph } from "./dependency-graph/dependency-graph";
import { computeMetrics } from "./metrics-engine/metrics-engine";
import { computeRisk } from "./risk-engine/risk-engine";
import { detectBranch, detectCommitHash, detectDirtyState } from "../utils/git";
import IGraph from "./dependency-graph/graph-implementations/graph-interface";
import { rankBy } from "../utils/common";

export async function buildSnapshot(repoPath: string): Promise<SnapshotAggregate> {
    const structuredDependenciesData = parseRepository(repoPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    const fileMetrics = await computeMetrics(dependencyGraph);
    const cycles = dependencyGraph.detectCycles();
    
    const fileSnapshots = buildFileSnapshots(dependencyGraph, fileMetrics);
    
    return {
        metadata: {
            branch: await detectBranch(repoPath),
            commitHash: await detectCommitHash(repoPath),
            dirty: await detectDirtyState(repoPath),
            createdAt: new Date()
        },
        summary: {
            totalFiles: dependencyGraph.getNodes().size,
            totalDependencies: dependencyGraph.getEdges().size,
            cycleCount: cycles.length
        },
        files: fileSnapshots,
        edges: dependencyGraph.getEdges(),
        cycles
    };
}

function buildFileSnapshots(dependencyGraph: IGraph, fileMetrics: Map<string, FileMetrics>): Map<string, FileSnapshot> {
    const fileRiskResults = computeRisk(fileMetrics);
    const snapshots = new Map<string, FileSnapshot>();
    
    for (const riskResult of fileRiskResults) {
        const metrics = fileMetrics.get(riskResult.file)!;

        snapshots.set(riskResult.file, {
            path: riskResult.file,
            metrics,
            riskScore: riskResult.riskScore,
            riskLevel: riskResult.riskLevel
        });
    }
    
    return snapshots;
}

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