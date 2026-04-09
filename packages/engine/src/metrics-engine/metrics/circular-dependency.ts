import IGraph from "../../dependency-graph/graph-implementations/graph-interface";
import { IMetric } from "./metric-interface";
import { MetricContext } from "../../types";

export class CircularDependencyMetric implements IMetric {
    key = "circularDependency";
    
    compute(dependencyGraph: IGraph, nodePath: string, context: MetricContext) {
        const cycles = dependencyGraph.detectCycles();
        const filteredCycles = cycles.filter((cycle) => cycle.nodes.includes(nodePath));
        return filteredCycles.length > 0 ? 1 : 0;
    }
}
