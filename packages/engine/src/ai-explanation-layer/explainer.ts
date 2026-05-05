import { FileAnalysis, FileImpactResult, DriftResult, Hotspot, HotspotTrendItem } from "../types";
import { buildFileImpactExplanationPrompt } from "./prompts/impact-prompt";
import { buildRiskExplanationPrompt } from "./prompts/risk-prompt";
import { buildDriftExplanationPrompt } from "./prompts/drift-prompt";
import { buildHotspotsExplanationPrompt } from "./prompts/hotspot-prompt";
import { buildTrendExplanationPrompt } from "./prompts/trend-prompt";
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

export async function explainDrift(data: DriftResult): Promise<string> {
  const aiProvider = aiProviderFactory();
  const prompt = buildDriftExplanationPrompt(data);
  return aiProvider.generateText(SYSTEM_PROMPT, prompt);
}

export async function explainHotspots(data: Hotspot[]): Promise<string> {
  const aiProvider = aiProviderFactory();
  const prompt = buildHotspotsExplanationPrompt(data);
  return aiProvider.generateText(SYSTEM_PROMPT, prompt);
}

export async function explainTrend(data: HotspotTrendItem[]): Promise<string> {
  const aiProvider = aiProviderFactory();
  const prompt = buildTrendExplanationPrompt(data);
  return aiProvider.generateText(SYSTEM_PROMPT, prompt);
}