import { Command } from "commander";
import {
  getSnapshotHistory,
  HistoryOptions,
} from "@repostem/engine";
import { outputSnapshotHistory, parseOutputFormat, OutputFormat } from "../utils/output";

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
  .option(
    "-o, --output <format>",
    "Output format (text, table, json)",
    "table"
  )
  .action(async (options: HistoryOptions & { output?: string }) => {
    try {
      const snapshots = await getSnapshotHistory(options);
      const format = parseOutputFormat(options.output);

      if (snapshots.length === 0) {
        const scope = options.branch
          ? `branch '${options.branch}'`
          : "this repository";
        console.log(`No snapshots found for ${scope}.`);
        return;
      }

      if (format === OutputFormat.TEXT) {
        if (options.branch) {
          console.log(`Snapshots for branch '${options.branch}':`);
        } else {
          console.log("Snapshots (all branches):");
        }
      }

      outputSnapshotHistory(snapshots, format);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });
