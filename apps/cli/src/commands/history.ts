import { Command } from "commander";
import { getSnapshotHistory } from "@repostem/engine";
import { outputSnapshotHistory, parseOutputFormat, OutputFormat } from "../utils/output";
import { progress } from "../utils/progress";

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
  .action(async (options: { repo?: string; branch?: string; output?: string }) => {
    const format = parseOutputFormat(options.output);
    
    // Disable progress for JSON output
    progress.setEnabled(format !== OutputFormat.JSON);
    
    try {
      progress.startSpinner('Loading snapshot history...');
      
      const snapshots = await getSnapshotHistory(options);
      
      progress.succeedSpinner('History loaded!');
      
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
      progress.failSpinner('Failed to load history');
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });
