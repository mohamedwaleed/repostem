import { IMetric } from "./metric-interface";
import IGraph from "../../dependency-graph/graph-implementations/graph-interface";

export class CentralityMetric implements IMetric {
    key = "centrality";
    
    compute(dependencyGraph: IGraph, nodePath: string) {
        const indegree = dependencyGraph.getInDegree(nodePath);
        const totalFiles = dependencyGraph.getNodes().size;
        return indegree / (totalFiles - 1);
    }
    
}