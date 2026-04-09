import { IMetric } from "./metric-interface";
import IGraph from "../../dependency-graph/graph-implementations/graph-interface";
import { MetricContext } from "../../types";
import simpleGit from "simple-git";

export class ChurnMetric implements IMetric {
    key = "churn";
    
    async compute(_: IGraph, nodePath: string, context: MetricContext) {
        const git = simpleGit();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const numberOfCommits = await git.log({ 
            file: nodePath,
            from: sixMonthsAgo.toISOString()
        })
        .then(log => log.total)
        .catch(() => 0);
        
        return context.maxCommits > 0 ? numberOfCommits / context.maxCommits : 0;
    }
}