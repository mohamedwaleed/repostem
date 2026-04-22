import { IMetric } from "./metric-interface";
import IGraph from "../../dependency-graph/graph-implementations/graph-interface";
import { MetricContext } from "../../../types";
import simpleGit from "simple-git";

export class ChurnMetric implements IMetric {
    key = "churn";
    
    async compute(_: IGraph, nodePath: string, context: MetricContext) {
        // Use pre-calculated commit counts from context (no git calls needed!)
        const numberOfCommits = context.commitsPerFile.get(nodePath) || 0;
        return context.maxCommits > 0 ? numberOfCommits / context.maxCommits : 0;
    }
}