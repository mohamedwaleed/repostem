import { IMetric } from "./metric-interface";
import IGraph from "../../dependency-graph/graph-implementations/graph-interface";

export class CouplingMetric implements IMetric {
    key = "coupling";
    
    compute(dependencyGraph: IGraph, nodePath: string) {
        const inDegree = dependencyGraph.getInDegree(nodePath);
        const outDegree = dependencyGraph.getOutDegree(nodePath);
        const totalFiles = dependencyGraph.getNodes().size;
        const maxPossibleCoupling = 2 * (totalFiles - 1);
        return (inDegree + outDegree) / maxPossibleCoupling;
    }
}
