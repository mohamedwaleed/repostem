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
    ask "What are the hotspots?"
    ask "What has changed in the architecture?"
    ask "What is the trend of hotspots?"
  `)
  .option("-o, --output <format>", "Output format (text, json, table)", "text")
  .option("-r, --repo <path>", "Repository path", process.cwd())
  .option(
    "-b, --branch <name>",
    "Filter by branch (defaults to the current Git branch when in a Git repo)"
  )
  .option(
    "--no-branch-filter",
    "Show snapshots from every branch (overrides branch detection)"
  )
  .option("--since <id>", "Snapshot ID to compare against (from history)")
  .action(async (question: string, options: {
    output?: string;
    repo?: string;
    branch?: string;
    noBranchFilter?: boolean;
    since?: string;
  }) => {
    try{
      const result = await ask(question, options.repo || process.cwd(), {
        branch: options.branch,
        noBranchFilter: options.noBranchFilter,
        since: options.since
      });
      console.log(result);
    } catch (error) {
      console.error((error as Error).message);
    }
  });