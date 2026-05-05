import { HotspotTrendItem, SnapshotAggregate } from "../../types";
import { computeImpact } from "../impact-engine/impact-engine";
import { buildDependencyGraphFromSnapshot } from "../dependency-graph/dependency-graph";

export const computeHotspotTrends = (
  snapshot1: SnapshotAggregate,
  snapshot2: SnapshotAggregate,
  trendThreshold: number = 0.05,
  limit: number = 5
): HotspotTrendItem[] => {
  const trends: HotspotTrendItem[] = [];
  
  const graph1 = buildDependencyGraphFromSnapshot(snapshot1);
  const graph2 = buildDependencyGraphFromSnapshot(snapshot2);

  for (const [filePath, file2] of snapshot2.files) {
    const file1 = snapshot1.files.get(filePath);
    if (!file1) continue;

    const riskDelta = file2.riskScore - file1.riskScore;
    
    const impact1 = computeImpact(graph1, filePath);
    const impact2 = computeImpact(graph2, filePath);
    const impactDelta = impact2.impactRatio - impact1.impactRatio;

    const normalizedImpactDelta = normalizeImpactDelta(impactDelta);
    const trendScore = (riskDelta * 0.6) + (normalizedImpactDelta * 0.4);

    if (trendScore >= trendThreshold) {
      trends.push({
        file: filePath,
        previousRiskScore: file1.riskScore,
        currentRiskScore: file2.riskScore,
        riskDelta,
        previousImpactRatio: impact1.impactRatio,
        currentImpactRatio: impact2.impactRatio,
        impactDelta,
        trendScore
      });
    }
  }

  return trends
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit);
};

const normalizeImpactDelta = (impactDelta: number): number => {
  return Math.max(0, Math.min(1, impactDelta));
};
