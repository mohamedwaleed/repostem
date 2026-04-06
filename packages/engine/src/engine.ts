import parseRepository from "./parser/parser";
import { buildDependencyGraph } from "./dependency-graph/dependency-graph";

export function analyze(projectPath: string) {
    const structuredDependenciesData = parseRepository(projectPath);
    const dependencyGraph = buildDependencyGraph(structuredDependenciesData);
    return { structuredDependenciesData, dependencyGraph };
}
