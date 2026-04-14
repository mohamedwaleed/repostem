import parseRepository from "./parser/parser";
import { buildDependencyGraph } from "./dependency-graph/dependency-graph";
import { computeFileMetrics, computeMetrics } from "./metrics-engine/metrics-engine";
import { computeRisk } from "./risk-engine/risk-engine";
import { Cycle, FileAnalysis, FileImpactResult, FileRiskResult, ProjectAnalysisResult, RankedFile } from "./types";
import { explainFileImpactUsingAI, explainFileRiskUsingAI } from "./ai-explanation-layer/ai-explaination-layer";
import { classify } from "./utils/classify";

interface MetricConfig {
    key: string;
    extractValue: (fileAnalysis: FileAnalysis, metrics: any) => number;
    threshold?: number;
    sortDescending?: boolean;
}

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
// AI explanation
const detectIntent = (question: string): string => {
    const riskKeywords = ["risk", "risks", "threat", "threats", "danger", "hazard", "fragile"];
    const impactKeywords = ["impact", "impacts", "consequence", "consequences", "effect", "effects", "result", "results"];
    if (riskKeywords.some(keyword => question.toLowerCase().includes(keyword))) {
        return "risk";
    }
    if (impactKeywords.some(keyword => question.toLowerCase().includes(keyword))) {
        return "impact";
    }
    return "unknown";
};

async function explainFileRisk(repoPath: string, filePath: string, useAI: boolean = true): Promise<string> {
    const structuredDependenciesData = parseRepository(repoPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    
    if (!dependencyGraph.getNode(filePath)) {
        throw new Error(`File ${filePath} not found in metrics`);
    }
    
    const fileMetrics = await computeFileMetrics(dependencyGraph, filePath);
    const metricsMap = new Map([[filePath, fileMetrics]]);
    const [fileAnalysis] = computeRisk(metricsMap);
    
    if (useAI) {
        return await explainFileRiskUsingAI(fileAnalysis);
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
        return await explainFileImpactUsingAI(fileImpact);
    }
    return `The file ${filePath} has ${fileImpact.totalImpactCount} total dependents. This includes ${fileImpact.directDependents.length} direct dependents (${fileImpact.directDependents.join(', ')}) and ${fileImpact.transitiveDependents.length} transitive dependents (${fileImpact.transitiveDependents.slice(0, 5).join(', ')}${fileImpact.transitiveDependents.length > 5 ? '...' : ''}). Changing this file could impact ${fileImpact.totalImpactCount} files throughout the codebase.`;
}
///////////////////////////////////////////////////////////////////////////////

// project level analysis
export async function analyzeRepository(repoPath: string): Promise<ProjectAnalysisResult> {
    const structuredDependenciesData = parseRepository(repoPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    const fileMetrics = await computeMetrics(dependencyGraph);
    const filesAnalysis = computeRisk(fileMetrics);

    const centralityConfig = METRIC_CONFIGS.find(c => c.key === 'centrality')!;
    const riskConfig = METRIC_CONFIGS.find(c => c.key === 'riskScore')!;
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
        totalImpactCount: transitiveDependents.length,
        impactRatio: transitiveDependents.length / dependencyGraph.getNodes().size
    };
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

export { classify, explainFileRisk, explainFileImpact };
