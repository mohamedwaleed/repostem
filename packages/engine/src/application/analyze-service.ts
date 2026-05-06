import parseRepository from "../core/parser/parser";
import { buildDependencyGraph } from "../core/dependency-graph/dependency-graph";
import { computeFileMetrics } from "../core/metrics-engine/metrics-engine";
import { computeFileRisk } from "../core/risk-engine/risk-engine";
import { computeImpact } from "../core/impact-engine/impact-engine";
import { buildSnapshot } from "../core/snapshot-builder";
import { buildSnapshotSummary } from "../repository-metrics/snapshot-summary";
import { tryPersistSnapshot } from "../persistence/snapshot-persister";
import { explainImpactIntent, explainRiskIntent } from "../ai-explanation-layer/intent-router";
import { 
  AnalyzeRepositoryResult, 
  Cycle, 
  FileImpactResult, 
  FileRiskAnalysisResult
} from "../types";
import { ProgressEmitter, emitProgress } from "../utils/progress-emitter";

async function explainFileRisk(repoPath: string, filePath: string, useAI: boolean = true): Promise<string> {
  const snapshot = await buildSnapshot(repoPath);
  
  const fileSnapshot = snapshot.files.get(filePath);
  if (!fileSnapshot) {
    throw new Error(`File ${filePath} not found in snapshot`);
  }
  
  const fileAnalysis = {
    file: filePath,
    metrics: fileSnapshot.metrics,
    riskScore: fileSnapshot.riskScore,
    riskLevel: fileSnapshot.riskLevel
  };
  
  if (useAI) {
    return await explainRiskIntent(fileAnalysis);
  }
  return `The file ${filePath} has a risk score of ${fileAnalysis.riskScore}. It has a centrality of ${fileAnalysis.metrics.centrality}, a coupling of ${fileAnalysis.metrics.coupling}, and a churn of ${fileAnalysis.metrics.churn}.`;
}

async function explainFileImpact(repoPath: string, filePath: string, useAI: boolean = true): Promise<string> {
  
  const fileImpact = await computeFileImpact(repoPath, filePath);
  
  if (useAI) {
    return await explainImpactIntent(fileImpact);
  }
  return `The file ${filePath} has ${fileImpact.totalImpactCount} total dependents. This includes ${fileImpact.directDependents.length} direct dependents (${fileImpact.directDependents.join(', ')}) and ${fileImpact.transitiveDependents.length} transitive dependents (${fileImpact.transitiveDependents.slice(0, 5).join(', ')}${fileImpact.transitiveDependents.length > 5 ? '...' : ''}). Changing this file could impact ${fileImpact.totalImpactCount} files throughout the codebase.`;
}

/**
 * Analyze repository at the project level
 */
export async function analyzeRepository(repoPath: string, progressEmitter?: ProgressEmitter): Promise<AnalyzeRepositoryResult> {
  const snapshot = await buildSnapshot(repoPath, progressEmitter);
  const analysis = buildSnapshotSummary(snapshot);
  
  emitProgress(progressEmitter, 'persistence:saving', undefined);
  const persistResult = await tryPersistSnapshot(repoPath, snapshot);
  if (persistResult.persisted && persistResult.snapshotId) {
    emitProgress(progressEmitter, 'persistence:saved', { snapshotId: persistResult.snapshotId });
  }
  
  return {
    analysis,
    ...persistResult
  };
}

/**
 * Analyze risk for a specific file
 */
export async function analyzeFileRisk(repoPath: string, filePath: string, progressEmitter?: ProgressEmitter): Promise<FileRiskAnalysisResult> {
  const snapshot = await buildSnapshot(repoPath, progressEmitter);
  
  const fileSnapshot = snapshot.files.get(filePath);
  if (!fileSnapshot) {
    throw new Error(`File ${filePath} not found in snapshot`);
  }
  
  return {
    file: filePath,
    centrality: fileSnapshot.metrics.centrality || 0,
    coupling: fileSnapshot.metrics.coupling || 0,
    churn: fileSnapshot.metrics.churn || 0,
    hasCircularDependency: Boolean(fileSnapshot.metrics.circularDependency),
    riskScore: fileSnapshot.riskScore,
    riskLevel: fileSnapshot.riskLevel
  };
}

/**
 * Compute impact for a specific file
 */
export async function computeFileImpact(repoPath: string, filePath: string, progressEmitter?: ProgressEmitter): Promise<FileImpactResult> {
  const structuredDependenciesData = parseRepository(repoPath, { language: 0 as any }, progressEmitter);
  
  emitProgress(progressEmitter, 'graph:building', undefined);
  const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
  emitProgress(progressEmitter, 'graph:built', { totalEdges: dependencyGraph.getEdges().size });
  
  if (!dependencyGraph.getNode(filePath)) {
    throw new Error(`File ${filePath} not found in metrics`);
  }
  return computeImpact(dependencyGraph, filePath);
}

/**
 * Detect cycles in the repository
 */
export async function detectRepositoryCycles(repoPath: string, progressEmitter?: ProgressEmitter): Promise<Cycle[]> {
  const snapshot = await buildSnapshot(repoPath, progressEmitter);
  return snapshot.cycles;
}

export { explainFileRisk, explainFileImpact };
