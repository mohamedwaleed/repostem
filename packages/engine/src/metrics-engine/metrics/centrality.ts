import { IMetric } from "./metric-interface";
import IGraph from "../../dependency-graph/graph-implementations/graph-interface";
import { MetricContext } from "../../types";

export class CentralityMetric implements IMetric {
    key = "centrality";
    
    compute(dependencyGraph: IGraph, nodePath: string, context: MetricContext) {
        const indegree = dependencyGraph.getInDegree(nodePath);
        return context.totalFiles > 1 ? indegree / (context.totalFiles - 1) : 0;
    }
    
}