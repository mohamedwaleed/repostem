import { calculateHotspots, detectDrift } from "@repostem/engine";
import { Command } from "commander";
import { outputDrift, outputHotspot, parseOutputFormat } from "../utils/output";

export default new Command()
  .name("hotspot")
  .description(
    "Analyze hotspots in a repository"
  )
  .option("-r, --repo <path>", "Path to repository")
  .option("-o, --output <format>", "Output format (text, json)", "text")
  .option("--trend", "Show trend over time", false)
  .action(async (options: { repo?: string; output?: string; trend?: boolean }) => {
    try {
      if (options.trend) {
        // TODO: Implement trend analysis
        console.log("Trend analysis not yet implemented");
      } else {
        const hotspots = await calculateHotspots(options.repo || process.cwd());
        outputHotspot(hotspots, parseOutputFormat(options.output));
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });
