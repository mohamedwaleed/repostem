import { Command } from "commander";
import { analyzeFileRisk } from "@repostem/engine";
import { parseOutputFormat, outputFileRisk } from "../utils/output";

export default new Command()
  .name("risk")
  .description("Compute structural risk for a specific file")
  .option("-r, --repo <path>", "Path to repository")
  .argument("<filePath>", "File path to analyze")
  .option("-o, --output <format>", "Output format (text, json, table)", "text")
  .action(async (filePath: string, options: { repo?: string; output?: string }) => {
    const result = await analyzeFileRisk(options.repo || process.cwd(), filePath);
    const format = parseOutputFormat(options.output);
    outputFileRisk(result, format);
  });