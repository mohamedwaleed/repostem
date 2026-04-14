import { Command } from "commander";
import { parseOutputFormat, outputFileImpact } from "../utils/output";
import { ask } from "@repostem/engine";

export default new Command()
  .name("ask")
  .description("AI explanation of file-level structural metrics")
  .argument("<question>", "Question about a specific file")
  .addHelpText('after', `
    Examples:
    ask "What are the risks in src/utils.js?"
    ask "What would break if I change src/components/Button.tsx?"
    ask "Is src/api/client.js fragile?"
    ask "Show me the impact of modifying src/core/engine.ts"
  `)
  .option("-o, --output <format>", "Output format (text, json, table)", "text")
  .option("-r, --repo <path>", "Repository path", process.cwd())
  .action(async (question: string, options: { output?: string; repo?: string }) => {
    try{
      const result = await ask(question, options.repo || process.cwd());
      console.log(result);
    } catch (error) {
      console.error((error as Error).message);
    }
  });