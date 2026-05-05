import { detectIntent } from "../ai-explanation-layer/intent-router";
import { explainFileRisk, explainFileImpact } from "./analyze-service";
import { detectDrift } from "./drift-service";
import { calculateHotspots } from "./hotspot-service";
import { calculateHotspotTrends } from "./hotspot-trend-service";
import { explainDrift, explainHotspots, explainTrend } from "../ai-explanation-layer/explainer";

const intentMap: Record<string, (repoPath: string, filePath: string, explain?: boolean) => Promise<string>> = {
  "risk": explainFileRisk,
  "impact": explainFileImpact,
};

export interface AskServiceOptions {
  branch?: string;
  noBranchFilter?: boolean;
  since?: string;
}

/**
 * Ask a natural language question about a file
 *
 * @param question - The question to ask
 * @param repoPath - The repository path
 * @param options - Optional service options (branch, since, noBranchFilter)
 * @returns The answer string
 */
export async function ask(question: string, repoPath: string, options: AskServiceOptions = {}): Promise<string> {
  const intent = detectIntent(question);

  // Handle drift summary questions
  if (intent === "driftSummary") {
    const driftResult = await detectDrift({
      repo: repoPath,
      branch: options.branch,
      noBranchFilter: options.noBranchFilter,
      since: options.since
    });
    if (!driftResult) {
      return "No drift detected - insufficient snapshots available for comparison.";
    }
    return explainDrift(driftResult);
  }

  // Handle hotspot questions
  if (intent === "hotspots") {
    const hotspots = await calculateHotspots(repoPath);
    return explainHotspots(hotspots);
  }

  // Handle trend questions
  if (intent === "fileTrend") {
    const trends = await calculateHotspotTrends({
      repo: repoPath,
      branch: options.branch,
      noBranchFilter: options.noBranchFilter,
      since: options.since
    });
    return explainTrend(trends);
  }

  // Handle risk and impact questions (require file path)
  const filePath = question.match(/[\w\/\-]+\.\w+/)?.[0] || "";

  if (!filePath) {
    throw new Error(`No file path found in question: ${question}`);
  }

  if (!intentMap[intent] || intent === "unknown") {
    throw new Error(`Unknown question: ${question}`);
  }

  return intentMap[intent](repoPath, filePath, true);
}
