import { AIProvider, FileAnalysis } from "../types";
import { getAIService } from "./ai-service-factory";

const systemPrompt = `
You are a software architecture analysis assistant.
Your task is to explain structural risk based strictly on the provided metrics.
Do not invent facts.
Do not assume missing data.
Do not suggest code changes unless directly supported by the metrics.
Base your explanation only on the metrics provided.
Keep the explanation concise, technical, and practical.
`;

const buildExplanationPrompt = (fileAnalysis: FileAnalysis) => {
    /*
    Example 
    - centrality: 0.75
    - coupling: 0.6
    - churn: 0.3
    - circularDependency: 0
    - Risk Score: 0.52
    */
    const metricsLines = Object.entries(fileAnalysis.metrics)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n');
    
    return `
File: ${fileAnalysis.file}
Structural Metrics:
${metricsLines}
- Risk Score: ${fileAnalysis.riskScore}
Explain:
1. What these metrics imply structurally.
2. Why the file may be considered low/moderate/high risk.
3. What architectural concerns these metrics suggest.
    `;
};

export async function explainFileRiskUsingAI(fileAnalysis: FileAnalysis) {
    const model = process.env.AI_MODEL || "gpt-4o";
    const provider = process.env.AI_PROVIDER || "openai";
    const prompt = buildExplanationPrompt(fileAnalysis);
    const aiService = getAIService(provider as AIProvider);
    const response = await aiService.call(model, systemPrompt, prompt);
    return response;
}
