#!/usr/bin/env node

import { Command } from "commander";
import analyzeCommand from "./commands/analyze";
import riskCommand from "./commands/risk";
import askCommand from "./commands/ask";
import cyclesCommand from "./commands/cycles";
import impactCommand from "./commands/impact";
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

program.addCommand(analyzeCommand);
program.addCommand(riskCommand);
program.addCommand(impactCommand);
program.addCommand(askCommand);
program.addCommand(cyclesCommand);

program.parse();
