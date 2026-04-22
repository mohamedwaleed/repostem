import { FileAnalysis, FileImpactResult } from "../types";
import { explainRisk, explainImpact } from "./explainer";

type Intent = "risk" | "impact" | "unknown";

export function detectIntent(question: string): Intent {
    const riskKeywords = ["risk", "risks", "threat", "threats", "danger", "hazard", "fragile"];
    const impactKeywords = ["impact", "impacts", "consequence", "consequences", "effect", "effects", "result", "results"];
    if (riskKeywords.some(keyword => question.toLowerCase().includes(keyword))) {
        return "risk";
    }
    if (impactKeywords.some(keyword => question.toLowerCase().includes(keyword))) {
        return "impact";
    }
    return "unknown";
};


export async function explainRiskIntent(data: FileAnalysis) {
  return explainRisk(data);
}

export async function explainImpactIntent(data: FileImpactResult) {
  return explainImpact(data);
}