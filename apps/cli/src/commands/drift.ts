import { detectDrift } from "@repostem/engine";
import { Command } from "commander";
import { outputDrift, parseOutputFormat, OutputFormat } from "../utils/output";
import { progress } from "../utils/progress";

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
    const format = parseOutputFormat(options.output);
    
    // Disable progress for JSON output
    progress.setEnabled(format !== OutputFormat.JSON);
    
    try {
      progress.startSpinner('Loading snapshots...');
      
      progress.updateSpinner('Computing architectural drift...');
      
      const drift = await detectDrift(options);
      
      progress.succeedSpinner('Drift analysis complete!');
      
      outputDrift(drift, format);
    } catch (err) {
      progress.failSpinner('Drift analysis failed');
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });
