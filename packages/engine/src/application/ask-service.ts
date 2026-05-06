import { detectIntent } from "../ai-explanation-layer/intent-router";
import { explainFileRisk, explainFileImpact } from "./analyze-service";
import { detectDrift } from "./drift-service";
import { calculateHotspots } from "./hotspot-service";
import { calculateHotspotTrends } from "./hotspot-trend-service";
import { explainDrift, explainHotspots, explainTrend } from "../ai-explanation-layer/explainer";
import { AskServiceOptions } from "../types";
import { ProgressEmitter, emitProgress } from "../utils/progress-emitter";

const intentMap: Record<string, (repoPath: string, filePath: string, explain?: boolean) => Promise<string>> = {
  "risk": explainFileRisk,
  "impact": explainFileImpact,
};

/**
 * Ask a natural language question about a file
 *
 * @param question - The question to ask
 * @param repoPath - The repository path
 * @param options - Optional service options (branch, since, noBranchFilter)
 * @param progressEmitter - Optional progress emitter for real-time progress
 * @returns The answer string
 */
export async function ask(
  question: string, 
  repoPath: string, 
  options: AskServiceOptions = {},
  progressEmitter?: ProgressEmitter
): Promise<string> {
  const intent = detectIntent(question);

  // Handle drift summary questions
  if (intent === "driftSummary") {
    emitProgress(progressEmitter, 'snapshots:loading', undefined);
    const driftResult = await detectDrift({
      repo: repoPath,
      branch: options.branch,
      noBranchFilter: options.noBranchFilter,
      since: options.since
    }, progressEmitter);
    emitProgress(progressEmitter, 'snapshots:loaded', { count: 2 });
    
    if (!driftResult) {
      return "No drift detected - insufficient snapshots available for comparison.";
    }
    
    emitProgress(progressEmitter, 'ai:generating', undefined);
    const result = explainDrift(driftResult);
    emitProgress(progressEmitter, 'ai:generated', undefined);
    return result;
  }

  // Handle hotspot questions
  if (intent === "hotspots") {
    emitProgress(progressEmitter, 'snapshots:loading', undefined);
    const hotspots = await calculateHotspots(repoPath, 0.2, 5, progressEmitter);
    emitProgress(progressEmitter, 'snapshots:loaded', { count: 1 });
    
    emitProgress(progressEmitter, 'ai:generating', undefined);
    const result = explainHotspots(hotspots);
    emitProgress(progressEmitter, 'ai:generated', undefined);
    return result;
  }

  // Handle trend questions
  if (intent === "fileTrend") {
    emitProgress(progressEmitter, 'snapshots:loading', undefined);
    const trends = await calculateHotspotTrends({
      repo: repoPath,
      branch: options.branch,
      noBranchFilter: options.noBranchFilter,
      since: options.since
    }, 0.05, 5, progressEmitter);
    emitProgress(progressEmitter, 'snapshots:loaded', { count: trends.length });
    
    emitProgress(progressEmitter, 'ai:generating', undefined);
    const result = explainTrend(trends);
    emitProgress(progressEmitter, 'ai:generated', undefined);
    return result;
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
