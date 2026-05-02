import { buildDependencyGraphFromSnapshot } from "../core/dependency-graph/dependency-graph";
import IGraph from "../core/dependency-graph/graph-implementations/graph-interface";
import { SnapshotAggregate } from "../types";

/**
 * Calculate architecture complexity score for a snapshot.
 * 
 * Formula:
 * complexity_score = 0.3 * edge_density + 0.4 * cycle_ratio + 0.3 * avg_connectivity
 * 
 * - edge_density: ratio of actual edges to maximum possible edges
 * - cycle_ratio: proportion of files involved in cycles
 * - avg_connectivity: mean of normalized (inDegree + outDegree) / (2 * (totalFiles - 1))
 */
export const calculateComplexityScore = (dependencyGraph: IGraph): number => {
    const totalFiles = dependencyGraph.getNodes().size;
    
    if (totalFiles <= 1) return 0;

    // Edge density: ratio of actual edges to maximum possible edges
    const totalEdges = dependencyGraph.getTotalEdgeCount();
    const maxPossibleEdges = totalFiles * (totalFiles - 1);
    const edgeDensity = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;

    // Cycle ratio: proportion of files involved in cycles
    const filesInCycles = dependencyGraph.getNodesInCycles();
    const cycleRatio = totalFiles > 0 ? filesInCycles.size / totalFiles : 0;

    // Average connectivity: mean of (inDegree + outDegree) normalized
    const avgConnectivity = dependencyGraph.getAverageConnectivity();

    // Weighted complexity score
    return 0.3 * edgeDensity + 0.4 * cycleRatio + 0.3 * avgConnectivity;
};