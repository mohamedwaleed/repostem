import { FileAnalysis, FileImpactResult } from "../types";
import { explainRisk, explainImpact } from "./explainer";

type Intent = "risk" | "impact" | "driftSummary" | "hotspots" | "fileTrend" | "unknown";

export function detectIntent(question: string): Intent {
    const questionLower = question.toLowerCase();

    // Trend questions
    const trendKeywords = ["getting worse", "trend", "increasing", "decreasing", "evolving", "evolution"];
    if (trendKeywords.some(keyword => questionLower.includes(keyword))) {
        return "fileTrend";
    }

    // Drift questions
    const driftKeywords = ["changed", "drift", "changes", "difference", "compare"];
    if (driftKeywords.some(keyword => questionLower.includes(keyword))) {
        return "driftSummary";
    }

    // Hotspot questions
    const hotspotKeywords = ["hotspot", "biggest problem", "problematic", "worst", "most critical"];
    if (hotspotKeywords.some(keyword => questionLower.includes(keyword))) {
        return "hotspots";
    }

    // Risk questions
    const riskKeywords = ["risk", "risks", "threat", "threats", "danger", "hazard", "fragile"];
    if (riskKeywords.some(keyword => questionLower.includes(keyword))) {
        return "risk";
    }

    // Impact questions
    const impactKeywords = ["impact", "impacts", "consequence", "consequences", "effect", "effects", "result", "results"];
    if (impactKeywords.some(keyword => questionLower.includes(keyword))) {
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