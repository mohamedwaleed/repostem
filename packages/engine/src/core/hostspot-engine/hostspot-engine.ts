import { FileMetrics, Hotspot, SnapshotAggregate } from "../../types";
import { computeImpact } from "../impact-engine/impact-engine";
import IGraph from "../dependency-graph/graph-implementations/graph-interface";
import { computeFileRisk } from "../risk-engine/risk-engine";
import { buildDependencyGraphFromSnapshot } from "../dependency-graph/dependency-graph";

export const computeHotspots = (fileMetrics: Map<string, FileMetrics>, dependencyGraph: IGraph): Map<string, Hotspot> => {
    const hotspotScores = new Map<string, Hotspot>();
    for (const [filePath, metrics] of fileMetrics.entries()) {
        const fileImpact = computeImpact(dependencyGraph, filePath);
        const fileRisk = computeFileRisk(filePath, {
            centrality: metrics.centrality,
            coupling: metrics.coupling,
            circularDependency: metrics.circularDependency,
            churn: metrics.churn,
        });
        const hotspotScore = 
            fileRisk.riskScore * 0.5 +
            fileImpact.impactRatio * 0.3 +
            metrics.churn * 0.15 +
            (metrics.circularDependency ? 0.05 : 0);
        hotspotScores.set(filePath, {
            file: filePath,
            riskScore: fileRisk.riskScore,
            impactRatio: fileImpact.impactRatio,
            churn: metrics.churn,
            circularDependency: metrics.circularDependency,
            hotspotScore: hotspotScore
        });
    }
    
    return hotspotScores;
};


export const computeHotspotsFromSnapshot = (snapshot: SnapshotAggregate) => {
    const fileMetrics: Map<string, FileMetrics> = new Map();
    for (const [filePath, fileSnapshot] of snapshot.files.entries()) {
        fileMetrics.set(filePath, fileSnapshot.metrics);
    }
    const dependencyGraph = buildDependencyGraphFromSnapshot(snapshot);
    return computeHotspots(fileMetrics, dependencyGraph);
};