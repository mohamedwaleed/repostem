import { AdapterFactory, SnapshotRepository, SnapshotHistoryRecord } from "../index";
import { checkConfigFile, getConfig } from "../config/config-loader";
import { detectBranch } from "../utils/git";
import { HistoryOptions } from "../types";

/**
 * Get snapshot history for a repository
 */
export async function getSnapshotHistory(
  options: HistoryOptions = {}
): Promise<SnapshotHistoryRecord[]> {
  const repoPath = options.repo || process.cwd();

  if (!checkConfigFile(repoPath)) {
    throw new Error(
      "No .repostem.json found in this repository. Run `repostem init` first."
    );
  }

  const config = getConfig(repoPath);

  if (!config.repo_id || !config.storage_type || !config.storage_path) {
    throw new Error(
      ".repostem.json is missing repo_id / storage_type / storage_path. Run `repostem init` to repair."
    );
  }

  const adapter = AdapterFactory.createAdapterFromString(
    config.storage_type,
    config.storage_path
  );
  await adapter.connect();

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
      const detectedBranch = await detectBranch(repoPath);
      branch = detectedBranch || undefined;
    }

    const snapshots = branch
      ? await repo.getSnapshotsByBranch(config.repo_id, branch)
      : await repo.getSnapshotsByRepoId(config.repo_id);

    return snapshots;
  } finally {
    await adapter.disconnect();
  }
}
