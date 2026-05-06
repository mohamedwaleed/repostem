import { calculateHotspots, calculateHotspotTrends, ProgressEmitter } from "@repostem/engine";
import { Command } from "commander";
import { outputHotspot, outputHotspotTrend, parseOutputFormat, OutputFormat } from "../utils/output";
import { progress } from "../utils/progress";

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
    const format = parseOutputFormat(options.output);
    
    // Disable progress for JSON output
    progress.setEnabled(format !== OutputFormat.JSON);
    
    try {
      if (!options.trend && (options.since || options.branch || options.noBranchFilter)) {
        console.error("Error: --since, --branch, and --no-branch-filter can only be used with --trend");
        process.exitCode = 1;
        return;
      }

      const progressEmitter = new ProgressEmitter();
      progress.attachToEmitter(progressEmitter);

      if (options.trend) {
        const trends = await calculateHotspotTrends({ 
          repo: options.repo || process.cwd(),
          since: options.since,
          branch: options.branch,
          noBranchFilter: options.noBranchFilter
        }, 0.05, 5, progressEmitter);
        
        console.log(''); // Add spacing after progress
        outputHotspotTrend(trends, format);
      } else {
        const hotspots = await calculateHotspots(options.repo || process.cwd(), 0.2, 5, progressEmitter);
        
        console.log(''); // Add spacing after progress
        outputHotspot(hotspots, format);
      }
    } catch (err) {
      progress.failSpinner('Hotspot analysis failed');
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });
