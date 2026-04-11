import { Command } from "commander";
import { analyzeRepository } from "@repostem/engine";
import { outputProjectAnalysis, parseOutputFormat } from "../utils/output";

export default new Command()
  .name("analyze")
  .description("Analyze a repository")
  .argument("<path>", "Path to repository")
  .option("-o, --output <format>", "Output format (text, json, table)", "text")
  .action(async (path: string, options: { output?: string }) => {
    const result = await analyzeRepository(path);
    const format = parseOutputFormat(options.output);
    outputProjectAnalysis(result, format);
  });