import { Command } from "commander";
import { analyzeRepository, ProgressEmitter } from "@repostem/engine";
import { outputProjectAnalysis, parseOutputFormat, OutputFormat } from "../utils/output";
import { progress } from "../utils/progress";

export default new Command()
  .name("analyze")
  .description("Run full structural analysis on the repository and print project-level structural summary")
  .option("-r, --repo <path>", "Path to repository")
  .option("-o, --output <format>", "Output format (text, json, table)", "text")
  .action(async (options: { repo?: string; output?: string }) => {
    const format = parseOutputFormat(options.output);
    
    progress.setEnabled(format !== OutputFormat.JSON);
    
    try {
      const progressEmitter = new ProgressEmitter();
      progress.attachToEmitter(progressEmitter);
      
      const result = await analyzeRepository(options.repo || process.cwd(), progressEmitter);
      
      console.log('');
      
      if (result.warning) {
        console.warn(`\n⚠ Warning: ${result.warning}\n`);
      }
      
      outputProjectAnalysis(result.analysis, format);
      
      if (result.persisted) {
        console.log(`\n✓ Snapshot persisted (ID: ${result.snapshotId})\n`);
      }
    } catch (error) {
      progress.failSpinner('Analysis failed');
      console.error((error as Error).message);
      process.exitCode = 1;
    }
  });
