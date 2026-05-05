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
  outputGeneric(result, format, {
    title: "File Risk Analysis",
    headers: ["Metric", "Value"]
  });
}

export function outputFileImpact(result: any, format: OutputFormat = OutputFormat.TEXT): void {
  outputGeneric(result, format, {
    title: "File Impact Analysis",
    headers: ["Metric", "Value"]
  });
}

export function outputCycles(cycles: any, format: OutputFormat = OutputFormat.TEXT): void {
  outputGeneric(cycles, format, {
    title: "Circular Dependencies",
    headers: ["Cycle", "Files", "Length"]
  });
}

export function outputDrift(result: any, format: OutputFormat = OutputFormat.TEXT): void {
  if (format === OutputFormat.JSON) {
    outputGeneric(result, format, { title: "Architectural Drift" });
    return;
  }
  
  console.log(getBanner());
  
  const lines: string[] = [];
  
  // Header
  lines.push(chalk.bold.cyan('=== Architectural Drift (Snapshot Comparison) ==='));
  lines.push('');
  
  // Snapshot info
  lines.push(chalk.bold('Previous Snapshot:'));
  lines.push(chalk.gray(`  - Commit: ${result.previousSnapshot?.commitHash?.substring(0, 7) ?? 'unknown'}`));
  lines.push(chalk.gray(`  - Dirty: ${result.previousSnapshot?.dirty ? 'true' : 'false'}`));
  lines.push(chalk.gray(`  - Date: ${formatDate(result.previousSnapshot?.date)}`));
  lines.push('');
  
  lines.push(chalk.bold('Current Snapshot:'));
  lines.push(chalk.gray(`  - Commit: ${result.currentSnapshot?.commitHash?.substring(0, 7) ?? 'unknown'}`));
  lines.push(chalk.gray(`  - Dirty: ${result.currentSnapshot?.dirty ? 'true' : 'false'}`));
  lines.push(chalk.gray(`  - Date: ${formatDate(result.currentSnapshot?.date)}`));
  lines.push('');
  lines.push(chalk.gray('----------------------------------------'));
  
  // Risk Changes
  lines.push('');
  lines.push(chalk.bold.red('Risk Changes:'));
  const riskIncreased = result.riskChanges?.increasedCount ?? 0;
  const riskDecreased = result.riskChanges?.decreasedCount ?? 0;
  lines.push(chalk.gray(`  - ${riskIncreased} file${riskIncreased !== 1 ? 's' : ''} increased risk level`));
  lines.push(chalk.gray(`  - ${riskDecreased} file${riskDecreased !== 1 ? 's' : ''} decreased risk level`));
  
  if (result.riskChanges?.items?.length > 0) {
    lines.push('');
    for (const item of result.riskChanges.items) {
      const delta = item.delta ?? 0;
      const arrow = delta > 0 ? chalk.red('↑') : chalk.green('↓');
      const deltaStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
      const deltaColor = delta > 0 ? chalk.red : chalk.green;
      lines.push(`  ${arrow} ${chalk.white(item.file)}`);
      lines.push(chalk.gray(`    Risk: ${(item.previousRisk ?? 0).toFixed(2)} → ${(item.currentRisk ?? 0).toFixed(2)} (${deltaColor(deltaStr)})`));
    }
  }
  lines.push('');
  lines.push(chalk.gray('----------------------------------------'));
  
  // Impact Changes
  lines.push('');
  lines.push(chalk.bold.yellow('Impact Changes:'));
  const impactIncreased = result.impactChanges?.increasedCount ?? 0;
  const impactDecreased = result.impactChanges?.decreasedCount ?? 0;
  lines.push(chalk.gray(`  - ${impactIncreased} file${impactIncreased !== 1 ? 's' : ''} increased blast radius`));
  lines.push(chalk.gray(`  - ${impactDecreased} file${impactDecreased !== 1 ? 's' : ''} decreased blast radius`));
  
  if (result.impactChanges?.items?.length > 0) {
    lines.push('');
    for (const item of result.impactChanges.items) {
      const delta = item.delta ?? 0;
      const arrow = delta > 0 ? chalk.yellow('↑') : chalk.blue('↓');
      const deltaStr = delta > 0 ? `+${(delta * 100).toFixed(1)}%` : `${(delta * 100).toFixed(1)}%`;
      const deltaColor = delta > 0 ? chalk.yellow : chalk.blue;
      const prevPct = ((item.previousImpactRatio ?? 0) * 100).toFixed(0);
      const currPct = ((item.currentImpactRatio ?? 0) * 100).toFixed(0);
      lines.push(`  ${arrow} ${chalk.white(item.file)}`);
      lines.push(chalk.gray(`    Impact: ${prevPct}% → ${currPct}% (${deltaColor(deltaStr)})`));
    }
  }
  lines.push('');
  lines.push(chalk.gray('----------------------------------------'));
  
  // Dependency Changes
  lines.push('');
  lines.push(chalk.bold.magenta('Dependency Changes:'));
  const newEdges = result.dependencyChanges?.newEdges ?? 0;
  const removedEdges = result.dependencyChanges?.removedEdges ?? 0;
  lines.push(chalk.gray(`  - ${newEdges} new structural edge${newEdges !== 1 ? 's' : ''} introduced`));
  lines.push(chalk.gray(`  - ${removedEdges} edge${removedEdges !== 1 ? 's' : ''} removed`));
  lines.push('');
  lines.push(chalk.gray('----------------------------------------'));
  
  // Cycle Changes
  lines.push('');
  lines.push(chalk.bold.hex('#FFA500')('Cycle Changes:'));
  const newCycles = result.cycleChanges?.newCycles?.length ?? 0;
  const resolvedCycles = result.cycleChanges?.resolvedCycles?.length ?? 0;
  lines.push(chalk.gray(`  - ${newCycles} new cyclic group${newCycles !== 1 ? 's' : ''} detected`));
  lines.push(chalk.gray(`  - ${resolvedCycles} cycle${resolvedCycles !== 1 ? 's' : ''} resolved`));
  
  if (result.cycleChanges?.newCycles?.length > 0) {
    lines.push('');
    for (const cycle of result.cycleChanges.newCycles) {
      lines.push(chalk.red(`  New Cycle (${cycle.nodes?.length ?? 0} files):`));
      for (const node of cycle.nodes ?? []) {
        lines.push(chalk.gray(`    - ${node}`));
      }
    }
  }
  
  if (result.cycleChanges?.resolvedCycles?.length > 0) {
    lines.push('');
    for (const cycle of result.cycleChanges.resolvedCycles) {
      lines.push(chalk.green(`  Resolved Cycle (${cycle.nodes?.length ?? 0} files):`));
      for (const node of cycle.nodes ?? []) {
        lines.push(chalk.gray(`    - ${node}`));
      }
    }
  }
  lines.push('');
  lines.push(chalk.gray('----------------------------------------'));
  
  // Hotspot Changes
  lines.push('');
  lines.push(chalk.bold.hex('#FF6B6B')('Hotspot Changes:'));
  
  const maxDisplayHotspots = 5;
  
  if (result.hotspotChanges?.newHotspots?.length > 0) {
    lines.push('');
    lines.push(chalk.red('New Hotspots:'));
    const displayCount = Math.min(result.hotspotChanges.newHotspots.length, maxDisplayHotspots);
    for (let i = 0; i < displayCount; i++) {
      const hotspot = result.hotspotChanges.newHotspots[i];
      const delta = hotspot.delta ?? 0;
      const deltaStr = delta > 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3);
      lines.push(chalk.red(`+ ${hotspot.file}  (${deltaStr})`));
    }
    const remaining = result.hotspotChanges.newHotspots.length - maxDisplayHotspots;
    if (remaining > 0) {
      lines.push('');
      lines.push(chalk.gray(`(+${remaining} more files entered hotspot zone)`));
    }
  }
  
  if (result.hotspotChanges?.resolvedHotspots?.length > 0) {
    lines.push('');
    lines.push(chalk.green('Resolved Hotspots:'));
    const displayCount = Math.min(result.hotspotChanges.resolvedHotspots.length, maxDisplayHotspots);
    for (let i = 0; i < displayCount; i++) {
      const hotspot = result.hotspotChanges.resolvedHotspots[i];
      const delta = hotspot.delta ?? 0;
      const deltaStr = delta > 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3);
      lines.push(chalk.green(`- ${hotspot.file}  (${deltaStr})`));
    }
    const remaining = result.hotspotChanges.resolvedHotspots.length - maxDisplayHotspots;
    if (remaining > 0) {
      lines.push('');
      lines.push(chalk.gray(`(+${remaining} more files exited hotspot zone)`));
    }
  }
  
  if (!result.hotspotChanges?.newHotspots?.length && !result.hotspotChanges?.resolvedHotspots?.length) {
    lines.push(chalk.gray('  No hotspot changes detected'));
  }
  lines.push('');
  lines.push(chalk.gray('----------------------------------------'));
  
  // Summary
  lines.push('');
  lines.push(chalk.bold.cyan('Summary:'));
  const summary = generateDriftSummary(result);
  for (const line of summary) {
    lines.push(chalk.gray(line));
  }
  lines.push('');
  
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
  if (riskIncreased > riskDecreased) {
    signals.push('- Risk levels are increasing');
  } else if (riskDecreased > riskIncreased) {
    signals.push('- Risk levels are decreasing');
  }
  
  const impactIncreased = result.impactChanges?.increasedCount ?? 0;
  const impactDecreased = result.impactChanges?.decreasedCount ?? 0;
  if (impactIncreased > impactDecreased) {
    signals.push('- Blast radius is growing');
  } else if (impactDecreased > impactIncreased) {
    signals.push('- Blast radius is shrinking');
  }
  
  const newCycles = result.cycleChanges?.newCycles?.length ?? 0;
  const resolvedCycles = result.cycleChanges?.resolvedCycles?.length ?? 0;
  if (newCycles > resolvedCycles) {
    signals.push('- Circular dependencies are increasing');
  } else if (resolvedCycles > newCycles) {
    signals.push('- Circular dependencies are being resolved');
  }
  
  const newEdges = result.dependencyChanges?.newEdges ?? 0;
  if (newEdges > 100) {
    signals.push('- Significant structural changes detected');
  }
  
  const newHotspots = result.hotspotChanges?.newHotspots?.length ?? 0;
  const resolvedHotspots = result.hotspotChanges?.resolvedHotspots?.length ?? 0;
  if (newHotspots > 0) {
    signals.push(`- ${newHotspots} new architectural hotspots detected`);
  }
  if (resolvedHotspots > 0) {
    signals.push(`- ${resolvedHotspots} hotspots resolved`);
  }
  
  if (signals.length === 0) {
    return ['- No significant architectural drift detected'];
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
    // Simple list format for TEXT
    for (const s of snapshots) {
      console.log(`- id: ${s.id}`);
      console.log(`  repo_id: ${s.repo_id}`);
      console.log(`  git_remote_url: ${s.git_remote_url ?? 'null'}`);
      console.log(`  branch: ${s.branch ?? 'null'}`);
      console.log(`  commit_hash: ${s.commit_hash ?? 'null'}`);
      console.log(`  working_tree_dirty: ${s.working_tree_dirty}`);
      console.log(`  total_files: ${s.total_files}`);
      console.log(`  cycle_count: ${s.cycle_count}`);
      console.log(`  created_at: ${s.created_at}`);
    }
  } else {
    // TABLE format
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