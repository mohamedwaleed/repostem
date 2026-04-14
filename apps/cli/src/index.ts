#!/usr/bin/env node

import { Command } from "commander";
import packageJson from "../../../package.json";
import analyzeCommand from "./commands/analyze";
import riskCommand from "./commands/risk";
import askCommand from "./commands/ask";
import cyclesCommand from "./commands/cycles";
import impactCommand from "./commands/impact";

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
