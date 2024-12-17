import { Command } from "commander";
import { InitCommand } from "./commands/init.js";

export const cli = new Command()
  .version(PARAGLIDE_NEXT_VERSION)
  .addCommand(InitCommand);
