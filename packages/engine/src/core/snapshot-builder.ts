import { SnapshotAggregate, FileSnapshot, FileMetrics, Language } from "../types";
import parseRepository from "./parser/parser";
import { buildDependencyGraph } from "./dependency-graph/dependency-graph";
import { computeMetrics } from "./metrics-engine/metrics-engine";
import { computeRisk } from "./risk-engine/risk-engine";
import { detectBranch, detectCommitHash, detectDirtyState } from "../utils/git";
import IGraph from "./dependency-graph/graph-implementations/graph-interface";
import { ProgressEmitter, emitProgress } from "../utils/progress-emitter";
export async function buildSnapshot(repoPath: string, progressEmitter?: ProgressEmitter): Promise<SnapshotAggregate> {
    // Parse repository files
    const structuredDependenciesData = parseRepository(repoPath, { language: Language.typescript }, progressEmitter);
    
    // Build dependency graph
    emitProgress(progressEmitter, 'graph:building', undefined);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    emitProgress(progressEmitter, 'graph:built', { totalEdges: dependencyGraph.getEdges().size });
    
    // Compute metrics
    emitProgress(progressEmitter, 'metrics:computing', undefined);
    const fileMetrics = await computeMetrics(dependencyGraph);
    emitProgress(progressEmitter, 'metrics:computed', { totalFiles: fileMetrics.size });
    
    // Detect cycles
    emitProgress(progressEmitter, 'cycles:detecting', undefined);
    const cycles = dependencyGraph.detectCycles();
    emitProgress(progressEmitter, 'cycles:detected', { cycleCount: cycles.length });
    
    // Compute risk
    emitProgress(progressEmitter, 'risk:computing', undefined);
    const fileSnapshots = buildFileSnapshots(dependencyGraph, fileMetrics, progressEmitter);
    emitProgress(progressEmitter, 'risk:computed', { totalFiles: fileSnapshots.size });
    
    return {
        repositoryRoot: repoPath,
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

function buildFileSnapshots(dependencyGraph: IGraph, fileMetrics: Map<string, FileMetrics>, progressEmitter?: ProgressEmitter): Map<string, FileSnapshot> {
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