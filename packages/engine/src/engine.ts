import parseRepository from "./parser/parser";
import { buildDependencyGraph } from "./dependency-graph/dependency-graph";
import { computeMetrics } from "./metrics-engine/metrics-engine";
import { computeRisk } from "./risk-engine/risk-engine";

export async function analyze(projectPath: string) {
    const structuredDependenciesData = parseRepository(projectPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    const fileMetrics = await computeMetrics(dependencyGraph);
    const fileAnalysis = computeRisk(fileMetrics);
    return fileAnalysis;
}
