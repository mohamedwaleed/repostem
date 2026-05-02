import { SnapshotHistoryRecord } from "../index";
import { ServiceOptions } from "../types";
import { withServiceContext } from "../utils/service-context";

/**
 * Get snapshot history for a repository
 */
export async function getSnapshotHistory(
  options: ServiceOptions = {}
): Promise<SnapshotHistoryRecord[]> {
  return withServiceContext(options, async (context) => {
    const snapshots = context.branch
      ? await context.repo.getSnapshotsByBranch(context.config.repo_id, context.branch)
      : await context.repo.getSnapshotsByRepoId(context.config.repo_id);

    return snapshots;
  });
}
