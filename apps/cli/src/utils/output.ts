import { outputGeneric, OutputFormat, parseOutputFormat, getBanner, printBanner } from "./generic-output";
import { enrichProjectAnalysis } from "./analysis-presenter";
import chalk from 'chalk';

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
  
  if (result.hotspotChanges?.newHotspots?.length > 0) {
    lines.push('');
    lines.push(chalk.red('New Hotspots:'));
    for (const hotspot of result.hotspotChanges.newHotspots) {
      const delta = hotspot.delta ?? 0;
      const deltaStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
      lines.push(chalk.red(`  + ${hotspot.file}`));
      lines.push(chalk.gray(`    Score: ${(hotspot.previousHotspotScore ?? 0).toFixed(2)} → ${(hotspot.currentHotspotScore ?? 0).toFixed(2)} (${deltaStr})`));
    }
  }
  
  if (result.hotspotChanges?.resolvedHotspots?.length > 0) {
    lines.push('');
    lines.push(chalk.green('Resolved Hotspots:'));
    for (const hotspot of result.hotspotChanges.resolvedHotspots) {
      const delta = hotspot.delta ?? 0;
      const deltaStr = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
      lines.push(chalk.green(`  - ${hotspot.file}`));
      lines.push(chalk.gray(`    Score: ${(hotspot.previousHotspotScore ?? 0).toFixed(2)} → ${(hotspot.currentHotspotScore ?? 0).toFixed(2)} (${deltaStr})`));
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
  if (impactIncreased > 0) {
    signals.push('- Blast radius is growing');
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

export { OutputFormat, parseOutputFormat };