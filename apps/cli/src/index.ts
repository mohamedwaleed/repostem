#!/usr/bin/env node

import { Command } from "commander";
import packageJson from "../../../package.json";
import analyzeCommand from "./commands/analyze";

const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

program.addCommand(analyzeCommand);

program.parse();
