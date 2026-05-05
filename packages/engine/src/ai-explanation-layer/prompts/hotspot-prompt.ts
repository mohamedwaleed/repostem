import { Hotspot } from "../../types";

export const buildHotspotsExplanationPrompt = (hotspots: Hotspot[]) => {
    return `
Architectural Hotspots (Current Snapshot)

Total Hotspots Identified: ${hotspots.length}

${hotspots.length > 0 ? `
Top Hotspots:
${hotspots.slice(0, 5).map((hotspot, index) =>
`${index + 1}. ${hotspot.file}
   - Risk Score: ${hotspot.riskScore.toFixed(3)}
   - Impact Ratio: ${(hotspot.impactRatio * 100).toFixed(2)}%
   - Churn: ${hotspot.churn.toFixed(3)}
   - Circular Dependency: ${hotspot.circularDependency > 0 ? 'Yes' : 'No'}
   - Hotspot Score: ${hotspot.hotspotScore.toFixed(3)}`
).join('\n\n')}
` : 'No significant structural hotspots detected.'}

Summarize:
1. The structural characteristics shared by these hotspots.
2. How risk, impact, churn, and cycles contribute to their scores.
3. How structural pressure is distributed across the repository.

Do not provide recommendations.
Do not suggest refactoring.
Do not infer causes.
Only describe patterns directly supported by the provided metrics.

Respond using exactly this structure:

=== Architectural Hotspots Summary ===
Structural Characteristics:
Pressure Distribution:
`;
};