import { Command } from "commander";
import { computeFileImpact, ProgressEmitter } from "@repostem/engine";
import { parseOutputFormat, outputFileImpact, OutputFormat } from "../utils/output";
import { progress } from "../utils/progress";

export default new Command()
  .name("impact")
  .description("Show transitive impact of a file.")
  .option("-r, --repo <path>", "Path to repository")
  .argument("<filePath>", "File path to analyze")
  .option("-o, --output <format>", "Output format (text, json, table)", "text")
  .action(async (filePath: string, options: { repo?: string; output?: string }) => {
    const format = parseOutputFormat(options.output);
    
    // Disable progress for JSON output
    progress.setEnabled(format !== OutputFormat.JSON);
    
    try {
      const progressEmitter = new ProgressEmitter();
      progress.attachToEmitter(progressEmitter);
      
      const result = await computeFileImpact(options.repo || process.cwd(), filePath, progressEmitter);
      
      console.log(''); // Add spacing after progress
      
      outputFileImpact(result, format);
    } catch (error) {
      progress.failSpinner('Impact analysis failed');
      throw error;
    }
  });