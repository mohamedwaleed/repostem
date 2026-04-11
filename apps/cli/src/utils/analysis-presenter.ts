import { ProjectAnalysisResult } from "@repostem/engine";

export interface EnrichedProjectAnalysis extends ProjectAnalysisResult {
  architectureSignals: string[];
}

export function enrichProjectAnalysis(result: ProjectAnalysisResult): EnrichedProjectAnalysis {
  const signals: string[] = [];
  
  if (result.cycleCount > 0) {
    signals.push(`${result.cycleCount} circular dependency group${result.cycleCount > 1 ? 's' : ''} detected`);
  }
  
  const highRiskCount = result.topRiskFiles.filter(f => f.score > 0.7).length;
  if (highRiskCount > 0) {
    signals.push(`${highRiskCount} file${highRiskCount > 1 ? 's' : ''} exceed 0.7 risk threshold`);
  }
  
  const highChurnCount = result.highChurnFiles.filter(f => f.score > 0.8).length;
  if (highChurnCount > 0) {
    signals.push(`${highChurnCount} file${highChurnCount > 1 ? 's' : ''} with high churn (>0.8)`);
  }

  if (signals.length === 0) {
    signals.push("No critical architecture issues detected");
  }

  return {
    ...result,
    architectureSignals: signals
  };
}
