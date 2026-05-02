import {
    DriftResult,
    DriftSnapshotInfo,
    SnapshotAggregate,
    RiskChangeItem,
    ImpactChangeItem,
    Cycle,
    DependencyChangeSummary,
    CycleChangeSummary,
    ComplexityScoreChange,
    HotspotItem,
    HotspotChangeSummary,
    FileMetrics
} from "../../types";
import { calculateComplexityScore } from "../../repository-metrics/complexity-score";
import IGraph from "../../core/dependency-graph/graph-implementations/graph-interface";
import { buildDependencyGraphFromSnapshot } from "../../core/dependency-graph/dependency-graph";
import { computeImpact } from "../../core/impact-engine/impact-engine";
import { computeHotspotScores } from "../../core/hostspot-engine/hostspot-engine";

export const detectDrift = (
    snapshot1: SnapshotAggregate,
    snapshot2: SnapshotAggregate,
    thresholds: { riskDelta: number; impactDeltaRatio: number, hotspotThreshold?: number } = { riskDelta: 0.05, impactDeltaRatio: 0.05, hotspotThreshold: 0.25 }
): DriftResult => {
    const snapshotDependencyGraph1 = buildDependencyGraphFromSnapshot(snapshot1);
    const snapshotDependencyGraph2 = buildDependencyGraphFromSnapshot(snapshot2);
    // Detect complexity score change
    const complexityScoreChange = detectComplexityScoreChange(snapshotDependencyGraph1, snapshotDependencyGraph2);

    // Detect risk changes (filtered by threshold)
    const riskChanges = detectRiskChanges(snapshot1, snapshot2, thresholds.riskDelta);

    // Detect impact changes (filtered by threshold)
    const impactChanges = detectImpactChanges(
        snapshot1,
        snapshot2,
        thresholds.impactDeltaRatio,
        snapshotDependencyGraph1,
        snapshotDependencyGraph2
    );

    // Detect dependency changes
    const dependencyChanges = detectDependencyChanges(snapshot1, snapshot2);

    // Detect cycle changes
    const cycleChanges = detectCycleChanges(snapshot1, snapshot2);

    const hotspotChanges = detectHotspotChanges(
        snapshot1,
        snapshot2,
        snapshotDependencyGraph1,
        snapshotDependencyGraph2,
        thresholds.hotspotThreshold
    );
    
    return {
        previousSnapshot: createDriftSnapshotInfo(snapshot1),
        currentSnapshot: createDriftSnapshotInfo(snapshot2),
        riskChanges,
        impactChanges,
        dependencyChanges,
        cycleChanges,
        complexityScoreChange,
        hotspotChanges
    };
};

const createDriftSnapshotInfo = (snapshot: SnapshotAggregate): DriftSnapshotInfo => ({
    commitHash: snapshot.metadata.commitHash,
    dirty: snapshot.metadata.dirty,
    date: snapshot.metadata.createdAt
});

const detectComplexityScoreChange = (
    snapshotDependencyGraph1: IGraph,
    snapshotDependencyGraph2: IGraph
): ComplexityScoreChange => {
    const previousComplexityScore = calculateComplexityScore(snapshotDependencyGraph1);
    const currentComplexityScore = calculateComplexityScore(snapshotDependencyGraph2);
    return {
        previousComplexityScore,
        currentComplexityScore,
        delta: currentComplexityScore - previousComplexityScore
    };
};

const detectRiskChanges = (
    snapshot1: SnapshotAggregate,
    snapshot2: SnapshotAggregate,
    threshold: number
): DriftResult['riskChanges'] => {
    const items: RiskChangeItem[] = [];
    let increasedCount = 0;
    let decreasedCount = 0;

    for (const [filePath, file2] of snapshot2.files) {
        const file1 = snapshot1.files.get(filePath);
        if (!file1) continue;

        const delta = file2.riskScore - file1.riskScore;
        if (Math.abs(delta) > threshold) {
            items.push({
                file: filePath,
                previousRisk: file1.riskScore,
                currentRisk: file2.riskScore,
                delta
            });
            if (delta > 0) increasedCount++;
            else decreasedCount++;
        }
    }

    return { increasedCount, decreasedCount, items };
};

const detectImpactChanges = (
    snapshot1: SnapshotAggregate,
    snapshot2: SnapshotAggregate,
    threshold: number,
    snapshotDependencyGraph1: IGraph,
    snapshotDependencyGraph2: IGraph
): DriftResult['impactChanges'] => {
    const items: ImpactChangeItem[] = [];
    let increasedCount = 0;

    // Pre-compute impact for all files in both snapshots
    const impactMap1 = new Map<string, number>();
    const impactMap2 = new Map<string, number>();
    
    for (const [filePath, _] of snapshot1.files) {
        const impact = computeImpact(snapshotDependencyGraph1, filePath);
        impactMap1.set(filePath, impact.impactRatio);
    }
    
    for (const [filePath, _] of snapshot2.files) {
        const impact = computeImpact(snapshotDependencyGraph2, filePath);
        impactMap2.set(filePath, impact.impactRatio);
    }

    // Compare pre-computed impact values
    for (const [filePath, _] of snapshot2.files) {
        const file1 = snapshot1.files.get(filePath);
        if (!file1) continue;

        const prevImpactRatio = impactMap1.get(filePath) ?? 0;
        const currImpactRatio = impactMap2.get(filePath) ?? 0;
        const delta = currImpactRatio - prevImpactRatio;

        if (Math.abs(delta) > threshold) {
            items.push({
                file: filePath,
                previousImpactRatio: prevImpactRatio,
                currentImpactRatio: currImpactRatio,
                delta
            });
            if (delta > 0) increasedCount++;
        }
    }

    return { increasedCount, items };
};

const detectDependencyChanges = (
    snapshot1: SnapshotAggregate,
    snapshot2: SnapshotAggregate
): DependencyChangeSummary => {
    let newEdges = 0;
    let removedEdges = 0;

    // Count new edges
    for (const [from, toSet] of snapshot2.edges) {
        const prevToSet = snapshot1.edges.get(from);
        if (!prevToSet) {
            newEdges += toSet.size;
        } else {
            for (const to of toSet) {
                if (!prevToSet.has(to)) {
                    newEdges++;
                }
            }
        }
    }

    // Count removed edges
    for (const [from, toSet] of snapshot1.edges) {
        const currToSet = snapshot2.edges.get(from);
        if (!currToSet) {
            removedEdges += toSet.size;
        } else {
            for (const to of toSet) {
                if (!currToSet.has(to)) {
                    removedEdges++;
                }
            }
        }
    }

    return { newEdges, removedEdges };
};

const detectCycleChanges = (
    snapshot1: SnapshotAggregate,
    snapshot2: SnapshotAggregate
): CycleChangeSummary => {
    const newCycles: Cycle[] = [];
    const resolvedCycles: Cycle[] = [];

    // Helper to create a cycle key for comparison
    const cycleKey = (cycle: Cycle): string => {
        return [...cycle.nodes].sort().join('|');
    };

    const prevCycleKeys = new Set(snapshot1.cycles.map(cycleKey));
    const currCycleKeys = new Set(snapshot2.cycles.map(cycleKey));

    // Find new cycles
    for (const cycle of snapshot2.cycles) {
        if (!prevCycleKeys.has(cycleKey(cycle))) {
            newCycles.push(cycle);
        }
    }

    // Find resolved cycles
    for (const cycle of snapshot1.cycles) {
        if (!currCycleKeys.has(cycleKey(cycle))) {
            resolvedCycles.push(cycle);
        }
    }

    return { newCycles, resolvedCycles };
};

const detectHotspotChanges = (
    snapshot1: SnapshotAggregate,
    snapshot2: SnapshotAggregate,
    snapshotDependencyGraph1: IGraph,
    snapshotDependencyGraph2: IGraph,
    hotspotThreshold: number = 0.25
): HotspotChangeSummary => {
    const newHotspots: HotspotItem[] = [];
    const resolvedHotspots: HotspotItem[] = [];

    // Extract metrics from snapshots
    const metrics1 = new Map<string, FileMetrics>();
    for (const [filePath, fileSnapshot] of snapshot1.files) {
        metrics1.set(filePath, fileSnapshot.metrics);
    }

    const metrics2 = new Map<string, FileMetrics>();
    for (const [filePath, fileSnapshot] of snapshot2.files) {
        metrics2.set(filePath, fileSnapshot.metrics);
    }

    // Compute hotspot scores for both snapshots
    const hotspotScores1 = computeHotspotScores(metrics1, snapshotDependencyGraph1);
    const hotspotScores2 = computeHotspotScores(metrics2, snapshotDependencyGraph2);

    // Check all files in current snapshot
    for (const [filePath, currentScore] of hotspotScores2) {
        const previousScore = hotspotScores1.get(filePath) ?? 0;
        const wasHotspot = previousScore >= hotspotThreshold;
        const isHotspot = currentScore >= hotspotThreshold;

        // New hotspot: wasn't a hotspot before, but is now
        if (!wasHotspot && isHotspot) {
            newHotspots.push({
                file: filePath,
                currentHotspotScore: currentScore,
                previousHotspotScore: previousScore,
                delta: currentScore - previousScore
            });
        }
    }

    // Check all files in previous snapshot for resolved hotspots
    for (const [filePath, previousScore] of hotspotScores1) {
        const currentScore = hotspotScores2.get(filePath) ?? 0;
        const wasHotspot = previousScore >= hotspotThreshold;
        const isHotspot = currentScore >= hotspotThreshold;

        // Resolved hotspot: was a hotspot before, but isn't now
        if (wasHotspot && !isHotspot) {
            resolvedHotspots.push({
                file: filePath,
                currentHotspotScore: currentScore,
                previousHotspotScore: previousScore,
                delta: currentScore - previousScore
            });
        }
    }

    return { newHotspots, resolvedHotspots };
};
