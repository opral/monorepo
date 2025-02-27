import type { CliStep } from "../utils.js";
import type { Logger } from "../../services/logger/index.js";
import { prompt } from "../utils.js";
import JSON5 from "json5";
import { pathExists } from "../../services/file-handling/exists.js";
// import nodePath from "node:path";

export const maybeUpdateTsConfig: CliStep<
	{ fs: typeof import("node:fs/promises"); logger: Logger },
	unknown
> = async (ctx) => {
	const ctx1 = await maybeUpdateTsConfigAllowJs(ctx);
	return ctx1;
	// return await maybeUpdateTsConfigModuleResolution(ctx1);
};

/**
 * Paraligde JS compiles to JS with JSDoc comments. TypeScript doesn't allow JS files by default.
 */
export const maybeUpdateTsConfigAllowJs: CliStep<
	{ fs: typeof import("node:fs/promises"); logger: Logger },
	unknown
> = async (ctx) => {
	if ((await pathExists("./tsconfig.json", ctx.fs)) === false) {
		return ctx;
	}
	const file = await ctx.fs.readFile("./tsconfig.json", { encoding: "utf-8" });
	// tsconfig allows comments ... FML
	let tsconfig = JSON5.parse(file);

	if (tsconfig.compilerOptions?.allowJs === true) {
		// all clear, allowJs is already set to true
		return ctx;
	}

	ctx.logger.info(
		`The option \`compilerOptions.allowJs\` needs to be set to \`true\` in the \`tsconfig.json\` file:

\`{
  "compilerOptions": {
    "allowJs": true
  }
}\``
	);
	let isValid = false;
	while (isValid === false) {
		const response = await prompt(
			`Is \`compilerOptions.allowJs\` set to \`true\`?`,
			{
				type: "confirm",
				initial: true,
			}
		);
		if (response === false) {
			ctx.logger.warn(
				"Continuing without adjusting the tsconfig.json. This may lead to type errors."
			);
			return ctx;
		}

		// don't re-ask the question if there is an `extends` present in the tsconfig
		// just trust that it's correct.
		if (tsconfig.extends) {
			isValid = true;
			return ctx;
		}

		const file = await ctx.fs.readFile("./tsconfig.json", {
			encoding: "utf-8",
		});
		tsconfig = JSON5.parse(file);
		if (tsconfig?.compilerOptions?.allowJs === true) {
			isValid = true;
			return ctx;
		} else {
			ctx.logger.error(
				"The compiler options has not been adjusted. Please sets `compilerOptions.allowJs` to `true`."
			);
		}
	}
	return ctx;
};

// /**
//  * Ensures that the moduleResolution compiler option is set to "bundler" or similar in the tsconfig.json.
//  *
//  * Otherwise, types defined in `package.exports` are not resolved by TypeScript. Leading to type
//  * errors with Paraglide-JS.
//  */
// const maybeUpdateTsConfigModuleResolution: CliStep<
// 	{ fs: typeof import("node:fs/promises"); logger: Logger },
// 	unknown
// > = async (ctx) => {
// 	if ((await pathExists("./tsconfig.json", ctx.fs)) === false) {
// 		return ctx;
// 	}
// 	const file = await ctx.fs.readFile("./tsconfig.json", {
// 		encoding: "utf-8",
// 	});
// 	// tsconfig allows comments ... FML
// 	let tsconfig = JSON5.parse(file);

// 	let parentTsConfig: any | undefined;

// 	if (tsconfig.extends) {
// 		try {
// 			const parentTsConfigPath = nodePath.resolve(
// 				process.cwd(),
// 				tsconfig.extends
// 			);
// 			const parentTsConfigFile = await ctx.fs.readFile(parentTsConfigPath, {
// 				encoding: "utf-8",
// 			});
// 			parentTsConfig = JSON5.parse(parentTsConfigFile);
// 		} catch {
// 			ctx.logger.warn(
// 				`The tsconfig.json is extended from a tsconfig that couldn't be read. Maybe the file doesn't exist yet or is a NPM package. Continuing without taking the extended from tsconfig into consideration.`
// 			);
// 		}
// 	}

// 	// options that don't support package.exports
// 	const invalidOptions = ["classic", "node", "node10"];
// 	const moduleResolution =
// 		tsconfig.compilerOptions?.moduleResolution ??
// 		parentTsConfig?.compilerOptions?.moduleResolution;

// 	if (
// 		moduleResolution &&
// 		invalidOptions.includes(moduleResolution.toLowerCase()) === false
// 	) {
// 		// the moduleResolution is already set to bundler or similar
// 		return ctx;
// 	}

// 	ctx.logger.info(
// 		`The \`compilerOptions.moduleResolution\` options must be set to "Bundler" in the \`tsconfig.json\` file:

// \`{
//  "compilerOptions": {
//    "moduleResolution": "Bundler"
//  }
// }\``
// 	);
// 	let isValid = false;
// 	while (isValid === false) {
// 		const response = await prompt(
// 			`Is \`compilerOptions.moduleResolution\` set to "Bundler"?`,
// 			{
// 				type: "confirm",
// 				initial: true,
// 			}
// 		);
// 		if (response === false) {
// 			ctx.logger.warn(
// 				"Continuing without adjusting the tsconfig.json. This may lead to type errors."
// 			);
// 			return ctx;
// 		}

// 		// don't re-ask the question if there is an `extends` present in the tsconfig
// 		// just trust that it's correct.
// 		if (tsconfig.extends) {
// 			isValid = true;
// 			return ctx;
// 		}

// 		const file = await ctx.fs.readFile("./tsconfig.json", {
// 			encoding: "utf-8",
// 		});
// 		tsconfig = JSON5.parse(file);
// 		if (
// 			tsconfig?.compilerOptions?.moduleResolution &&
// 			tsconfig.compilerOptions.moduleResolution.toLowerCase() === "bundler"
// 		) {
// 			isValid = true;
// 			return ctx;
// 		} else {
// 			ctx.logger.error(
// 				"The compiler options have not been adjusted. Please set the `compilerOptions.moduleResolution` to `Bundler`."
// 			);
// 		}
// 	}

// 	return ctx;
// };
