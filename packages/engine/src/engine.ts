import parseRepository from "./parser/parser";
import { buildDependencyGraph } from "./dependency-graph/dependency-graph";
import { computeMetrics } from "./metrics-engine/metrics-engine";

export function analyze(projectPath: string) {
    const structuredDependenciesData = parseRepository(projectPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    const fileMetrics = computeMetrics(dependencyGraph);
    return fileMetrics;
}
