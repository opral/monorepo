import { Command } from "commander";
import * as nodePath from "node:path";
import { Logger } from "../../../services/logger/index.js";
import { findPackageJson } from "../../../services/environment/package.js";
import { checkForUncommittedChanges } from "../../steps/check-for-uncomitted-changes.js";
import { initializeInlangProject } from "../../steps/initialize-inlang-project.js";
import { maybeAddSherlock } from "../../steps/maybe-add-sherlock.js";
import { maybeUpdateTsConfig } from "../../steps/update-ts-config.js";
import { promptForOutdir } from "../../steps/prompt-for-outdir.js";
import { updatePackageJson } from "../../steps/update-package-json.js";
import type { CliStep } from "../../utils.js";
import nodeFs from "node:fs";
import { ENV_VARIABLES } from "../../../services/env-variables/index.js";
import { detectBundler } from "../../steps/detect-bundler.js";
import { addVitePlugin } from "../../steps/add-vite-plugin.js";
import { compile } from "../../../compiler/compile.js";
import { maybeAddMachineTranslation } from "../../steps/maybe-add-machine-translation.js";

export const initCommand = new Command()
	.name("init")
	.summary("Initializes inlang Paraglide-JS.")
	.action(async () => {
		const logger = new Logger({ silent: false, prefix: false });

		logger.box("Welcome to inlang Paraglide JS 🪂");

		const ctx = {
			logger,
			fs: nodeFs.promises,
			syncFs: nodeFs,
			root: process.cwd(),
		} as const;

		const ctx1 = await checkForUncommittedChanges(ctx);
		const ctx2 = await enforcePackageJsonExists(ctx1);
		const ctx3 = await initializeInlangProject(ctx2);
		const ctx4 = await promptForOutdir(ctx3);
		const ctx5 = await addParaglideJsToDevDependencies(ctx4);
		const ctx6 = await detectBundler(ctx5);

		if (ctx6.bundler === "vite") {
			await addVitePlugin(ctx6);
		} else {
			await addCompileStepToPackageJSON(ctx6);
		}

		const ctx7 = await maybeUpdateTsConfig(ctx6);
		const ctx8 = await maybeAddSherlock(ctx7);
		const ctx9 = await maybeAddMachineTranslation(ctx8);

		try {
			await compile({
				project: ctx9.projectPath,
				outdir: ctx9.outdir,
			});
			ctx.logger.success("Ran the paraglide compiler");
		} catch {
			ctx.logger.warn(
				"Failed to compile project automatically. You will need to run the compiler manually"
			);
		}

		const successMessage = [
			`inlang Paraglide-JS has been set up sucessfully.`,
			"\n",
			`1. Run your install command (npm i, yarn install, etc)`,
			`2. Run the build script (npm run build, or similar.)`,
			`3. Visit https://inlang.com/m/gerre34r/library-inlang-paraglideJs/basics to get started.`,
			"\n",
			`For questions and feedback, visit`,
			`https://github.com/opral/inlang-paraglide-js/issues`,
		].join("\n");
		ctx.logger.box(successMessage);
		process.exit(0);
	});

const addParaglideJsToDevDependencies: CliStep<
	{
		fs: typeof import("node:fs/promises");
		logger: Logger;
		packageJsonPath: string;
	},
	unknown
> = async (ctx) => {
	const ctx1 = await updatePackageJson({
		devDependencies: async (devDeps) => ({
			...devDeps,
			"@inlang/paraglide-js": ENV_VARIABLES.PARJS_PACKAGE_VERSION,
		}),
	})(ctx);
	ctx.logger.success(
		"Added @inlang/paraglide-js to the devDependencies in package.json."
	);
	return ctx1;
};

const enforcePackageJsonExists: CliStep<
	{ logger: Logger; fs: typeof import("node:fs/promises") },
	{ packageJsonPath: string }
> = async (ctx) => {
	const packageJsonPath = await findPackageJson(ctx.fs, process.cwd());
	if (!packageJsonPath) {
		ctx.logger.warn(
			"No package.json found in the current working directory. Please change the working directory to the directory with a package.json file."
		);
		return process.exit(0);
	}
	return { ...ctx, packageJsonPath };
};

const addCompileStepToPackageJSON: CliStep<
	{
		fs: typeof import("node:fs/promises");
		logger: Logger;
		projectPath: string;
		outdir: string;
		packageJsonPath: string;
	},
	unknown
> = async (ctx) => {
	const projectPath = "./" + nodePath.relative(process.cwd(), ctx.projectPath);
	const outdir = "./" + nodePath.relative(process.cwd(), ctx.outdir);

	ctx = await updatePackageJson({
		scripts: async (scripts) => {
			if (scripts.build === undefined) {
				scripts.build = `paraglide-js compile --project ${projectPath} --outdir ${outdir}`;
			} else if (scripts.build.includes("paraglide-js compile") === false) {
				scripts.build = `paraglide-js compile --project ${projectPath} --outdir ${outdir} && ${scripts.build}`;
			} else {
				return scripts;
			}

			ctx.logger.success(
				"Added the compile command to the build step in package.json."
			);
			ctx.logger.info(
				`If you use a bundler like Vite, Rolldown, or Webpack, you can use a bundler plugin instead and remove the compile command from the build script.`
			);
			ctx.logger.info(
				`Visit https://inlang.com/m/gerre34r/library-inlang-paraglideJs/compiling-messages for more information.`
			);
			return scripts;
		},
	})(ctx);

	return ctx;
};
