import { FileAnalysis } from "../types";

const WEIGHTS = {
    centrality: 0.3,
    coupling: 0.25,
    circularDependency: 0.25,
    churn: 0.2,
};

export const computeRisk = (fileMetrics: Map<string, Record<string, number>>): FileAnalysis[] => {
    const files = Array.from(fileMetrics.keys());
    return files.map((file) => {
        const metrics = fileMetrics.get(file)!;
        const risk = 
            WEIGHTS.centrality * metrics.centrality +
            WEIGHTS.coupling * metrics.coupling +
            WEIGHTS.circularDependency * metrics.circularDependency +
            WEIGHTS.churn * metrics.churn;
        
        return {
            risk,
            metrics,
        };
    });
};
