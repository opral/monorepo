import { Command } from "commander";
import { build } from "./build/command.js";

export const plugin = new Command()
  .command("plugin")
  .description("Commands for inlang plugins.")
  .argument("[command]")
  .addCommand(build);
