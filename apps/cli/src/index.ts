#!/usr/bin/env node

import { Command } from "commander";
import analyzeCommand from "./commands/analyze";
import riskCommand from "./commands/risk";
import askCommand from "./commands/ask";
import cyclesCommand from "./commands/cycles";
import historyCommand from "./commands/history";
import impactCommand from "./commands/impact";
import initCommand from "./commands/init";
import { readFileSync } from "fs";
import { join } from "path";

const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
);

const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

program.addCommand(initCommand);
program.addCommand(analyzeCommand);
program.addCommand(riskCommand);
program.addCommand(impactCommand);
program.addCommand(askCommand);
program.addCommand(cyclesCommand);
program.addCommand(historyCommand);

program.parse();
