import { FileImpactResult } from "../../types";

export const buildFileImpactExplanationPrompt = (fileImpact: FileImpactResult) => {
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
