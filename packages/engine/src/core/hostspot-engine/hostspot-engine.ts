import { FileMetrics } from "../../types";
import { computeImpact } from "../impact-engine/impact-engine";
import IGraph from "../dependency-graph/graph-implementations/graph-interface";

export const computeHotspotScores = (fileMetrics: Map<string, FileMetrics>, dependencyGraph: IGraph): Map<string, number> => {
    const hotspotScores = new Map<string, number>();
    
    for (const [filePath, metrics] of fileMetrics.entries()) {
        const fileImpact = computeImpact(dependencyGraph, filePath);
        const hotspotScore = 
            metrics.riskScore * 0.5 +
            fileImpact.impactRatio * 0.3 +
            metrics.churn * 0.15 +
            (metrics.circularDependency ? 0.05 : 0);
        
        hotspotScores.set(filePath, hotspotScore);
    }
    
    return hotspotScores;
};
