import parseRepository from "./core/parser/parser";
import { buildDependencyGraph } from "./core/dependency-graph/dependency-graph";
import { computeFileMetrics, computeMetrics } from "./core/metrics-engine/metrics-engine";
import { computeFileRisk, computeRisk } from "./core/risk-engine/risk-engine";
import { Cycle, FileAnalysis, FileImpactResult, FileRiskAnalysisResult, FileRiskResult, InitRepoOptions, InitRepoResult, ProjectAnalysisResult, RankedFile, ResetPersistenceResult } from "./types";
import { classify } from "./utils/classify";
import { detectIntent, explainImpactIntent, explainRiskIntent } from "./ai-explanation-layer/intent-router";
import { AdapterFactory } from "./persistence/adapters";
import { runInitMigration } from "./persistence/migrations";
import { RepoRepository, SnapshotRepository } from "./persistence/repositories";
import { getConfig, updateConfigFile, isPersistenceConfigured } from "./config/config-loader";
import { MetricConfig } from "./types";
import { computeImpact } from "./core/impact-engine/impact-engine";
import { merge } from "lodash";

const intentMap: Record<string, (repoPath: string, filePath: string, explain?: boolean) => Promise<string>> = {
    "risk": explainFileRisk,
    "impact": explainFileImpact,
};


const METRIC_CONFIGS: MetricConfig[] = [
    {
        key: 'centrality',
        extractValue: (_, metrics) => metrics?.centrality || 0,
        sortDescending: true
    },
    {
        key: 'riskScore',
        extractValue: (fileAnalysis) => fileAnalysis?.riskScore || 0,
        sortDescending: true
    },
    {
        key: 'churn',
        extractValue: (_, metrics) => metrics?.churn || 0,
        threshold: 0.6,
        sortDescending: true
    }
];

function aggregateMetrics(
    filesAnalysis: FileAnalysis[],
    fileMetrics: Map<string, any>,
    config: MetricConfig
): RankedFile[] {
    let results = filesAnalysis.map((fileAnalysis) => {
        const metrics = fileMetrics.get(fileAnalysis.file);
        return {
            file: fileAnalysis.file,
            score: config.extractValue(fileAnalysis, metrics)
        };
    });

    if (config.threshold !== undefined) {
        results = results.filter(item => item.score > config.threshold!);
    }

    return results.sort((a, b) => 
        config.sortDescending ? b.score - a.score : a.score - b.score
    );
}

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
///////////////////////////////////////////////////////////////////////////////

// project level analysis
export async function analyzeRepository(repoPath: string): Promise<ProjectAnalysisResult> {
    const structuredDependenciesData = parseRepository(repoPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    const fileMetrics = await computeMetrics(dependencyGraph);
    const filesRiskResult = computeRisk(fileMetrics);
    
    const centralityConfig = METRIC_CONFIGS.find(c => c.key === 'centrality')!;
    const riskConfig = METRIC_CONFIGS.find(c => c.key === 'riskScore')!;
    const churnConfig = METRIC_CONFIGS.find(c => c.key === 'churn')!;

    const cycles: Cycle[] = dependencyGraph.detectCycles();
    const filesAnalysis = filesRiskResult.map((fileRiskResult) => {
        const metrics = fileMetrics.get(fileRiskResult.file)!;
        return {
            ...fileRiskResult,
            metrics
        };
    });
    return {
        totalFiles: dependencyGraph.getNodes().size,
        totalDependencies: dependencyGraph.getEdges().size,
        cycleCount: cycles.length,
        topCentralFiles: aggregateMetrics(filesAnalysis, fileMetrics, centralityConfig).slice(0, 5),
        highChurnFiles: aggregateMetrics(filesAnalysis, fileMetrics, churnConfig).slice(0, 5),
        topRiskFiles: aggregateMetrics(filesAnalysis, fileMetrics, riskConfig).slice(0, 5)
    };
}

// File-level deterministic
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

// Impact analysis
export async function computeFileImpact(repoPath: string, filePath: string): Promise<FileImpactResult> {
    const structuredDependenciesData = parseRepository(repoPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    return computeImpact(dependencyGraph, filePath);
}

// Cycles
export async function detectRepositoryCycles(repoPath: string): Promise<Cycle[]> {
    const structuredDependenciesData = parseRepository(repoPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    return dependencyGraph.detectCycles();
}

export async function ask(question: string, repoPath: string): Promise<string> {
    const filePath = question.match(/[\w\/\-]+\.\w+/)?.[0] || "";
    if(!filePath) {
        throw new Error(`No file path found in question: ${question}`);
    }
    const intent = detectIntent(question);

    if (!intentMap[intent] || intent === "unknown") {
        throw new Error(`Unknown question: ${question}`);
    }
    return intentMap[intent](repoPath, filePath, true);
}

///////////////////////////////////////////////////////////////////////////////
// Repository Initialization


/**
 * Initialize a repository for persistence
 * 
 * @param repositoryRoot - The root path of the repository
 * @param options - Initialization options (storageType, storagePath)
 * @returns InitRepoResult with repoId and config
 */
async function initializeRepo(
  repositoryRoot: string,
  options: InitRepoOptions
): Promise<InitRepoResult> {
  const { storageType, storagePath, repoId: existingRepoId } = options;

  // Create database adapter
  const adapter = AdapterFactory.createAdapterFromString(storageType, storagePath);

  try {
    // Connect to database
    await adapter.connect();

    // Run migrations
    const migrationResult = await runInitMigration(adapter);

    if (!migrationResult.success) {
      throw new Error(`Migration failed: ${migrationResult.message}`);
    }

    const repoRepository = new RepoRepository(adapter);
    let repoId: string;

    if (existingRepoId) {
      // Use existing repo_id (for reconfiguration)
      repoId = existingRepoId;
      
      // Check if repo record exists in new database
      const existingRepo = await repoRepository.getRepoById(repoId);
      
      if (!existingRepo) {
        // Insert repo record if missing
        await repoRepository.createRepo(repoId, repositoryRoot);
      }
    } else {
      // Generate new repo UUID (for new initialization)
      repoId = crypto.randomUUID();
      await repoRepository.createRepo(repoId, repositoryRoot);
    }

    // Update config file with repo_id
    updateConfigFile(repositoryRoot, {
      storage_type: storageType,
      storage_path: storagePath,
      repo_id: repoId,
    });

    // Get the updated config
    const updatedConfig = getConfig(repositoryRoot);

    // Disconnect from database
    await adapter.disconnect();

    return {
      success: true,
      repoId,
      config: updatedConfig,
      migrationResult,
      message: `Repository initialized successfully.\n` +
        `Repo ID: ${repoId}\n` +
        `Storage: ${storageType} at ${storagePath}\n` +
        `Tables created: ${migrationResult.tablesCreated.length}`,
    };
  } catch (error) {
    // Ensure disconnect on error
    try {
      await adapter.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    throw error;
  }
}

/**
 * Check if a repository is initialized for persistence
 * 
 * @param repositoryRoot - The root path of the repository
 * @returns True if persistence is configured
 */
function isRepoInitialized(repositoryRoot: string): boolean {
  return isPersistenceConfigured(repositoryRoot);
}

/**
 * Reset persistence by deleting all snapshots for a repository
 * This keeps the repo record but deletes all associated snapshots and their data
 * 
 * @param repositoryRoot - The root path of the repository
 * @returns ResetPersistenceResult indicating success and number of snapshots deleted
 */
export async function resetPersistence(repositoryRoot: string): Promise<ResetPersistenceResult> {
  const config = getConfig(repositoryRoot);

  if (!config.storage_type || !config.storage_path || !config.repo_id) {
    throw new Error("Repository is not properly initialized for persistence.");
  }

  const adapter = AdapterFactory.createAdapterFromString(config.storage_type, config.storage_path);

  try {
    await adapter.connect();

    const snapshotRepository = new SnapshotRepository(adapter);
    const snapshots = await snapshotRepository.getSnapshotsByRepoId(config.repo_id);

    const snapshotCount = snapshots.length;

    // Delete all snapshots (cascade will delete related data)
    for (const snapshot of snapshots) {
      await snapshotRepository.deleteSnapshot(snapshot.id);
    }

    await adapter.disconnect();

    return {
      success: true,
      message: `Successfully reset persistence. Deleted ${snapshotCount} snapshot(s).`,
      snapshotsDeleted: snapshotCount,
    };
  } catch (error) {
    try {
      await adapter.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    throw error;
  }
}

export { classify, explainFileRisk, explainFileImpact, initializeRepo, isRepoInitialized };
