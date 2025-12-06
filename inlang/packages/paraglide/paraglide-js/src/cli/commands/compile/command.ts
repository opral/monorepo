import { Command } from "commander";
import { resolve } from "node:path";
import { Logger } from "../../../services/logger/index.js";
import { DEFAULT_OUTDIR, DEFAULT_PROJECT_PATH } from "../../defaults.js";
import { compile } from "../../../compiler/compile.js";
import {
	defaultCompilerOptions,
	type CompilerOptions,
} from "../../../compiler/compiler-options.js";

export const compileCommand = new Command()
	.name("compile")
	.summary("Compiles inlang Paraglide-JS")
	.requiredOption(
		"--project <path>",
		'The path to the inlang project. Example: "./project.inlang"',
		DEFAULT_PROJECT_PATH
	)
	.requiredOption(
		"--outdir <path>",
		'The path to the output directory. Example: "./src/paraglide"',
		DEFAULT_OUTDIR
	)
	.option(
		"--strategy <items...>",
		[
			"The strategy to be used.",
			"",
			"Example: --strategy cookie globalVariable baseLocale",
			"Read more on https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy",
		].join("\n")
	)
	.requiredOption("--silent", "Only log errors to the console", false)
	.option(
		"--emit-ts-declarations",
		"Emit .d.ts files for the generated output (requires the typescript package)",
		defaultCompilerOptions.emitTsDeclarations
	)
	.action(
		async (options: {
			silent: boolean;
			project: string;
			outdir: string;
			strategy?: CompilerOptions["strategy"];
			emitTsDeclarations?: CompilerOptions["emitTsDeclarations"];
		}) => {
			const logger = new Logger({ silent: options.silent, prefix: true });
			const path = resolve(process.cwd(), options.project);

			logger.info(`Compiling inlang project ...`);

			try {
				await compile({
					project: path,
					outdir: options.outdir,
					strategy: options.strategy ?? defaultCompilerOptions.strategy,
					emitTsDeclarations:
						options.emitTsDeclarations ??
						defaultCompilerOptions.emitTsDeclarations,
				});
			} catch (e) {
				logger.error("Error while compiling inlang project.");
				logger.error(e);
				process.exit(1);
			}

			logger.success(`Successfully compiled inlang project.`);

			process.exit(0);
		}
	);
