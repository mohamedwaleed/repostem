import { outputGeneric, OutputFormat, parseOutputFormat } from "./generic-output";
import { enrichProjectAnalysis } from "./analysis-presenter";

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