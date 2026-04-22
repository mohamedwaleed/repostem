
import IGraph from "../dependency-graph/graph-implementations/graph-interface";
import { MetricsComputer } from "./metrics-computer";

export async function computeMetrics(dependencyGraph: IGraph) {
    const metricsComputer = new MetricsComputer();
    const fileMetrics = await metricsComputer.computeMetrics(dependencyGraph);
    return fileMetrics;
}

export async function computeFileMetrics(dependencyGraph: IGraph, filePath: string) {
    const metricsComputer = new MetricsComputer();
    const fileMetrics = await metricsComputer.computeFileMetrics(dependencyGraph, filePath);
    return fileMetrics;

}
