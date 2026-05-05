import { HotspotTrendItem } from "../../types";

export const buildTrendExplanationPrompt = (trends: HotspotTrendItem[]) => {
    return `
Architectural Hotspot Trend Analysis

Total Trending Hotspots: ${trends.length}

${trends.length > 0 ? `
Top Trending Hotspots:
${trends.slice(0, 5).map((trend, index) =>
`${index + 1}. ${trend.file}
   - Risk: ${trend.previousRiskScore.toFixed(3)} → ${trend.currentRiskScore.toFixed(3)} (${trend.riskDelta >= 0 ? '+' : ''}${trend.riskDelta.toFixed(3)})
   - Impact: ${(trend.previousImpactRatio * 100).toFixed(2)}% → ${(trend.currentImpactRatio * 100).toFixed(2)}% (${trend.impactDelta >= 0 ? '+' : ''}${(trend.impactDelta * 100).toFixed(2)}%)
   - Trend Score: ${trend.trendScore.toFixed(3)}`
).join('\n\n')}
` : 'No significant structural trend detected.'}

Summarize:
1. The overall structural direction indicated by these trends.
2. Whether structural pressure is increasing or decreasing.
3. Which modules show sustained growth in risk or impact.

Do not provide recommendations.
Do not speculate about root causes.
Do not suggest refactoring.
Only describe patterns supported by the provided deltas.

Respond using exactly this structure:

=== Architectural Trend Summary ===
Structural Direction:
Pressure Evolution:
Key Modules:
`;
};