import { detectDrift } from "@repostem/engine";
import { Command } from "commander";
import { outputDrift, parseOutputFormat } from "../utils/output";

export default new Command()
  .name("drift")
  .description(
    "Analyze changes between two snapshots"
  )
  .option("-r, --repo <path>", "Path to repository")
  .option("-o, --output <format>", "Output format (text, json)", "text")
  .option(
    "-b, --branch <name>",
    "Filter by branch (defaults to the current Git branch when in a Git repo)"
  )
  .option(
    "--no-branch-filter",
    "Show snapshots from every branch (overrides branch detection)"
  )
  .option("--since <id>", "Snapshot ID to compare against (from history)")
  .action(async (options: { repo?: string; branch?: string; output?: string; since?: string }) => {
    try {
      const drift = await detectDrift(options);
      const format = parseOutputFormat(options.output);
      outputDrift(drift, format);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });
