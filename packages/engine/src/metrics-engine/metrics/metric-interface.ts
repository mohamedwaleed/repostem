import IGraph from "../../dependency-graph/graph-implementations/graph-interface";

export interface IMetric {
    key: string;
    compute(dependencyGraph: IGraph, nodePath: string): any;
}
