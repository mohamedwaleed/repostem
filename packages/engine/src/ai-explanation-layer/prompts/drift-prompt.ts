import { DriftResult } from "../../types";

export const buildDriftExplanationPrompt = (driftResult: DriftResult) => {
    const riskChangesCount =
        driftResult.riskChanges.increasedCount +
        driftResult.riskChanges.decreasedCount;

    const impactChangesCount =
        driftResult.impactChanges.increasedCount +
        driftResult.impactChanges.decreasedCount;

    const newCyclesCount = driftResult.cycleChanges.newCycles.length;
    const resolvedCyclesCount = driftResult.cycleChanges.resolvedCycles.length;

    const newHotspotsCount = driftResult.hotspotChanges.newHotspots.length;
    const resolvedHotspotsCount = driftResult.hotspotChanges.resolvedHotspots.length;

    return `
Architectural Drift (Snapshot Comparison)

Risk Changes: ${riskChangesCount} files affected
Impact Changes: ${impactChangesCount} files affected
New Cycles: ${newCyclesCount}
Resolved Cycles: ${resolvedCyclesCount}
New Hotspots: ${newHotspotsCount}
Resolved Hotspots: ${resolvedHotspotsCount}

${riskChangesCount > 0 ? `
Risk Deltas:
${driftResult.riskChanges.items.slice(0, 5).map((change: any) =>
`- ${change.file}: ${change.previousRisk.toFixed(2)} → ${change.currentRisk.toFixed(2)} (${change.delta >= 0 ? '+' : ''}${change.delta.toFixed(2)})`
).join('\n')}
` : ''}

${impactChangesCount > 0 ? `
Impact Deltas:
${driftResult.impactChanges.items.slice(0, 5).map((change: any) =>
`- ${change.file}: ${(change.previousImpactRatio * 100).toFixed(1)}% → ${(change.currentImpactRatio * 100).toFixed(1)}% (${change.delta >= 0 ? '+' : ''}${(change.delta * 100).toFixed(1)}%)`
).join('\n')}
` : ''}

${newCyclesCount > 0 ? `
New Cycles:
${driftResult.cycleChanges.newCycles.slice(0, 3).map((cycle: any) =>
`- ${cycle.nodes.join(' → ')}`
).join('\n')}
` : ''}

${newHotspotsCount > 0 ? `
New Hotspots:
${driftResult.hotspotChanges.newHotspots.slice(0, 5).map((hotspot: any) =>
`- ${hotspot.file}: ${hotspot.previousHotspotScore.toFixed(3)} → ${hotspot.currentHotspotScore.toFixed(3)}`
).join('\n')}
` : ''}

Summarize:
1. The overall structural trend (increase, decrease, or stable).
2. Whether architectural complexity increased or decreased.
3. Where structural pressure shifted (if applicable).

Do not provide recommendations.
Do not infer causes.
Only describe patterns directly supported by the data.

Respond using exactly this structure:

=== Architectural Drift Summary ===
Overall Trend:
Complexity Direction:
Structural Pressure Shifts:
`;
};