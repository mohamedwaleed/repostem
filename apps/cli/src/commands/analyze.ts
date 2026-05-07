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
    
    // Disable progress for JSON output
    progress.setEnabled(format !== OutputFormat.JSON);
    
    try {
      // Create progress emitter and attach to progress manager
      const progressEmitter = new ProgressEmitter();
      progress.attachToEmitter(progressEmitter);
      
      const result = await analyzeRepository(options.repo || process.cwd(), progressEmitter);
      
      console.log(''); // Add spacing after progress
      
      if (result.warning) {
        console.warn(`⚠️  Warning: ${result.warning}\n`);
      }
      
      outputProjectAnalysis(result.analysis, format);
      
      if (result.persisted) {
        console.log(`\n✓ Snapshot persisted (ID: ${result.snapshotId})\n`);
      }
    } catch (error) {
      progress.failSpinner('Analysis failed');
      throw error;
    }
  });
