import { Command } from "commander";
import { detectRepositoryCycles } from "@repostem/engine";
import { parseOutputFormat, outputFileImpact } from "../utils/output";

export default new Command()
  .name("cycles")
  .description("List circular dependency groups")
  .option("-r, --repo <path>", "Path to repository")
  .option("-o, --output <format>", "Output format (text, json, table)", "text")
  .action(async (options: { repo?: string; output?: string }) => {
    const result = await detectRepositoryCycles(options.repo || process.cwd());
    const format = parseOutputFormat(options.output);
    outputFileImpact(result, format);
  });