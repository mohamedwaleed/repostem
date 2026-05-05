import { calculateHotspots, calculateHotspotTrends } from "@repostem/engine";
import { Command } from "commander";
import { outputHotspot, outputHotspotTrend, parseOutputFormat } from "../utils/output";

export default new Command()
  .name("hotspot")
  .description(
    "Analyze hotspots in a repository"
  )
  .option("-r, --repo <path>", "Path to repository")
  .option("-o, --output <format>", "Output format (text, json)", "text")
  .option("--trend", "Show trend over time", false)
  .option("--since <snapshotId>", "Compare with specific snapshot (only with --trend)")
  .option("--branch <name>", "Filter snapshots by branch (only with --trend)")
  .option("--no-branch-filter", "Disable branch filtering (only with --trend)")
  .action(async (options: { 
    repo?: string; 
    output?: string; 
    trend?: boolean;
    since?: string;
    branch?: string;
    noBranchFilter?: boolean;
  }) => {
    try {
      if (!options.trend && (options.since || options.branch || options.noBranchFilter)) {
        console.error("Error: --since, --branch, and --no-branch-filter can only be used with --trend");
        process.exitCode = 1;
        return;
      }

      if (options.trend) {
        const trends = await calculateHotspotTrends({ 
          repo: options.repo || process.cwd(),
          since: options.since,
          branch: options.branch,
          noBranchFilter: options.noBranchFilter
        });
        outputHotspotTrend(trends, parseOutputFormat(options.output));
      } else {
        const hotspots = await calculateHotspots(options.repo || process.cwd());
        outputHotspot(hotspots, parseOutputFormat(options.output));
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });
