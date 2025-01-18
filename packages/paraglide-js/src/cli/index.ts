import { Command } from "commander";
import { compileCommand } from "./commands/compile/command.js";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import { initCommand } from "./commands/init/command.js";

export const cli = new Command()
	.name("paraglide-js")
	.addCommand(compileCommand)
	.addCommand(initCommand)
	.showHelpAfterError()
	.version(ENV_VARIABLES.PARJS_PACKAGE_VERSION);

export * as Utils from "./utils.js";
export * as Defaults from "./defaults.js";
export * as Steps from "./steps/index.js";
export { Logger } from "../services/logger/index.js";