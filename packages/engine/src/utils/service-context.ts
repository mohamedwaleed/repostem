import { AdapterFactory, ServiceContext, ServiceOptions, SnapshotRepository } from "../index";
import { checkConfigFile, getConfig } from "../config/config-loader";
import { detectBranch } from "./git";


/**
 * Executes an operation with common repository context setup/teardown.
 * 
 * This handles:
 * - Resolving repo path from options or cwd
 * - Validating config file exists and has required fields
 * - Creating and connecting adapter
 * - Resolving branch (explicit, auto-detected, or unfiltered)
 * - Ensuring cleanup via disconnect in finally block
 * 
 * @param options - Service options containing repo path and branch preferences
 * @param operation - The service-specific operation to execute with the context
 * @returns The result of the operation
 */
export async function withServiceContext<T>(
  options: ServiceOptions,
  operation: (context: ServiceContext) => Promise<T>
): Promise<T> {
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

    return await operation({
      repoPath,
      config: {
        repo_id: config.repo_id,
        storage_type: config.storage_type,
        storage_path: config.storage_path,
      },
      repo,
      adapter,
      branch,
    });
  } finally {
    await adapter.disconnect();
  }
}
