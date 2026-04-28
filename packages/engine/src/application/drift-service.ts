// Drift detection service
// TODO: Implement drift comparison between snapshots

export interface DriftResult {
  previousSnapshotId: string;
  currentSnapshotId: string;
  filesAdded: string[];
  filesRemoved: string[];
  filesWithRiskChange: {
    file: string;
    previousRisk: number;
    currentRisk: number;
    delta: number;
  }[];
  newCycles: string[][];
  resolvedCycles: string[][];
}

/**
 * Compare the two most recent snapshots to detect architectural drift
 */
export async function detectDrift(_repoPath: string): Promise<DriftResult | null> {
  throw new Error("Not implemented");
}
