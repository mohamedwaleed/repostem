import { Command } from "commander";
import { parseOutputFormat, OutputFormat } from "../utils/output";
import { ask, ProgressEmitter } from "@repostem/engine";
import { progress } from "../utils/progress";

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
    repo?: string;
    branch?: string;
    noBranchFilter?: boolean;
    since?: string;
  }) => {
    const format = parseOutputFormat(options.output);
    
    // Disable progress for JSON output
    progress.setEnabled(format !== OutputFormat.JSON);
    
    try {
      const progressEmitter = new ProgressEmitter();
      progress.attachToEmitter(progressEmitter);
      
      const result = await ask(question, options.repo || process.cwd(), {
        branch: options.branch,
        noBranchFilter: options.noBranchFilter,
        since: options.since
      }, progressEmitter);
      
      console.log(''); // Add spacing after progress
      console.log(result);
    } catch (error) {
      progress.failSpinner('Failed to generate response');
      console.error((error as Error).message);
      process.exitCode = 1;
    }
  });