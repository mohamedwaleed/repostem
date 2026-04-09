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

    private async calculateMaxCommits(nodes: string[]): Promise<number> {
        try {
            const git = simpleGit();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            let maxCommits = 0;
            
            for (const nodePath of nodes) {
                const commitCount = await git.log({ 
                    file: nodePath,
                    from: sixMonthsAgo.toISOString()
                }).then(log => log.total)
                .catch(() => 0);
                
                maxCommits = Math.max(maxCommits, commitCount);
            }
            
            return maxCommits;
        } catch (error) {
            return 0;
        }
    }
    
    async computeMetrics(dependencyGraph: IGraph) {
        const nodes = Array.from(dependencyGraph.getNodes().keys());
        
        // Pre-compute context once
        const maxCommits = await this.calculateMaxCommits(nodes);
        const context: MetricContext = {
            maxCommits,
            totalFiles: nodes.length
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
}
