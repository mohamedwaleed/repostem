import { Command } from "commander";
import { analyzeRepository } from "@repostem/engine";

export default new Command()
  .name("analyze")
  .description("Analyze a repository")
  .argument("<path>", "Path to repository")
  .option("-o, --output <format>", "Output format (json, markdown, html)")
  .action(async (path: string, options: { output?: string }) => {
    const result = await analyzeRepository(path);
    console.log(result);
  });