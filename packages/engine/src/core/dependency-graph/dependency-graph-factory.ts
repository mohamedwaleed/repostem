import { DependencyGraphType } from "../../types";
import { InMemoryGraph } from "./graph-implementations/In-memory-graph";

const dependencyGraphTypes = {
    [DependencyGraphType.inMemory]: InMemoryGraph
} as const;

export const getDependencyGraph = (dependencyGraphType: keyof typeof dependencyGraphTypes) => {
    switch (dependencyGraphType) {
        case DependencyGraphType.inMemory:
            return new InMemoryGraph();
        default:
            throw new Error("Unsupported dependency graph type");
    }
}
    