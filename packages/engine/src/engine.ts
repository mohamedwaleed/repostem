import parseRepository from "./parser/parser";
import { buildDependencyGraph } from "./dependency-graph/dependency-graph";
import { computeFileMetrics, computeMetrics } from "./metrics-engine/metrics-engine";
import { computeRisk } from "./risk-engine/risk-engine";
import { Cycle, FileImpactResult, FileRiskResult, ProjectAnalysisResult, RankedFile } from "./types";

interface MetricConfig {
    key: string;
    extractValue: (fileAnalysis: any, metrics: any) => number;
    threshold?: number;
    sortDescending?: boolean;
}

const METRIC_CONFIGS: MetricConfig[] = [
    {
        key: 'centrality',
        extractValue: (_, metrics) => metrics?.centrality || 0,
        sortDescending: true
    },
    {
        key: 'score',
        extractValue: (_, metrics) => metrics?.riskScore || 0,
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
    filesAnalysis: any[],
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

// project level analysis
export async function analyzeRepository(repoPath: string): Promise<ProjectAnalysisResult> {
    const structuredDependenciesData = parseRepository(repoPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    const fileMetrics = await computeMetrics(dependencyGraph);
    const filesAnalysis = computeRisk(fileMetrics);

    const centralityConfig = METRIC_CONFIGS.find(c => c.key === 'centrality')!;
    const riskConfig = METRIC_CONFIGS.find(c => c.key === 'score')!;
    const churnConfig = METRIC_CONFIGS.find(c => c.key === 'churn')!;

    const cycles: Cycle[] = dependencyGraph.detectCycles();
    
    return {
        totalFiles: filesAnalysis.length,
        totalDependencies: dependencyGraph.getEdges().size,
        cycleCount: cycles.length,
        topCentralFiles: aggregateMetrics(filesAnalysis, fileMetrics, centralityConfig).slice(0, 5),
        highChurnFiles: aggregateMetrics(filesAnalysis, fileMetrics, churnConfig).slice(0, 5),
        topRiskFiles: aggregateMetrics(filesAnalysis, fileMetrics, riskConfig).slice(0, 5)
    };
}

// File-level deterministic
export async function analyzeFileRisk(repoPath: string, filePath: string): Promise<FileRiskResult> {
    const structuredDependenciesData = parseRepository(repoPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    
    if (!dependencyGraph.getNode(filePath)) {
        throw new Error(`File ${filePath} not found in metrics`);
    }
    
    const fileMetrics = await computeFileMetrics(dependencyGraph, filePath);
    const metricsMap = new Map([[filePath, fileMetrics]]);
    const [fileAnalysis] = computeRisk(metricsMap);
    
    return {
        file: filePath,
        centrality: fileMetrics.centrality || 0,
        coupling: fileMetrics.coupling || 0,
        churn: fileMetrics.churn || 0,
        hasCircularDependency: Boolean(fileMetrics.circularDependency),
        riskScore: fileAnalysis.riskScore
    };
}

// Impact analysis
export async function computeFileImpact(repoPath: string, filePath: string): Promise<FileImpactResult> {
    const structuredDependenciesData = parseRepository(repoPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    const directDependents = dependencyGraph.getDirectDependent(filePath);
    const transitiveDependents = dependencyGraph.getTransitiveDependents(filePath);
    return {
        file: filePath,
        directDependents,
        transitiveDependents,
        totalImpactCount: transitiveDependents.length
    };
}

// Cycles
export async function detectRepositoryCycles(repoPath: string): Promise<Cycle[]> {
    const structuredDependenciesData = parseRepository(repoPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    return dependencyGraph.detectCycles();
}

// AI explanation
export async function explainFileRisk(repoPath: string, filePath: string): Promise<string> {
    const structuredDependenciesData = parseRepository(repoPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    
    if (!dependencyGraph.getNode(filePath)) {
        throw new Error(`File ${filePath} not found in metrics`);
    }
    
    const fileMetrics = await computeFileMetrics(dependencyGraph, filePath);
    const metricsMap = new Map([[filePath, fileMetrics]]);
    const [fileAnalysis] = computeRisk(metricsMap);
    
    //@TODO: call AI service to explain the risk
    return `The file ${filePath} has a risk score of ${fileAnalysis.riskScore}. It has a centrality of ${fileMetrics.centrality}, a coupling of ${fileMetrics.coupling}, and a churn of ${fileMetrics.churn}.`;
}