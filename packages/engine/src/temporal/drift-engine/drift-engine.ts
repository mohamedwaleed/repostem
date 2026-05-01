import { buildDependencyGraphFromSnapshot } from "../../core/dependency-graph/dependency-graph";
import { DriftResult, SnapshotAggregate } from "../../types";

export const detectDrift = (snapshot1: SnapshotAggregate, snapshot2: SnapshotAggregate, thresholds: {riskDelta: number, impactDeltaRatio: number}): DriftResult => {
  const dependencyGraph1 = buildDependencyGraphFromSnapshot(snapshot1);
  const dependencyGraph2 = buildDependencyGraphFromSnapshot(snapshot2);
  
  

};
