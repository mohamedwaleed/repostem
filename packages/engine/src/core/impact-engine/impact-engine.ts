import IGraph from "../dependency-graph/graph-implementations/graph-interface";
import { FileImpactResult } from "../../types";

export function computeImpact(dependencyGraph: IGraph, filePath: string): FileImpactResult {
    const directDependents = dependencyGraph.getDirectDependent(filePath);
    const transitiveDependents = dependencyGraph.getTransitiveDependents(filePath);
    return {
        file: filePath,
        directDependents,
        transitiveDependents,
        totalImpactCount: transitiveDependents.length,
        impactRatio: transitiveDependents.length / dependencyGraph.getNodes().size
    };
}