import type { Logger } from "../../services/logger/index.js";
import type { CliStep } from "../utils.js";
import { prompt } from "../utils.js";
import { updatePackageJson } from "./update-package-json.js";
import path from "node:path";

export const maybeAddMachineTranslation: CliStep<
	{
		fs: typeof import("node:fs/promises");
		logger: Logger;
		projectPath: string;
		root: string;
		packageJsonPath: string;
	},
	{
		fs: typeof import("node:fs/promises");
		logger: Logger;
		projectPath: string;
		root: string;
		packageJsonPath: string;
	}
> = async (ctx) => {
	// Prompt for machine translation
	const useMachineTranslation = await prompt(
		`Do you want to set up machine translations?`,
		{
			type: "confirm",
			initial: true,
		}
	);

	if (!useMachineTranslation) {
		return ctx;
	}

	try {
		// Determine the relative path from root to project
		const relativePath = path.relative(ctx.root, ctx.projectPath);

		// Use updatePackageJson to add @inlang/cli to devDependencies and machine-translate script
		await updatePackageJson({
			devDependencies: async (devDeps) => {
				// exists already
				if (devDeps["@inlang/cli"]) return devDeps;
				return {
					...devDeps,
					"@inlang/cli": "^3.0.0",
				};
			},
			scripts: async (scripts) => {
				// exists already
				if (scripts["machine-translate"]) return scripts;
				return {
					...scripts,
					"machine-translate": `inlang machine translate --project ${relativePath}`,
				};
			},
		})(ctx);

		ctx.logger.success(
			"Added @inlang/cli and machine-translate script to package.json"
		);
	} catch (error) {
		ctx.logger.error(
			[
				"Failed to set up machine translation. Please add it manually:",
				"1. Add @inlang/cli to devDependencies",
				"2. Add a machine-translate script to package.json",
				error,
			].join("\n")
		);
	}

	return ctx;
};
