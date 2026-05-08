import { Command } from "commander";
import { detectRepositoryCycles, ProgressEmitter } from "@repostem/engine";
import { parseOutputFormat, outputCycles, OutputFormat } from "../utils/output";
import { progress } from "../utils/progress";

export default new Command()
  .name("cycles")
  .description("List circular dependency groups")
  .option("-r, --repo <path>", "Path to repository")
  .option("-o, --output <format>", "Output format (text, json, table)", "text")
  .action(async (options: { repo?: string; output?: string }) => {
    const format = parseOutputFormat(options.output);
    
    progress.setEnabled(format !== OutputFormat.JSON);
    
    try {
      const progressEmitter = new ProgressEmitter();
      progress.attachToEmitter(progressEmitter);
      
      const result = await detectRepositoryCycles(options.repo || process.cwd(), progressEmitter);
      
      console.log('');
      
      outputCycles(result, format);
    } catch (error) {
      progress.failSpinner('Cycle detection failed');
      console.error((error as Error).message);
      process.exitCode = 1;
    }
  });