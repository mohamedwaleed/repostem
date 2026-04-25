import { Command } from "commander";
import {
  AdapterFactory,
  SnapshotRepository,
  SnapshotRecord,
  checkConfigFile,
  getConfig,
} from "@repostem/engine";
import { execSync } from "child_process";

interface HistoryOptions {
  repo?: string;
  branch?: string;
  noBranchFilter?: boolean;
}

/**
 * Detect the current Git branch for the given working directory. Returns
 * undefined when the directory is not a Git work tree (or `git` is missing
 * / errors), so the caller can fall back to listing all branches.
 */
function detectGitBranch(repoPath: string): string | undefined {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: repoPath,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return branch && branch !== "HEAD" ? branch : undefined;
  } catch {
    return undefined;
  }
}

function formatRow(s: SnapshotRecord): string[] {
  return [
    s.id,
    s.created_at instanceof Date
      ? s.created_at.toISOString()
      : String(s.created_at),
    s.commit_hash ?? "",
    s.total_files !== null ? String(s.total_files) : "",
    s.cycle_count !== null ? String(s.cycle_count) : "",
    s.branch ?? "",
  ];
}

function printTable(snapshots: SnapshotRecord[]): void {
  const headers = [
    "snapshot_id",
    "created_at",
    "commit_hash",
    "total_files",
    "cycle_count",
    "branch",
  ];
  const rows = snapshots.map(formatRow);
  // Compute column widths from header + cell content so the table aligns
  // even when commit hashes / branch names vary in length across rows.
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

export default new Command()
  .name("history")
  .description(
    "Display persisted snapshot history for the current repository"
  )
  .option("-r, --repo <path>", "Path to repository")
  .option(
    "-b, --branch <name>",
    "Filter by branch (defaults to the current Git branch when in a Git repo)"
  )
  .option(
    "--no-branch-filter",
    "Show snapshots from every branch (overrides branch detection)"
  )
  .action(async (options: HistoryOptions) => {
    const repoPath = options.repo || process.cwd();

    if (!checkConfigFile(repoPath)) {
      console.error(
        "Error: no .repostem.json found in this repository. Run `repostem init` first."
      );
      process.exitCode = 1;
      return;
    }

    let config;
    try {
      config = getConfig(repoPath);
    } catch (err) {
      console.error(
        `Error: failed to read .repostem.json: ${(err as Error).message}`
      );
      process.exitCode = 1;
      return;
    }

    if (!config.repo_id || !config.storage_type || !config.storage_path) {
      console.error(
        "Error: .repostem.json is missing repo_id / storage_type / storage_path. Run `repostem init` to repair."
      );
      process.exitCode = 1;
      return;
    }

    const adapter = AdapterFactory.createAdapterFromString(
      config.storage_type,
      config.storage_path
    );
    try {
      await adapter.connect();
    } catch (err) {
      console.error(
        `Error: failed to connect to storage backend: ${(err as Error).message}`
      );
      process.exitCode = 1;
      return;
    }

    try {
      const repo = new SnapshotRepository(adapter);
      // Branch resolution: explicit --branch wins, then auto-detected
      // current Git branch, then unfiltered list when --no-branch-filter
      // was passed or no Git context is available.
      let branch: string | undefined;
      if (options.noBranchFilter === true) {
        branch = undefined;
      } else if (options.branch) {
        branch = options.branch;
      } else {
        branch = detectGitBranch(repoPath);
      }

      const snapshots = branch
        ? await repo.getSnapshotsByBranch(config.repo_id, branch)
        : await repo.getSnapshotsByRepoId(config.repo_id);

      if (snapshots.length === 0) {
        const scope = branch ? `branch '${branch}'` : "this repository";
        console.log(`No snapshots found for ${scope}.`);
        return;
      }

      if (branch) {
        console.log(`Snapshots for branch '${branch}':`);
      } else {
        console.log("Snapshots (all branches):");
      }
      printTable(snapshots);
    } finally {
      await adapter.disconnect();
    }
  });
