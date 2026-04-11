import { DependencyGraphType, ParseResult } from "../types";
import { getDependencyGraph } from "./dependency-graph-factory";

export const buildDependencyGraph = (parsedResult: ParseResult) => {
    
    const dependencyGraph = getDependencyGraph(DependencyGraphType.inMemory);
    dependencyGraph.setRepositoryRoot(parsedResult.repositoryRoot);
    const files = parsedResult.files;
    
    for (const file of files) {
        dependencyGraph.addNode(file);
        for (const dependency of file.syntax.imports) {
            if (dependency.resolvedPath && !dependency.isExternal) {
                dependencyGraph.addEdge(file.path, dependency.resolvedPath);
            }
        }
    }
    
    return dependencyGraph;
}