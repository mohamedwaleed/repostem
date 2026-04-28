import parseRepository from "../core/parser/parser";
import { buildDependencyGraph } from "../core/dependency-graph/dependency-graph";
import { computeFileMetrics } from "../core/metrics-engine/metrics-engine";
import { computeFileRisk } from "../core/risk-engine/risk-engine";
import { computeImpact } from "../core/impact-engine/impact-engine";
import { buildSnapshot, buildSnapshotSummary } from "../core/snapshot-builder";
import { tryPersistSnapshot } from "../persistence/snapshot-persister";
import { explainImpactIntent, explainRiskIntent } from "../ai-explanation-layer/intent-router";
import { 
  AnalyzeRepositoryResult, 
  Cycle, 
  FileImpactResult, 
  FileRiskAnalysisResult
} from "../types";

async function explainFileRisk(repoPath: string, filePath: string, useAI: boolean = true): Promise<string> {
  const structuredDependenciesData = parseRepository(repoPath);
  const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
  
  if (!dependencyGraph.getNode(filePath)) {
    throw new Error(`File ${filePath} not found in metrics`);
  }
  
  const fileMetrics = await computeFileMetrics(dependencyGraph, filePath);
  const fileRiskResult = computeFileRisk(filePath, fileMetrics);
  const fileAnalysis = {
    file: filePath,
    metrics: fileMetrics,
    riskScore: fileRiskResult.riskScore,
    riskLevel: fileRiskResult.riskLevel
  };
  
  if (useAI) {
    return await explainRiskIntent(fileAnalysis);
  }
  return `The file ${filePath} has a risk score of ${fileAnalysis.riskScore}. It has a centrality of ${fileMetrics.centrality}, a coupling of ${fileMetrics.coupling}, and a churn of ${fileMetrics.churn}.`;
}

async function explainFileImpact(repoPath: string, filePath: string, useAI: boolean = true): Promise<string> {
  const structuredDependenciesData = parseRepository(repoPath);
  const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
  
  if (!dependencyGraph.getNode(filePath)) {
    throw new Error(`File ${filePath} not found in metrics`);
  }
  
  const fileImpact = await computeFileImpact(repoPath, filePath);
  
  if (useAI) {
    return await explainImpactIntent(fileImpact);
  }
  return `The file ${filePath} has ${fileImpact.totalImpactCount} total dependents. This includes ${fileImpact.directDependents.length} direct dependents (${fileImpact.directDependents.join(', ')}) and ${fileImpact.transitiveDependents.length} transitive dependents (${fileImpact.transitiveDependents.slice(0, 5).join(', ')}${fileImpact.transitiveDependents.length > 5 ? '...' : ''}). Changing this file could impact ${fileImpact.totalImpactCount} files throughout the codebase.`;
}

/**
 * Analyze repository at the project level
 */
export async function analyzeRepository(repoPath: string): Promise<AnalyzeRepositoryResult> {
  const snapshot = await buildSnapshot(repoPath);
  const analysis = buildSnapshotSummary(snapshot);
  const persistResult = await tryPersistSnapshot(repoPath, snapshot);
  
  return {
    analysis,
    ...persistResult
  };
}

/**
 * Analyze risk for a specific file
 */
export async function analyzeFileRisk(repoPath: string, filePath: string): Promise<FileRiskAnalysisResult> {
  const structuredDependenciesData = parseRepository(repoPath);
  const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
  
  if (!dependencyGraph.getNode(filePath)) {
    throw new Error(`File ${filePath} not found in metrics`);
  }
  
  const fileMetrics = await computeFileMetrics(dependencyGraph, filePath);
  const fileRiskResult = computeFileRisk(filePath, fileMetrics);
  
  return {
    file: filePath,
    centrality: fileMetrics.centrality || 0,
    coupling: fileMetrics.coupling || 0,
    churn: fileMetrics.churn || 0,
    hasCircularDependency: Boolean(fileMetrics.circularDependency),
    riskScore: fileRiskResult.riskScore,
    riskLevel: fileRiskResult.riskLevel
  };
}

/**
 * Compute impact for a specific file
 */
export async function computeFileImpact(repoPath: string, filePath: string): Promise<FileImpactResult> {
  const structuredDependenciesData = parseRepository(repoPath);
  const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
  return computeImpact(dependencyGraph, filePath);
}

/**
 * Detect cycles in the repository
 */
export async function detectRepositoryCycles(repoPath: string): Promise<Cycle[]> {
  const structuredDependenciesData = parseRepository(repoPath);
  const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
  return dependencyGraph.detectCycles();
}

export { explainFileRisk, explainFileImpact };
