import { ProjectAnalysisResult, getMetricLabel, classify } from "@repostem/engine";

export interface EnrichedProjectAnalysis extends ProjectAnalysisResult {
  architectureSignals: string[];
}

export function enrichProjectAnalysis(result: ProjectAnalysisResult): EnrichedProjectAnalysis {
  const signals: string[] = [];
  
  if (result.cycleCount > 0) {
    signals.push(`${result.cycleCount} ${getMetricLabel('circularDependency').toLowerCase()} group${result.cycleCount > 1 ? 's' : ''} detected`);
  }
  
  const highRiskCount = result.topRiskFiles.filter(f => f.score > 0.7).length;
  if (highRiskCount > 0) {
    const riskLevel = classify(0.7);
    signals.push(`${highRiskCount} file${highRiskCount > 1 ? 's' : ''} with ${riskLevel.toLowerCase()} ${getMetricLabel('riskScore').toLowerCase()} (>0.7)`);
  }
  
  const highChurnCount = result.highChurnFiles.filter(f => f.score > 0.8).length;
  if (highChurnCount > 0) {
    const churnLevel = classify(0.8);
    signals.push(`${highChurnCount} file${highChurnCount > 1 ? 's' : ''} with ${churnLevel.toLowerCase()} ${getMetricLabel('churn').toLowerCase()} (>0.8)`);
  }
  
  const highCentralityCount = result.topCentralFiles.filter(f => f.score > 0.3).length;
  if (highCentralityCount > 0) {
    const centralityLevel = classify(0.3);
    signals.push(`${highCentralityCount} file${highCentralityCount > 1 ? 's' : ''} with ${centralityLevel.toLowerCase()} ${getMetricLabel('centrality').toLowerCase()} (>0.3)`);
  }

  if (signals.length === 0) {
    signals.push("No critical architecture issues detected");
  }

  return {
    ...result,
    architectureSignals: signals
  };
}
