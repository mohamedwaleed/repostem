import { IMetric } from "./metrics/metric-interface";
import IGraph from "../dependency-graph/graph-implementations/graph-interface";
import simpleGit from 'simple-git';
import { CentralityMetric } from "./metrics/centrality";
import { CouplingMetric } from "./metrics/coupling";
import { CircularDependencyMetric } from "./metrics/circular-dependency";
import { ChurnMetric } from "./metrics/churn";
import { MetricContext } from "../types";

export class MetricsComputer {
    private metrics: IMetric[] = [];
    
    constructor() {
        this.registerMetric(new CentralityMetric());
        this.registerMetric(new CouplingMetric());
        this.registerMetric(new CircularDependencyMetric());
        this.registerMetric(new ChurnMetric());
    }
    registerMetric(metric: IMetric) {
        this.metrics.push(metric);
    }

    private async calculateCommitsPerFile(repositoryRoot: string): Promise<Map<string, number>> {
        try {
            const git = simpleGit(repositoryRoot);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            // Use git log with --name-only to get all commits and their changed files in one call
            const logOutput = await git.raw([
                'log',
                '--since=' + sixMonthsAgo.toISOString(),
                '--name-only',
                '--pretty=format:COMMIT:%H'
            ]);
            
            // Parse the output to count commits per file
            const commitsPerFile = new Map<string, Set<string>>();
            const lines = logOutput.split('\n');
            let currentCommit = '';
            
            for (const line of lines) {
                if (line.startsWith('COMMIT:')) {
                    currentCommit = line.substring(7);
                } else if (line.trim() && currentCommit) {
                    // This is a file path
                    const filePath = line.trim();
                    if (!commitsPerFile.has(filePath)) {
                        commitsPerFile.set(filePath, new Set());
                    }
                    commitsPerFile.get(filePath)!.add(currentCommit);
                }
            }
            
            // Convert Set sizes to counts
            const commitCounts = new Map<string, number>();
            for (const [file, commits] of commitsPerFile.entries()) {
                commitCounts.set(file, commits.size);
            }
            
            return commitCounts;
        } catch (error) {
            console.error('Error calculating commits per file:', error);
            return new Map();
        }
    }
    
    async computeMetrics(dependencyGraph: IGraph) {
        const nodes = Array.from(dependencyGraph.getNodes().keys());
        const repositoryRoot = dependencyGraph.getRepositoryRoot();
        
        // Pre-compute all commits in a single git operation
        const allCommitsPerFile = await this.calculateCommitsPerFile(repositoryRoot);
        
        // Filter to only include files that were parsed (JS/TS files)
        const nodesSet = new Set(nodes);
        const commitsPerFile = new Map<string, number>();
        for (const [file, count] of allCommitsPerFile.entries()) {
            if (nodesSet.has(file)) {
                commitsPerFile.set(file, count);
            }
        }
        
        // Calculate maxCommits from the filtered data
        let maxCommits = 0;
        for (const count of commitsPerFile.values()) {
            maxCommits = Math.max(maxCommits, count);
        }
        
        const context: MetricContext = {
            maxCommits,
            totalFiles: nodes.length,
            repositoryRoot,
            commitsPerFile
        };
        
        const fileMetrics: Map<string, Record<string, number>> = new Map();
        
        for (const nodePath of nodes) {
            const metricsForFile: Record<string, number> = {};
            for (const metric of this.metrics) {
                const result = metric.compute(dependencyGraph, nodePath, context);
                metricsForFile[metric.key] = result instanceof Promise ? await result : result;
            }
            fileMetrics.set(nodePath, metricsForFile);
        }
        
        return fileMetrics;
    }

    async computeFileMetrics(dependencyGraph: IGraph, filePath: string) {
        const nodes = Array.from(dependencyGraph.getNodes().keys());
        const repositoryRoot = dependencyGraph.getRepositoryRoot();
        
        // Pre-compute all commits in a single git operation
        const allCommitsPerFile = await this.calculateCommitsPerFile(repositoryRoot);
        
        // Filter to only include files that were parsed (JS/TS files)
        const nodesSet = new Set(nodes);
        const commitsPerFile = new Map<string, number>();
        for (const [file, count] of allCommitsPerFile.entries()) {
            if (nodesSet.has(file)) {
                commitsPerFile.set(file, count);
            }
        }
        
        // Calculate maxCommits from the filtered data
        let maxCommits = 0;
        for (const count of commitsPerFile.values()) {
            maxCommits = Math.max(maxCommits, count);
        }
        
        const context: MetricContext = {
            maxCommits,
            totalFiles: nodes.length,
            repositoryRoot,
            commitsPerFile
        };
        
        const metricsForFile: Record<string, number> = {};
        for (const metric of this.metrics) {
            const result = metric.compute(dependencyGraph, filePath, context);
            metricsForFile[metric.key] = result instanceof Promise ? await result : result;
        }
        
        return metricsForFile;
    }
}
