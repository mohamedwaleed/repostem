import { isNumber } from "lodash";
import { classify } from "../../utils/classify";
import { getMetricLabel } from "../../metric-labels";
import { FileAnalysis } from "../../types";

export const buildRiskExplanationPrompt = (fileAnalysis: FileAnalysis) => {
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