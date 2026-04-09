import { IMetric } from "./metric-interface";
import IGraph from "../../dependency-graph/graph-implementations/graph-interface";
import { MetricContext } from "../../types";

export class CouplingMetric implements IMetric {
    key = "coupling";
    
    compute(dependencyGraph: IGraph, nodePath: string, context: MetricContext) {
        const inDegree = dependencyGraph.getInDegree(nodePath);
        const outDegree = dependencyGraph.getOutDegree(nodePath);
        const maxPossibleCoupling = 2 * (context.totalFiles - 1);
        return context.totalFiles > 1 ? (inDegree + outDegree) / maxPossibleCoupling : 0;
    }
}
