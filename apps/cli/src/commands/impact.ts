import { Command } from "commander";
import { computeFileImpact } from "@repostem/engine";
import { parseOutputFormat, outputFileImpact } from "../utils/output";

export default new Command()
  .name("impact")
  .description("Show transitive impact of a file.")
  .option("-r, --repo <path>", "Path to repository")
  .argument("<filePath>", "File path to analyze")
  .option("-o, --output <format>", "Output format (text, json, table)", "text")
  .action(async (filePath: string, options: { repo?: string; output?: string }) => {
    const result = await computeFileImpact(options.repo || process.cwd(), filePath);
    const format = parseOutputFormat(options.output);
    outputFileImpact(result, format);
  });