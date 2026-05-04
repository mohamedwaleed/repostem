import { buildSnapshot } from "../core/snapshot-builder";
import { computeHotspotsFromSnapshot } from "../core/hostspot-engine/hostspot-engine";

export const calculateHotspots = async (repoPath: string, hotspotThreshold: number = 0.2, limit: number = 5) => {
  const snapshot = await buildSnapshot(repoPath);
  const hotspots = computeHotspotsFromSnapshot(snapshot);
  return Array.from(hotspots.values())
    .filter((hotspot) => hotspot.hotspotScore > hotspotThreshold)
    .sort((a, b) => b.hotspotScore - a.hotspotScore)
    .slice(0, limit);
};
