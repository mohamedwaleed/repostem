import { IMetric } from "./metric-interface";
import IGraph from "../../dependency-graph/graph-implementations/graph-interface";

export class ChurnMetric implements IMetric {
    key = "churn";
    
    compute(dependencyGraph: IGraph, nodePath: string) {
        // TODO: Implement churn calculation
        return 0;
    }

}