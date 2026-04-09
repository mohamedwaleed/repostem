
import IGraph from "../dependency-graph/graph-implementations/graph-interface";
import { MetricsComputer } from "./metrics-computer";

export const computeMetrics = (dependencyGraph: IGraph) => {
    const metricsComputer = new MetricsComputer();
    const fileMetrics = metricsComputer.computeMetrics(dependencyGraph);
    return fileMetrics;
}