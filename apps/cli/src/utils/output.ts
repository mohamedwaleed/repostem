import { outputGeneric, OutputFormat, parseOutputFormat, getBanner, printBanner } from "./generic-output";
import { enrichProjectAnalysis } from "./analysis-presenter";
import chalk from 'chalk';
import { classify, MetricClassification } from '@repostem/engine';

export { getBanner, printBanner };

export function outputProjectAnalysis(result: any, format: OutputFormat = OutputFormat.TEXT): void {
  const enrichedResult = enrichProjectAnalysis(result);
  const analysisFormat = format === OutputFormat.TEXT ? OutputFormat.ANALYSIS : format;
  outputGeneric(enrichedResult, analysisFormat, {
    title: "Repository Analysis",
    headers: ["Metric", "Value"]
  });
}

export function outputFileRisk(result: any, format: OutputFormat = OutputFormat.TEXT): void {
  if (format === OutputFormat.JSON) {
    outputGeneric(result, format, { title: "File Risk Analysis" });
    return;
  }

  const lines: string[] = [];

  lines.push(chalk.bold.white(`File: ${result.file}`));
  lines.push('');

  const riskColor = result.riskLevel === MetricClassification.HIGH ? chalk.red :
                    result.riskLevel === MetricClassification.MEDIUM ? chalk.yellow : chalk.green;
  lines.push(chalk.gray(`  Risk: ${riskColor(capitalize(result.riskLevel))} (${result.riskScore.toFixed(2)})`));

  const centColor = classify(result.centrality) === MetricClassification.HIGH ? chalk.magenta :
                    classify(result.centrality) === MetricClassification.MEDIUM ? chalk.yellow : chalk.gray;
  lines.push(chalk.gray(`  Dependency Importance: ${centColor(result.centrality.toFixed(2))}`));

  const coupColor = classify(result.coupling) === MetricClassification.HIGH ? chalk.magenta :
                    classify(result.coupling) === MetricClassification.MEDIUM ? chalk.yellow : chalk.gray;
  lines.push(chalk.gray(`  Connectivity: ${coupColor(result.coupling.toFixed(2))}`));

  const churnColor = classify(result.churn) === MetricClassification.HIGH ? chalk.hex('#FFA500') :
                     classify(result.churn) === MetricClassification.MEDIUM ? chalk.yellow : chalk.gray;
  lines.push(chalk.gray(`  Change Frequency: ${churnColor(result.churn.toFixed(2))}`));

  if (result.hasCircularDependency) {
    lines.push(chalk.red(`  Cyclic Dependency: Yes`));
  }

  console.log(lines.join('\n'));
}

export function outputFileImpact(result: any, format: OutputFormat = OutputFormat.TEXT): void {
  if (format === OutputFormat.JSON) {
    outputGeneric(result, format, { title: "File Impact Analysis" });
    return;
  }

  const lines: string[] = [];

  lines.push(chalk.bold.white(`File: ${result.file}`));
  lines.push('');

  const impactPct = (result.impactRatio * 100).toFixed(1);
  lines.push(chalk.gray(`  Direct dependents: ${result.directDependents?.length ?? 0}`));
  lines.push(chalk.gray(`  Transitive dependents: ${result.transitiveDependents?.length ?? 0}`));
  lines.push(chalk.gray(`  Total impact: ${result.totalImpactCount} files (${impactPct}% of codebase)`));

  if (result.directDependents?.length > 0) {
    lines.push('');
    lines.push(chalk.gray('  Direct dependents:'));
    const displayDeps = result.directDependents.slice(0, 5);
    for (const dep of displayDeps) {
      lines.push(chalk.gray(`    - ${dep}`));
    }
    const remaining = result.directDependents.length - 5;
    if (remaining > 0) {
      lines.push(chalk.gray(`    (+${remaining} more)`));
    }
  }

  console.log(lines.join('\n'));
}

export function outputCycles(cycles: any, format: OutputFormat = OutputFormat.TEXT): void {
  if (format === OutputFormat.JSON) {
    console.log(JSON.stringify(cycles, null, 2));
    return;
  }

  if (!cycles || cycles.length === 0) {
    console.log(chalk.gray('No circular dependency groups detected'));
    return;
  }

  const lines: string[] = [];
  lines.push(chalk.bold.hex('#FFA500')(`Circular Dependency Groups (${cycles.length}):`));
  lines.push('');

  for (let i = 0; i < cycles.length; i++) {
    const cycle = cycles[i];
    const nodes = cycle.nodes ?? [];
    lines.push(chalk.bold.white(`${i + 1}. ${nodes.length} files`));
    for (const node of nodes) {
      lines.push(chalk.gray(`   - ${node}`));
    }
    if (i < cycles.length - 1) {
      lines.push('');
    }
  }

  console.log(lines.join('\n'));
}

const DRIFT_MAX_ITEMS = 10;
const DRIFT_MAX_CYCLE_FILES = 5;

export function outputDrift(result: any, format: OutputFormat = OutputFormat.TEXT): void {
  if (format === OutputFormat.JSON) {
    outputGeneric(result, format, { title: "Architectural Drift" });
    return;
  }
  
  console.log(getBanner());
  
  const lines: string[] = [];
  
  // Header
  lines.push(chalk.bold.cyan('=== Architectural Drift ==='));
  lines.push('');
  
  // Snapshot info
  lines.push(chalk.bold('Previous Snapshot:'));
  lines.push(chalk.gray(`  Commit: ${result.previousSnapshot?.commitHash?.substring(0, 7) ?? 'unknown'}`));
  lines.push(chalk.gray(`  Dirty: ${result.previousSnapshot?.dirty ? 'yes' : 'no'}`));
  lines.push(chalk.gray(`  Date: ${formatDate(result.previousSnapshot?.date)}`));
  
  lines.push(chalk.bold('Current Snapshot:'));
  lines.push(chalk.gray(`  Commit: ${result.currentSnapshot?.commitHash?.substring(0, 7) ?? 'unknown'}`));
  lines.push(chalk.gray(`  Dirty: ${result.currentSnapshot?.dirty ? 'yes' : 'no'}`));
  lines.push(chalk.gray(`  Date: ${formatDate(result.currentSnapshot?.date)}`));
  lines.push('');
  
  // Risk Changes
  lines.push(chalk.bold.red('Risk Changes:'));
  const riskIncreased = result.riskChanges?.increasedCount ?? 0;
  const riskDecreased = result.riskChanges?.decreasedCount ?? 0;
  lines.push(chalk.gray(`  +${riskIncreased} / -${riskDecreased} files changed`));
  
  const riskItems = result.riskChanges?.items ?? [];
  const displayRiskItems = riskItems.slice(0, DRIFT_MAX_ITEMS);
  for (const item of displayRiskItems) {
    const delta = item.delta ?? 0;
    const arrow = delta > 0 ? chalk.red('↑') : chalk.green('↓');
    const deltaStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
    const deltaColor = delta > 0 ? chalk.red : chalk.green;
    lines.push(`  ${arrow} ${chalk.white(item.file)}`);
    lines.push(chalk.gray(`    ${(item.previousRisk ?? 0).toFixed(2)} → ${(item.currentRisk ?? 0).toFixed(2)} (${deltaColor(deltaStr)})`));
  }
  if (riskItems.length > DRIFT_MAX_ITEMS) {
    lines.push(chalk.gray(`  ... and ${riskItems.length - DRIFT_MAX_ITEMS} more`));
  }
  lines.push('');
  
  // Impact Changes
  lines.push(chalk.bold.yellow('Impact Changes:'));
  const impactIncreased = result.impactChanges?.increasedCount ?? 0;
  const impactDecreased = result.impactChanges?.decreasedCount ?? 0;
  lines.push(chalk.gray(`  +${impactIncreased} / -${impactDecreased} files changed`));
  
  const impactItems = result.impactChanges?.items ?? [];
  const displayImpactItems = impactItems.slice(0, DRIFT_MAX_ITEMS);
  for (const item of displayImpactItems) {
    const delta = item.impactRatioDelta ?? 0;
    const arrow = delta > 0 ? chalk.yellow('↑') : chalk.blue('↓');
    const deltaStr = delta > 0 ? `+${(delta * 100).toFixed(2)}%` : `${(delta * 100).toFixed(2)}%`;
    const deltaColor = delta > 0 ? chalk.yellow : chalk.blue;
    const prevPct = ((item.previousImpactRatio ?? 0) * 100).toFixed(2);
    const currPct = ((item.currentImpactRatio ?? 0) * 100).toFixed(2);
    const prevDependents = item.previousTransitiveDependents ?? 0;
    const currDependents = item.currentTransitiveDependents ?? 0;
    lines.push(`  ${arrow} ${chalk.white(item.file)}`);
    lines.push(chalk.gray(`    Impact: ${prevPct}% → ${currPct}% (${deltaColor(deltaStr)})`));
    lines.push(chalk.gray(`    Transitive Dependents: ${prevDependents} → ${currDependents} (${deltaColor(item.transitiveDependentsDelta > 0 ? `+${item.transitiveDependentsDelta}` : `${item.transitiveDependentsDelta}`)})`));
  }
  if (impactItems.length > DRIFT_MAX_ITEMS) {
    lines.push(chalk.gray(`  ... and ${impactItems.length - DRIFT_MAX_ITEMS} more`));
  }
  lines.push('');
  
  // Dependency Changes
  const newEdges = result.dependencyChanges?.newEdges ?? 0;
  const removedEdges = result.dependencyChanges?.removedEdges ?? 0;
  if (newEdges > 0 || removedEdges > 0) {
    lines.push(chalk.bold.magenta('Dependency Changes:'));
    lines.push(chalk.gray(`  +${newEdges} / -${removedEdges} edges`));
    lines.push('');
  }
  
  // Cycle Changes
  const newCycles = result.cycleChanges?.newCycles ?? [];
  const resolvedCycles = result.cycleChanges?.resolvedCycles ?? [];
  if (newCycles.length > 0 || resolvedCycles.length > 0) {
    lines.push(chalk.bold.hex('#FFA500')('Cycle Changes:'));
    lines.push(chalk.gray(`  +${newCycles.length} / -${resolvedCycles.length} cycles`));
    for (const cycle of newCycles) {
      const nodes = cycle.nodes ?? [];
      const displayNodes = nodes.slice(0, DRIFT_MAX_CYCLE_FILES);
      const nodeList = displayNodes.join(', ');
      const suffix = nodes.length > DRIFT_MAX_CYCLE_FILES ? `, +${nodes.length - DRIFT_MAX_CYCLE_FILES} more` : '';
      lines.push(chalk.red(`  + ${nodeList}${suffix}`));
    }
    for (const cycle of resolvedCycles) {
      const nodes = cycle.nodes ?? [];
      const displayNodes = nodes.slice(0, DRIFT_MAX_CYCLE_FILES);
      const nodeList = displayNodes.join(', ');
      const suffix = nodes.length > DRIFT_MAX_CYCLE_FILES ? `, +${nodes.length - DRIFT_MAX_CYCLE_FILES} more` : '';
      lines.push(chalk.green(`  - ${nodeList}${suffix}`));
    }
    lines.push('');
  }
  
  // Complexity Score Change
  const complexityDelta = result.complexityScoreChange?.delta;
  if (complexityDelta !== undefined && complexityDelta !== null) {
    lines.push(chalk.bold.cyan('Structural Complexity:'));
    const prev = result.complexityScoreChange.previousComplexityScore.toFixed(2);
    const curr = result.complexityScoreChange.currentComplexityScore.toFixed(2);
    const formattedDelta = complexityDelta > 0
      ? chalk.red(`+${complexityDelta.toFixed(2)}`)
      : chalk.green(`${complexityDelta.toFixed(2)}`);
    lines.push(chalk.gray(`  ${prev} → ${curr} (${formattedDelta})`));
    lines.push('');
  }
  
  // Hotspot Changes
  const newHotspots = result.hotspotChanges?.newHotspots ?? [];
  const resolvedHotspots = result.hotspotChanges?.resolvedHotspots ?? [];
  if (newHotspots.length > 0 || resolvedHotspots.length > 0) {
    lines.push(chalk.bold.hex('#FF6B6B')('Hotspot Changes:'));
    const displayCount = 5;
    if (newHotspots.length > 0) {
      for (let i = 0; i < Math.min(newHotspots.length, displayCount); i++) {
        const h = newHotspots[i];
        const deltaStr = (h.delta ?? 0) > 0 ? `+${(h.delta ?? 0).toFixed(3)}` : (h.delta ?? 0).toFixed(3);
        lines.push(chalk.red(`  + ${h.file} (${deltaStr})`));
      }
      if (newHotspots.length > displayCount) {
        lines.push(chalk.gray(`  ... +${newHotspots.length - displayCount} more`));
      }
    }
    if (resolvedHotspots.length > 0) {
      for (let i = 0; i < Math.min(resolvedHotspots.length, displayCount); i++) {
        const h = resolvedHotspots[i];
        const deltaStr = (h.delta ?? 0) > 0 ? `+${(h.delta ?? 0).toFixed(3)}` : (h.delta ?? 0).toFixed(3);
        lines.push(chalk.green(`  - ${h.file} (${deltaStr})`));
      }
      if (resolvedHotspots.length > displayCount) {
        lines.push(chalk.gray(`  ... -${resolvedHotspots.length - displayCount} more`));
      }
    }
    lines.push('');
  }
  
  // Summary
  lines.push(chalk.bold.cyan('Summary:'));
  const summary = generateDriftSummary(result);
  for (const line of summary) {
    lines.push(chalk.gray(line));
  }
  
  console.log(lines.join('\n'));
}

function formatDate(timestamp: number | Date | undefined): string {
  if (!timestamp) return 'unknown';
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toISOString().split('T')[0];
}

function generateDriftSummary(result: any): string[] {
  const signals: string[] = [];
  
  const riskIncreased = result.riskChanges?.increasedCount ?? 0;
  const riskDecreased = result.riskChanges?.decreasedCount ?? 0;
  if (riskIncreased > 0 || riskDecreased > 0) {
    signals.push(`- Risk: ${riskIncreased} up, ${riskDecreased} down`);
  }
  
  const impactIncreased = result.impactChanges?.increasedCount ?? 0;
  const impactDecreased = result.impactChanges?.decreasedCount ?? 0;
  if (impactIncreased > 0 || impactDecreased > 0) {
    signals.push(`- Impact: ${impactIncreased} wider, ${impactDecreased} narrower`);
  }
  
  const newEdges = result.dependencyChanges?.newEdges ?? 0;
  const removedEdges = result.dependencyChanges?.removedEdges ?? 0;
  if (newEdges > 0 || removedEdges > 0) {
    signals.push(`- Edges: ${newEdges} added, ${removedEdges} removed`);
  }
  
  const newCycles = result.cycleChanges?.newCycles?.length ?? 0;
  const resolvedCycles = result.cycleChanges?.resolvedCycles?.length ?? 0;
  if (newCycles > 0 || resolvedCycles > 0) {
    signals.push(`- Cycles: ${newCycles} new, ${resolvedCycles} resolved`);
  }
  
  const newHotspots = result.hotspotChanges?.newHotspots?.length ?? 0;
  const resolvedHotspots = result.hotspotChanges?.resolvedHotspots?.length ?? 0;
  if (newHotspots > 0 || resolvedHotspots > 0) {
    signals.push(`- Hotspots: ${newHotspots} entered, ${resolvedHotspots} exited`);
  }
  
  if (signals.length === 0) {
    return ['- No changes detected'];
  }
  
  return signals;
}

function formatSimpleTable(snapshots: any[], headers: string[]): void {
  if (snapshots.length === 0) {
    console.log("No data to display");
    return;
  }

  const rows = snapshots.map((s: any) => [
    s.id,
    s.created_at instanceof Date
      ? s.created_at.toISOString()
      : String(s.created_at),
    s.commit_hash ?? "",
    s.total_files !== null ? String(s.total_files) : "",
    s.cycle_count !== null ? String(s.cycle_count) : "",
    s.branch ?? "",
  ]);

  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i].length))
  );

  const line = (cells: string[]): string =>
    cells.map((c, i) => c.padEnd(widths[i])).join("  ");

  console.log(line(headers));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of rows) {
    console.log(line(row));
  }
}

export function outputSnapshotHistory(snapshots: any, format: OutputFormat = OutputFormat.TABLE): void {
  if (format === OutputFormat.JSON) {
    outputGeneric(snapshots, format, {
      title: "Snapshot History",
      headers: ["snapshot_id", "created_at", "commit_hash", "total_files", "cycle_count", "branch"]
    });
  } else if (format === OutputFormat.TEXT) {
    for (const s of snapshots) {
      const date = s.created_at instanceof Date ? s.created_at.toISOString().split('T')[0] : String(s.created_at).split('T')[0];
      const commit = s.commit_hash ? s.commit_hash.substring(0, 7) : 'null';
      const dirty = s.working_tree_dirty ? ' (dirty)' : '';
      console.log(`  ${s.id}  ${date}  ${commit}  files:${s.total_files ?? '-'}  cycles:${s.cycle_count ?? '-'}  ${s.branch ?? 'null'}${dirty}`);
    }
  } else {
    const headers = [
      "snapshot_id",
      "created_at",
      "commit_hash",
      "total_files",
      "cycle_count",
      "branch",
    ];
    formatSimpleTable(snapshots, headers);
  }
}

export function outputHotspot(hotspots: any[], format: OutputFormat = OutputFormat.TEXT): void {
  if (format === OutputFormat.JSON) {
    const hotspotArray = hotspots.map((hotspot) => ({
      file: hotspot.file,
      ...hotspot
    }));
    console.log(JSON.stringify(hotspotArray, null, 2));
    return;
  }

  console.log(getBanner());
  
  const lines: string[] = [];
  
  // Header
  lines.push(chalk.bold.hex('#FF6B6B')('=== Architectural Hotspots (Current Snapshot) ==='));
  lines.push('');
  
  if (hotspots.length === 0) {
    lines.push(chalk.gray('No hotspots detected'));
    console.log(lines.join('\n'));
    return;
  }
  
  // Display all hotspots
  for (let i = 0; i < hotspots.length; i++) {
    const hotspot = hotspots[i];
    const index = i + 1;
    
    lines.push(chalk.bold.white(`${index}. ${hotspot.file}`));
    
    // Risk with classification
    const riskLevel = classify(hotspot.riskScore);
    const riskColor = riskLevel === MetricClassification.HIGH ? chalk.red : 
                      riskLevel === MetricClassification.MEDIUM ? chalk.yellow : chalk.green;
    lines.push(chalk.gray(`   - Risk: ${riskColor(capitalize(riskLevel))} (${hotspot.riskScore.toFixed(2)})`));
    
    // Impact as percentage
    const impactPct = (hotspot.impactRatio * 100).toFixed(1);
    lines.push(chalk.gray(`   - Impact: ${impactPct}%`));
    
    // Churn with classification
    const churnLevel = classify(hotspot.churn);
    const churnColor = churnLevel === MetricClassification.HIGH ? chalk.red : 
                       churnLevel === MetricClassification.MEDIUM ? chalk.yellow : chalk.gray;
    lines.push(chalk.gray(`   - Churn: ${churnColor(capitalize(churnLevel))} (${hotspot.churn.toFixed(2)})`));
    
    // Circular dependency
    if (hotspot.circularDependency > 0) {
      lines.push(chalk.red(`   - Circular Dependency: Yes`));
    }
    
    // Hotspot score with classification
    const hotspotLevel = classify(hotspot.hotspotScore);
    const hotspotColor = hotspotLevel === MetricClassification.HIGH ? chalk.red : 
                         hotspotLevel === MetricClassification.MEDIUM ? chalk.yellow : chalk.green;
    lines.push(chalk.gray(`   - Hotspot Score: ${hotspotColor(capitalize(hotspotLevel))} (${hotspot.hotspotScore.toFixed(2)})`));
    
    if (i < hotspots.length - 1) {
      lines.push('');
    }
  }
  
  console.log(lines.join('\n'));
}

export function outputHotspotTrend(trends: any[], format: OutputFormat = OutputFormat.TEXT): void {
  if (format === OutputFormat.JSON) {
    const trendArray = trends.map((trend) => ({
      file: trend.file,
      ...trend
    }));
    console.log(JSON.stringify(trendArray, null, 2));
    return;
  }

  console.log(getBanner());
  
  const lines: string[] = [];
  
  lines.push(chalk.bold.hex('#FF6B6B')('=== Architectural Hotspots (Trending) ==='));
  lines.push('');
  
  if (trends.length === 0) {
    lines.push(chalk.gray('No trending hotspots detected'));
    console.log(lines.join('\n'));
    return;
  }
  
  for (let i = 0; i < trends.length; i++) {
    const trend = trends[i];
    const index = i + 1;
    
    lines.push(chalk.bold.white(`${index}. ${trend.file}`));
    
    const riskDeltaFormatted = trend.riskDelta >= 0 
      ? chalk.red(`+${trend.riskDelta.toFixed(2)}`)
      : chalk.green(`${trend.riskDelta.toFixed(2)}`);
    lines.push(chalk.gray(`   Risk: ${trend.previousRiskScore.toFixed(2)} → ${trend.currentRiskScore.toFixed(2)} (${riskDeltaFormatted})`));
    
    const impactDeltaPct = (trend.impactDelta * 100).toFixed(1);
    const prevImpactPct = (trend.previousImpactRatio * 100).toFixed(1);
    const currImpactPct = (trend.currentImpactRatio * 100).toFixed(1);
    
    if (Math.abs(trend.impactDelta) > 0.01) {
      const impactDeltaFormatted = trend.impactDelta >= 0 
        ? chalk.red(`+${impactDeltaPct}%`)
        : chalk.green(`${impactDeltaPct}%`);
      lines.push(chalk.gray(`   Impact: ${prevImpactPct}% → ${currImpactPct}% (${impactDeltaFormatted})`));
    } else {
      lines.push(chalk.gray(`   Impact: stable at ${currImpactPct}%`));
    }
    
    const trendScoreLevel = classify(trend.trendScore);
    const trendScoreColor = trendScoreLevel === MetricClassification.HIGH ? chalk.red : 
                             trendScoreLevel === MetricClassification.MEDIUM ? chalk.yellow : chalk.green;
    lines.push(chalk.gray(`   Trend Score: ${trendScoreColor(capitalize(trendScoreLevel))} (${trend.trendScore.toFixed(2)})`));
    
    if (i < trends.length - 1) {
      lines.push('');
    }
  }
  
  console.log(lines.join('\n'));
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export { OutputFormat, parseOutputFormat };
