import { IMetric } from "./metrics/metric-interface";
import IGraph from "../dependency-graph/graph-implementations/graph-interface";
import { CentralityMetric } from "./metrics/centrality";
import { CouplingMetric } from "./metrics/coupling";
import { CircularDependencyMetric } from "./metrics/circular-dependency";
import { ChurnMetric } from "./metrics/churn";

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
    
    computeMetrics(dependencyGraph: IGraph) {
        const nodes = Array.from(dependencyGraph.getNodes().keys());
        const fileMetrics: Map<string, Record<string, number>> = new Map();
        
        for (const nodePath of nodes) {
            const metricsForFile: Record<string, number> = {};
            for (const metric of this.metrics) {
                metricsForFile[metric.key] = metric.compute(dependencyGraph, nodePath);
            }
            fileMetrics.set(nodePath, metricsForFile);
        }
        
        return fileMetrics;
    }
}
