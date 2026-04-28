import { Command } from "commander";
import { analyzeRepository } from "@repostem/engine";
import { outputProjectAnalysis, parseOutputFormat } from "../utils/output";

export default new Command()
  .name("analyze")
  .description("Run full structural analysis on the repository and print project-level structural summary")
  .option("-r, --repo <path>", "Path to repository")
  .option("-o, --output <format>", "Output format (text, json, table)", "text")
  .action(async (options: { repo?: string; output?: string }) => {
    const result = await analyzeRepository(options.repo || process.cwd());
    const format = parseOutputFormat(options.output);
    
    if (result.warning) {
      console.warn(`\n⚠️  Warning: ${result.warning}\n`);
    }
    
    outputProjectAnalysis(result.analysis, format);
    
    if (result.persisted) {
      console.log(`\n✓ Snapshot persisted (ID: ${result.snapshotId})\n`);
    }
  });