import { DependencyGraphType, ParseResult } from "../types";
import { getDependencyGraph } from "./dependency-graph-factory";

export const buildDependencyGraph = (parsedResult: ParseResult) => {
    
    const dependencyGraph = getDependencyGraph(DependencyGraphType.inMemory);
    const files = parsedResult.files;
    
    for (const file of files) {
        dependencyGraph.addNode(file);
        for (const dependency of file.syntax.imports) {
            dependencyGraph.addEdge(file.path, dependency as string);
        }
    }
    
    return dependencyGraph;
}