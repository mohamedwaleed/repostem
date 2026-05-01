import { DependencyGraphType, ParseResult, SnapshotAggregate } from "../../types";
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

export const buildDependencyGraphFromSnapshot = (snapshot: SnapshotAggregate) => {
    const dependencyGraph = getDependencyGraph(DependencyGraphType.inMemory);
    dependencyGraph.setRepositoryRoot(snapshot.repositoryRoot);

    for (const [_, fileSnapshot] of snapshot.files) {
        dependencyGraph.addNode({
            path: fileSnapshot.path,
            syntax: {},
            metadata: { size: 0, extension: '' }
        });
    }

    for (const [from, toSet] of snapshot.edges) {
        for (const to of toSet) {
            dependencyGraph.addEdge(from, to);
        }
    }

    return dependencyGraph;
}