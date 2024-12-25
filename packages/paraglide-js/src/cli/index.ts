import { Command } from "commander";
import { compileCommand } from "./commands/compile/command.js";
import { ENV_VARIABLES } from "../services/env-variables/index.js";

export { checkForUncommittedChanges } from "./steps/check-for-uncomitted-changes.js";
export { initializeInlangProject } from "./steps/initialize-inlang-project.js";
export { maybeAddSherlock } from "./steps/maybe-add-sherlock.js";
export { maybeChangeTsConfig } from "./steps/update-ts-config.js";
export { promptForOutdir } from "./steps/prompt-for-outdir.js";
export { updatePackageJson } from "./steps/update-package-json.js";
export { runCompiler } from "./steps/run-compiler.js";

export const cli = new Command()
	.name("paraglide-js")
	.addCommand(compileCommand)
	.showHelpAfterError()
	.version(ENV_VARIABLES.PARJS_PACKAGE_VERSION);

export * as Utils from "./utils.js";
export * as Defaults from "./defaults.js";
