import { classify } from "../../utils/classify";
import { FileMetrics, FileRiskResult } from "../../types";

const WEIGHTS = {
    centrality: 0.3,
    coupling: 0.25,
    circularDependency: 0.25,
    churn: 0.2,
};

export const computeFileRisk = (filePath: string, fileMetrics: FileMetrics): FileRiskResult => {
    const riskScore = 
        WEIGHTS.centrality * fileMetrics.centrality +
        WEIGHTS.coupling * fileMetrics.coupling +
        WEIGHTS.circularDependency * fileMetrics.circularDependency +
        WEIGHTS.churn * fileMetrics.churn;
    
    return {
        file: filePath,
        riskScore,
        riskLevel: classify(riskScore),
    };
};

export const computeRisk = (fileMetrics: Map<string, FileMetrics>): Array<FileRiskResult> => {
    const results: Array<FileRiskResult> = [];
    
    for (const [filePath, metrics] of fileMetrics.entries()) {
        const riskScore = 
            WEIGHTS.centrality * metrics.centrality +
            WEIGHTS.coupling * metrics.coupling +
            WEIGHTS.circularDependency * metrics.circularDependency +
            WEIGHTS.churn * metrics.churn;
        
        results.push({
            file: filePath,
            riskScore,
            riskLevel: classify(riskScore),
        });
    }
    
    return results;
};
