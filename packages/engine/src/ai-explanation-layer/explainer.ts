import { FileAnalysis, FileImpactResult } from "../types";
import { buildFileImpactExplanationPrompt } from "./prompts/impact-prompt";
import { buildRiskExplanationPrompt } from "./prompts/risk-prompt";
import { SYSTEM_PROMPT } from "./system-prompt";
import { aiProviderFactory } from "./ai-provider-factory";

export async function explainRisk(data: FileAnalysis): Promise<string> {
  const aiProvider = aiProviderFactory();
  const prompt = buildRiskExplanationPrompt(data);
  return aiProvider.generateText(SYSTEM_PROMPT, prompt);
}

export async function explainImpact(data: FileImpactResult): Promise<string> {
  const aiProvider = aiProviderFactory();
  const prompt = buildFileImpactExplanationPrompt(data);
  return aiProvider.generateText(SYSTEM_PROMPT, prompt);
}