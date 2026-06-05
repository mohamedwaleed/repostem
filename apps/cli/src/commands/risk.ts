import { Command } from "commander";
import { analyzeFileRisk, ProgressEmitter } from "@repostem/engine";
import { parseOutputFormat, outputFileRisk, OutputFormat } from "../utils/output";
import { progress } from "../utils/progress";

export default new Command()
  .name("risk")
  .description("Compute structural risk for a specific file")
  .option("-r, --repo <path>", "Path to repository")
  .argument("<filePath>", "File path to analyze")
  .option("-o, --output <format>", "Output format (text, json, table)", "text")
  .action(async (filePath: string, options: { repo?: string; output?: string }) => {
    const format = parseOutputFormat(options.output);
    
    progress.setEnabled(format !== OutputFormat.JSON);
    
    try {
      const progressEmitter = new ProgressEmitter();
      progress.attachToEmitter(progressEmitter);
      
      const result = await analyzeFileRisk(options.repo || process.cwd(), filePath, progressEmitter);
      
      console.log('');
      
      outputFileRisk(result, format);
    } catch (error) {
      progress.failSpinner('Risk analysis failed');
      console.error((error as Error).message);
      process.exitCode = 1;
    }
  });