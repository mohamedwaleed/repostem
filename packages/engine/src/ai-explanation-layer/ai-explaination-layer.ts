import { AIProvider, FileAnalysis, FileImpactResult } from "../types";
import { getAIService } from "./ai-service-factory";
import { getMetricLabel } from "../metric-labels";
import { classify } from "../utils/classify";
import { isNumber } from "lodash";

const systemPrompt = `
You are a structural software architecture analysis assistant.
Your task is to explain structural signals strictly based on provided metrics.
Rules:
- Do not invent facts.
- Do not assume missing data.
- Do not use prior knowledge about the repository.
- Do not categorize files unless explicitly provided.
- Do not reference runtime behavior, business logic, or feature functionality.
- Do not speculate about developer intent.
- Do not reinterpret pre-classified levels.
- Only describe implications directly supported by the provided metrics.
All metric values are normalized between 0 and 1:
- Values near 0 indicate low magnitude.
- Values near 1 indicate high magnitude.
Keep explanations concise, technical, and grounded in the data.
`;

const buildRiskExplanationPrompt = (fileAnalysis: FileAnalysis) => {
    /*
    Example 
    - centrality: 0.75
    - coupling: 0.65
    - churn: 0.8
    - hasCircularDependency: true
    - riskScore: 0.71
    */
    // Get all metrics from the nested metrics object
    const metricsLines = Object.entries(fileAnalysis.metrics)
        .map(([key, value]) => `- ${getMetricLabel(key)}: ${value} (${isNumber(value) ? classify(value) : null})`)
        .join('\n');
    
    // Generate dynamic response structure from metrics keys
    const metricKeys = Object.keys(fileAnalysis.metrics);
    const metricSections = metricKeys
        .map(key => `${getMetricLabel(key)}:`)
        .join('\n');
    
    return `
File: ${fileAnalysis.file}

Structural Metrics:
${metricsLines}
- Risk Score: ${fileAnalysis.riskScore}
- Risk Level: ${classify(fileAnalysis.riskScore)}

Explain:
1. What each metric implies structurally.
2. Why the provided Risk Level is appropriate.
3. What structural concerns are supported by these metrics.

Respond using exactly this structure:

=== Structural Risk Analysis ===
${metricSections}
Overall Risk:
    `;
};
const buildFileImpactExplanationPrompt = (fileImpact: FileImpactResult) => {
    return `
File: ${fileImpact.file}

Impact Metrics:
- Direct Dependents Count: ${fileImpact.directDependents.length}
- Transitive Dependents Count: ${fileImpact.transitiveDependents.length}
- Total Impact Count: ${fileImpact.totalImpactCount}
- Impact Ratio: ${(fileImpact.impactRatio * 100).toFixed(2)}%

Explain:
1. What these dependency counts imply.
2. What the blast radius suggests about structural reach.
3. What change implications are supported by these counts.

Respond using exactly this structure:

=== Structural Impact Analysis ===
Direct Dependents:
Transitive Dependents:
Blast Radius:
Change Implications:
    `;
};

async function callAIService(prompt: string) {
    const model = process.env.AI_MODEL || "gpt-4o";
    const provider = process.env.AI_PROVIDER || "openai";
    const aiService = getAIService(provider as AIProvider);
    return await aiService.call(model, systemPrompt, prompt);
}

export async function explainFileRiskUsingAI(fileAnalysis: FileAnalysis) {
    const prompt = buildRiskExplanationPrompt(fileAnalysis);
    return await callAIService(prompt);
}

export async function explainFileImpactUsingAI(fileImpact: FileImpactResult) {
    const prompt = buildFileImpactExplanationPrompt(fileImpact);
    return await callAIService(prompt);
}
