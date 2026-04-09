import IGraph from "../../dependency-graph/graph-implementations/graph-interface";
import { MetricContext } from "../../types";

export interface IMetric {
    key: string;
    compute(dependencyGraph: IGraph, nodePath: string, context: MetricContext): number | Promise<number>;
}
