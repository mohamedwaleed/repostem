import { detectIntent } from "../ai-explanation-layer/intent-router";
import { explainFileRisk, explainFileImpact } from "./analyze-service";

const intentMap: Record<string, (repoPath: string, filePath: string, explain?: boolean) => Promise<string>> = {
  "risk": explainFileRisk,
  "impact": explainFileImpact,
};

/**
 * Ask a natural language question about a file
 * 
 * @param question - The question to ask
 * @param repoPath - The repository path
 * @returns The answer string
 */
export async function ask(question: string, repoPath: string): Promise<string> {
  const filePath = question.match(/[\w\/\-]+\.\w+/)?.[0] || "";
  
  if (!filePath) {
    throw new Error(`No file path found in question: ${question}`);
  }
  
  const intent = detectIntent(question);

  if (!intentMap[intent] || intent === "unknown") {
    throw new Error(`Unknown question: ${question}`);
  }
  
  return intentMap[intent](repoPath, filePath, true);
}
